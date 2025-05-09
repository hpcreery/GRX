import REGL from "regl"
import { vec2, vec3, mat3 } from "gl-matrix"
import * as Shapes from "./shapes"
import * as Symbols from "./symbols"
import { BoundingBox, FeatureTypeIdentifier, SnapMode, SNAP_MODES_MAP } from "./types"
import ShapeTransform from "./transform"

import { DatumShaderCollection, DatumTextShaderCollection, ReglRenderers, TLoadedReglRenderers } from "./collections"

import { ShapesShaderCollection, MacroShaderCollection, StepAndRepeatCollection } from "./collections"

import type { UniverseContext } from "./engine"
import { getScaleMat3 } from "./utils"
import { WorldContext } from "./step"

const { SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

import { settings, grid, origin } from "./settings"

interface CommonAttributes {}

interface CommonUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_QtyFeatures: number
  u_IndexOffset: number
  u_Polarity: number
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
}

interface QueryUniforms {
  u_QueryMode: boolean
  u_Color: vec3
  u_Alpha: number
  u_PointerPosition: vec2
  u_SnapMode: number
}
interface QueryAttributes {}

interface QueryProps {
  pointer: vec2
  snapMode: number
}

interface DatumConfigUniforms {
  u_Color: vec3
  u_Alpha: number
}

export interface RendererProps {
  regl: REGL.Regl
  ctx: OffscreenCanvasRenderingContext2D
}

export interface ShapeProps {
  image: Shapes.Shape[]
  transform?: Partial<ShapeTransform>
}

export interface ShapeRendererProps extends RendererProps, ShapeProps {}

interface ShapeRendererCommonContext {
  qtyFeaturesRef: number
  prevQtyFeaturesRef: number
  transformMatrix: mat3
}

export type ShapeDistance = {
  snapPoint: vec2
  shape: Shapes.Shape
  children: ShapeDistance[]
}

export class ShapeRenderer {
  public regl: REGL.Regl
  public ctx: OffscreenCanvasRenderingContext2D
  public dirty = false
  // ** unfortunately, onChange adds a lot of overhead to the records array and it's not really needed
  // public readonly records: Shapes.Shape[] = onChange([], (path, value, prev, apply) => {
  //   // console.log('records changed', { path, value, prev, apply })
  //   onChange.target(this.records).map((record, i) => (record.index = i))
  //   this.dirty = true
  // })
  public readonly image: Shapes.Shape[] = []
  // public selection: SelectShapes[] = []

  public shapeCollection: ShapesShaderCollection
  public macroCollection: MacroShaderCollection
  public stepAndRepeatCollection: StepAndRepeatCollection
  public datumCollection: DatumShaderCollection
  public datumTextCollection: DatumTextShaderCollection

  public get qtyFeatures(): number {
    return this.image.length
  }

  protected commonConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext>
  protected queryConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext>
  protected datumConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext>
  protected drawCollections: TLoadedReglRenderers
  public surfaceFrameBuffer: REGL.Framebuffer2D
  public queryFrameBuffer: REGL.Framebuffer2D

  public transform: ShapeTransform = new ShapeTransform()

  public distanceQueryRaw: Float32Array = new Float32Array(0)
  public distanceRightQueryRaw: Float32Array = new Float32Array(0)
  public distanceLeftQueryRaw: Float32Array = new Float32Array(0)
  public distanceUpQueryRaw: Float32Array = new Float32Array(0)
  public distanceDownQueryRaw: Float32Array = new Float32Array(0)

  constructor(props: ShapeRendererProps) {
    this.regl = props.regl
    this.ctx = props.ctx

    if (props.transform) {
      Object.assign(this.transform, props.transform)
    }

    this.image = props.image
    this.breakStepRepeats()
    this.indexImage()

    this.shapeCollection = new ShapesShaderCollection({
      regl: this.regl,
    })
    this.macroCollection = new MacroShaderCollection({
      regl: this.regl,
      ctx: this.ctx,
    })
    this.stepAndRepeatCollection = new StepAndRepeatCollection({
      regl: this.regl,
      ctx: this.ctx,
    })
    this.datumCollection = new DatumShaderCollection({
      regl: this.regl,
    })
    this.datumTextCollection = new DatumTextShaderCollection({
      regl: this.regl,
    })
    this.shapeCollection.refresh(this.image)
    this.macroCollection.refresh(this.image)
    this.stepAndRepeatCollection.refresh(this.image)
    this.datumCollection.refresh(this.image)
    this.datumTextCollection.refresh(this.image)

    this.commonConfig = this.regl<
      CommonUniforms,
      CommonAttributes,
      Record<string, never>,
      ShapeRendererCommonContext,
      REGL.DefaultContext & UniverseContext
    >({
      depth: {
        enable: true,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
      cull: {
        enable: false,
        face: "back",
      },
      context: {
        transformMatrix: () => this.transform.matrix,
        prevQtyFeaturesRef: (context: REGL.DefaultContext & UniverseContext & Partial<ShapeRendererCommonContext>) => context.qtyFeaturesRef ?? 1,
        qtyFeaturesRef: (context: REGL.DefaultContext & UniverseContext & Partial<ShapeRendererCommonContext>) =>
          this.qtyFeatures * (context.qtyFeaturesRef ?? 1),
      },
      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.inverseMatrix,
        u_SymbolsTexture: () => this.shapeCollection.symbolsCollection.texture,
        u_SymbolsTextureDimensions: () => [
          this.shapeCollection.symbolsCollection.texture.width,
          this.shapeCollection.symbolsCollection.texture.height,
        ],
        u_IndexOffset: (context: REGL.DefaultContext & UniverseContext & Partial<ShapeRendererCommonContext>) => {
          return this.transform.index / (context.prevQtyFeaturesRef ?? 1)
        },
        u_QtyFeatures: (context: REGL.DefaultContext & UniverseContext & Partial<ShapeRendererCommonContext>) => {
          return context.qtyFeaturesRef ?? 0
        },
        u_Polarity: () => this.transform.polarity,
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Symbols.${key}`]: value }), {}),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }), {}),
        ...Object.entries(SNAP_MODES_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_SnapModes.${key}`]: value }), {}),
      },
    })

    this.queryConfig = this.regl<QueryUniforms, QueryAttributes, QueryProps, ShapeRendererCommonContext, REGL.DefaultContext & UniverseContext>({
      uniforms: {
        u_QueryMode: true,
        u_Color: [1, 1, 1],
        u_Alpha: 1,
        u_PointerPosition: this.regl.prop<QueryProps, "pointer">("pointer"),
        u_SnapMode: this.regl.prop<QueryProps, "snapMode">("snapMode"),
      },
    })

    this.datumConfig = this.regl<DatumConfigUniforms, Record<string, never>, Record<string, never>, UniverseContext>({
      depth: {
        enable: false,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
      blend: {
        enable: true,

        func: {
          srcRGB: "src alpha",
          srcAlpha: "src alpha",
          dstRGB: "one minus src alpha",
          dstAlpha: "one minus src alpha",
        },

        equation: {
          rgb: "add",
          alpha: "add",
        },
        color: [0, 0, 0, 0],
      },
      uniforms: {
        u_Color: (context: UniverseContext) => {
          return [1 - settings.BACKGROUND_COLOR[2], 1 - settings.BACKGROUND_COLOR[1], 1 - settings.BACKGROUND_COLOR[0]]
        },
        u_Alpha: () => 1,
      },
    })

    this.drawCollections = ReglRenderers as TLoadedReglRenderers

    this.queryFrameBuffer = this.regl.framebuffer({
      depth: true,
      colorType: "float",
      // colorFormat: "rgba32f",
    })
    this.surfaceFrameBuffer = this.regl.framebuffer({
      depth: true,
      colorType: "float",
    })
  }

  private drawMacros(context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
    this.macroCollection.macros.forEach((macro) => {
      macro.records.forEach((record) => {
        macro.renderer.updateTransformFromPad(record)
        macro.renderer.render(context)
      })
    })
    return this
  }

  private drawStepAndRepeats(context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
    this.stepAndRepeatCollection.steps.forEach((stepAndRepeat) => {
      stepAndRepeat.render(context)
    })
    return this
  }

  private drawSurfaceWithHoles(context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
    if (this.shapeCollection.shaderAttachment.surfacesWithHoles.length === 0) return this
    this.surfaceFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
    this.shapeCollection.shaderAttachment.surfacesWithHoles.forEach((attachment) => {
      this.regl.clear({
        framebuffer: this.surfaceFrameBuffer,
        color: [0, 0, 0, 1],
        depth: 0,
      })
      this.surfaceFrameBuffer.use(() => {
        this.drawCollections.drawSurfaces(attachment)
      })
      this.drawCollections.drawFrameBuffer({
        renderTexture: this.surfaceFrameBuffer,
        qtyFeatures: this.qtyFeatures,
        index: attachment.surfaceIndex,
        polarity: attachment.surfacePolarity,
      })
    })
    return this
  }

  public indexImage(): this {
    this.image.map((record, i) => (record.index = i))
    return this
  }

  public breakStepRepeats(): this {
    for (let i = 0; i < this.image.length; i++) {
      const record = this.image[i]
      if (record.type === FeatureTypeIdentifier.STEP_AND_REPEAT) {
        if (record.break === false) continue
        const brokenimage = breakStepRepeat(record, this.transform)
        if (brokenimage !== undefined) this.image.splice(i, 1, ...brokenimage)
      }
    }
    return this
  }

  /**
   * Converts the pointer applying the current transform
   * Does not mutate the original pointer, returns a new pointer
   * @param pointer vec2 - the pointer to transform
   * @returns vec2 - the transformed pointer
   */
  protected transformPointer(pointer: vec2): vec2 {
    const pointerTransform = new ShapeTransform()
    Object.assign(pointerTransform, this.transform)
    pointerTransform.update(mat3.create())
    const newPointer = vec2.transformMat3(vec2.create(), pointer, pointerTransform.inverseMatrix)
    return newPointer
  }

  /**
   * Converts the point applying the current transform
   * Mutates the original direction
   * @param point vec2 - the point to transform
   * @returns vec2 - the transformed point
   */
  protected transformPoint(point: vec2): vec2 {
    const directionTransform = new ShapeTransform()
    Object.assign(directionTransform, this.transform)
    directionTransform.update(mat3.create())
    vec2.transformMat3(point, point, directionTransform.matrix)
    return point
  }

  public queryDistance(pointer: vec2, snapMode: SnapMode, context: REGL.DefaultContext & UniverseContext & WorldContext): ShapeDistance[] {
    const origMatrix = mat3.clone(context.transformMatrix)
    this.transform.update(context.transformMatrix)
    const transformedPointer = this.transformPointer(pointer)
    context.transformMatrix = this.transform.matrix
    if (this.qtyFeatures > context.viewportWidth * context.viewportHeight) {
      console.error("Too many features to query")
      // TODO! for too many features, make multiple render passes in order to query all features
      return []
    }
    this.queryFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
    const width = this.qtyFeatures < context.viewportWidth ? this.qtyFeatures % context.viewportWidth : context.viewportWidth
    const height = Math.ceil(this.qtyFeatures / context.viewportWidth)

    const bufferLength = width * height * 4
    if (this.distanceQueryRaw.length != bufferLength) {
      this.distanceQueryRaw = new Float32Array(bufferLength)
      this.distanceLeftQueryRaw = new Float32Array(bufferLength)
      this.distanceRightQueryRaw = new Float32Array(bufferLength)
      this.distanceUpQueryRaw = new Float32Array(bufferLength)
      this.distanceDownQueryRaw = new Float32Array(bufferLength)
    }

    const renderDistance = (pointer: vec2, store: Float32Array): void => {
      this.regl.clear({
        framebuffer: this.queryFrameBuffer,
        // in the color buffer, the first value is the distance, the next two are the direction, the last is to indicate there is a measurement at all. (0 = empty)
        color: [0, 0, 0, 0],
        depth: 0,
      })
      this.queryFrameBuffer.use(() => {
        this.commonConfig(() => {
          this.queryConfig({ pointer, snapMode: SNAP_MODES_MAP[snapMode] }, () => {
            this.drawPrimitives(context)
            this.drawDatums(context)
          })
        })
      })
      this.regl.read<Float32Array>({
        framebuffer: this.queryFrameBuffer,
        x: 0,
        y: 0,
        width: width,
        height: height,
        data: store,
      })
    }

    renderDistance(transformedPointer, this.distanceQueryRaw)
    const scale = Math.sqrt(context.transformMatrix[0] ** 2 + context.transformMatrix[1] ** 2) * context.viewportWidth
    const epsilons = 1 / scale
    renderDistance(vec2.add(vec2.create(), transformedPointer, vec2.fromValues(epsilons, 0)), this.distanceRightQueryRaw)
    renderDistance(vec2.add(vec2.create(), transformedPointer, vec2.fromValues(-epsilons, 0)), this.distanceLeftQueryRaw)
    renderDistance(vec2.add(vec2.create(), transformedPointer, vec2.fromValues(0, epsilons)), this.distanceUpQueryRaw)
    renderDistance(vec2.add(vec2.create(), transformedPointer, vec2.fromValues(0, -epsilons)), this.distanceDownQueryRaw)

    const distData = this.distanceQueryRaw

    const distances: ShapeDistance[] = []
    let closestIndex: number | undefined = undefined
    for (let i = 0; i < distData.length; i += 4) {
      // the last value is to indicate there is a measurement at all. (0 = empty)
      if (distData[i + 3] == 0) continue
      let distance = distData[i]
      distance *= this.transform.scale

      // const direction = vec2.fromValues(distData[i + 1], distData[i + 2])
      const direction = vec2.fromValues(
        this.distanceRightQueryRaw[i] - this.distanceLeftQueryRaw[i],
        this.distanceUpQueryRaw[i] - this.distanceDownQueryRaw[i],
      )
      vec2.normalize(direction, direction)
      // the reason for the division by scale is that the distance is in the transformed space, so we need to scale it back to the original space
      vec2.scale(direction, direction, 1 / this.transform.scale)

      const snapPoint = vec2.create()
      vec2.sub(snapPoint, transformedPointer, vec2.scale(vec2.create(), direction, distance))
      this.transformPoint(snapPoint)

      distances.push({
        shape: this.image[i / 4],
        snapPoint,
        children: [],
      })
      if (closestIndex == undefined) {
        closestIndex = i
      }
      if (distance < distData[closestIndex]) {
        closestIndex = i
      }
    }

    this.macroCollection.macros.forEach((macro) => {
      macro.records.forEach((record) => {
        macro.renderer.updateTransformFromPad(record)
        macro.renderer.transform.index = 0
        const macroFeatures = macro.renderer.queryDistance(transformedPointer, snapMode, context)
        if (macroFeatures.length > 0) {
          macroFeatures.map((measurement) => this.transformPoint(measurement.snapPoint))
          const closest = macroFeatures.reduce((prev, current) => {
            const prevDist = vec2.distance(pointer, prev.snapPoint)
            const currentDist = vec2.distance(pointer, current.snapPoint)
            return prevDist < currentDist ? prev : current
          })
          distances.push({
            shape: record,
            snapPoint: closest.snapPoint,
            children: macroFeatures,
          })
        }
      })
    })
    this.stepAndRepeatCollection.steps.forEach((stepAndRepeat) => {
      const stepAndRepeatFeatures = stepAndRepeat.queryDistance(transformedPointer, snapMode, context)
      if (stepAndRepeatFeatures.length > 0) {
        stepAndRepeatFeatures.map((measurement) => this.transformPoint(measurement.snapPoint))
        const closest = stepAndRepeatFeatures.reduce((prev, current) => {
          const prevDist = vec2.distance(pointer, prev.snapPoint)
          const currentDist = vec2.distance(pointer, current.snapPoint)
          return prevDist < currentDist ? prev : current
        })
        distances.push({
          shape: stepAndRepeat.record,
          snapPoint: closest.snapPoint,
          children: stepAndRepeatFeatures,
        })
      }
    })
    context.transformMatrix = origMatrix
    return distances
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    const origMatrix = mat3.clone(context.transformMatrix)
    this.transform.update(context.transformMatrix)
    context.transformMatrix = this.transform.matrix
    if (this.dirty) {
      this.shapeCollection.refresh(this.image)
      this.macroCollection.refresh(this.image)
      this.stepAndRepeatCollection.refresh(this.image)
      this.datumCollection.refresh(this.image)
      this.datumTextCollection.refresh(this.image)
      this.dirty = false
    }
    this.commonConfig(() => {
      // if (origin.enabled) this.drawCollections.renderOrigin()
      // if (grid.enabled) this.drawCollections.renderGrid(grid)
      this.drawPrimitives(context)
      this.drawMacros(context)
      this.drawStepAndRepeats(context)
      this.drawDatums(context)
    })
    context.transformMatrix = origMatrix
  }

  private drawDatums(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    if (context.settings.SHOW_DATUMS === false) return
    this.datumConfig(() => {
      this.drawCollections.drawPads(this.shapeCollection.shaderAttachment.datumPoints)
      this.drawCollections.drawLines(this.shapeCollection.shaderAttachment.datumLines)
      this.drawCollections.drawArcs(this.shapeCollection.shaderAttachment.datumArcs)
      // draw datum text function is not always ready immediatly as it requires a font to be loaded
      if (typeof this.drawCollections.drawDatumText === "function") this.drawCollections.drawDatumText(this.datumTextCollection.attachment)
      this.drawCollections.drawDatums(this.datumCollection.attachment)
    })
  }

  private drawPrimitives(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    if (this.shapeCollection.shaderAttachment.pads.length != 0) this.drawCollections.drawPads(this.shapeCollection.shaderAttachment.pads)
    if (this.shapeCollection.shaderAttachment.arcs.length != 0) this.drawCollections.drawArcs(this.shapeCollection.shaderAttachment.arcs)
    if (this.shapeCollection.shaderAttachment.lines.length != 0) this.drawCollections.drawLines(this.shapeCollection.shaderAttachment.lines)
    if (this.shapeCollection.shaderAttachment.surfaces.length != 0) this.drawCollections.drawSurfaces(this.shapeCollection.shaderAttachment.surfaces)
    this.drawSurfaceWithHoles(context)
  }

  public getBoundingBox(): BoundingBox {
    const contextBoundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity),
    }
    for (const record of this.image) {
      const feature_bb = Shapes.getBoundingBoxOfShape(record)
      vec2.min(contextBoundingBox.min, contextBoundingBox.min, feature_bb.min)
      vec2.max(contextBoundingBox.max, contextBoundingBox.max, feature_bb.max)
    }
    return contextBoundingBox
  }

  // private drawBoundingBoxes(): void {
  //   const { min, max } = this.getBoundingBox()
  //   const polyline: Shapes.PolyLine = new Shapes.PolyLine({
  //     xs: min[0],
  //     ys: min[1],
  //     cornertype: 'miter',
  //     pathtype: 'square',
  //     polarity: 1,
  //     width: 0.001,
  //   }).addLines([
  //     {x : min[0], y: min[1]},
  //     {x : max[0], y: min[1]},
  //     {x : max[0], y: max[1]},
  //     {x : min[0], y: max[1]},
  //     {x : min[0], y: min[1]},
  //   ])
  //   this.image.push(polyline)
  // }
}

interface MacroRendererProps extends Omit<ShapeRendererProps, "transform"> {
  flatten: boolean
}

export class MacroRenderer extends ShapeRenderer {
  public framebuffer: REGL.Framebuffer2D
  public flatten: boolean
  constructor(props: MacroRendererProps) {
    super(props)

    this.flatten = props.flatten

    this.framebuffer = this.regl.framebuffer({
      depth: true,
    })
  }

  public updateTransformFromPad(pad: Shapes.Pad): void {
    this.transform.index = pad.index
    this.transform.polarity = pad.polarity
    this.transform.datum = vec2.fromValues(pad.x, pad.y)
    this.transform.rotation = pad.rotation
    this.transform.scale = pad.resize_factor
    this.transform.mirror_x = pad.mirror_x
    this.transform.mirror_y = pad.mirror_y
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>): void {
    if (this.flatten === false) {
      super.render(context)
      return
    }
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      stencil: 0,
      depth: 0,
    })
    const tempPol = this.transform.polarity
    this.transform.polarity = 1
    this.framebuffer.use(() => {
      super.render(context)
    })
    this.transform.polarity = tempPol
    this.commonConfig(() => {
      this.drawCollections.drawFrameBuffer({
        renderTexture: this.framebuffer,
        index: this.transform.index,
        qtyFeatures: context.prevQtyFeaturesRef ?? 1,
        polarity: this.transform.polarity,
      })
    })
  }
}

interface StepAndRepeatRendererProps {
  regl: REGL.Regl
  ctx: OffscreenCanvasRenderingContext2D
  record: Shapes.StepAndRepeat
}

export class StepAndRepeatRenderer extends ShapeRenderer {
  public record: Shapes.StepAndRepeat
  constructor(props: StepAndRepeatRendererProps) {
    super({
      regl: props.regl,
      ctx: props.ctx,
      image: props.record.shapes,
    })
    this.record = props.record
    this.transform.index = props.record.index
  }

  public queryDistance(
    pointer: vec2,
    snapMode: SnapMode,
    context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>,
  ): ShapeDistance[] {
    const features: ShapeDistance[] = []
    this.record.repeats.forEach((repeat) => {
      Object.assign(this.transform, repeat)
      context.qtyFeaturesRef = this.record.repeats.length
      this.transform.index = 0
      const nestedFeatures = super.queryDistance(pointer, snapMode, context)
      features.push(...nestedFeatures)
    })
    return features
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext & Partial<ShapeRendererCommonContext>): void {
    this.record.repeats.forEach((repeat) => {
      Object.assign(this.transform, repeat)
      context.qtyFeaturesRef = this.record.repeats.length
      this.transform.index = 0
      super.render(context)
    })
  }
}

/**
 * break step and repeat is only partially implemented. it will currently only break surface and polyline shapes
 */
export function breakStepRepeat(stepRepeat: Shapes.StepAndRepeat, inputTransform: ShapeTransform): Shapes.Shape[] | undefined {
  const newImage: Shapes.Shape[] = []
  for (const repeat of stepRepeat.repeats) {
    const transform = new ShapeTransform()
    Object.assign(transform, repeat)
    transform.update(inputTransform.matrix)
    for (let i = 0; i < stepRepeat.shapes.length; i++) {
      const shape = stepRepeat.shapes[i]
      const newShape = JSON.parse(JSON.stringify(shape)) as Shapes.Shape
      if (newShape.type === FeatureTypeIdentifier.SURFACE) {
        for (const contour of newShape.contours) {
          const position = vec3.fromValues(contour.xs, contour.ys, 1)
          vec3.transformMat3(position, position, transform.matrix)
          contour.xs = position[0]
          contour.ys = position[1]
          for (const segment of contour.segments) {
            const position = vec3.fromValues(segment.x, segment.y, 1)
            vec3.transformMat3(position, position, transform.matrix)
            segment.x = position[0]
            segment.y = position[1]
          }
        }
        newImage.push(newShape)
        continue
      }
      if (newShape.type === FeatureTypeIdentifier.POLYLINE) {
        newShape.width = newShape.width * getScaleMat3(transform.matrix)
        const startPoint = vec3.fromValues(newShape.xs, newShape.ys, 1)
        vec3.transformMat3(startPoint, startPoint, transform.matrix)
        newShape.xs = startPoint[0]
        newShape.ys = startPoint[1]
        for (const segment of newShape.lines) {
          const point = vec3.fromValues(segment.x, segment.y, 1)
          vec3.transformMat3(point, point, transform.matrix)
          segment.x = point[0]
          segment.y = point[1]
        }
        newImage.push(newShape)
        continue
      }
      if (newShape.type === FeatureTypeIdentifier.STEP_AND_REPEAT) {
        // this will disable breaking of nested step and repeats, not yet tested
        // if (newShape.break === false) {
        //   newImage.push(newShape)
        //   continue
        // }

        // note, this is recursive
        // breaking the top level step and repeat will break all nested step and repeats down to the primitive shapes
        const newShapes = breakStepRepeat(newShape, transform)
        if (newShapes === undefined) {
          return
        } else {
          newImage.push(...newShapes)
        }
        continue
      }
      return
    }
  }
  return newImage
}
