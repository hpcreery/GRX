import REGL from "regl"
import { vec2, vec3, mat3 } from "gl-matrix"
import * as Shapes from "./shapes"
import * as Symbols from "./symbols"
import { BoundingBox, FeatureTypeIdentifier } from "./types"
import ShapeTransform from './transform'

import {
  DatumShaderCollection,
  DatumTextShaderCollection,
  ReglRenderers,
  TLoadedReglRenderers,
} from "./collections"

import { ShapesShaderCollection, MacroShaderCollection, StepAndRepeatCollection } from "./collections"

import type { WorldContext } from "./engine"
import { getScaleMat3 } from "./utils"

const { SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

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
}
interface QueryAttributes {}

interface QueryProps {
  pointer: vec2
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

interface DatumUniforms {
  u_Color: vec3
  u_Alpha: number
}

interface DatumAttributes {}

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

  public shapeCollection: ShapesShaderCollection
  public macroCollection: MacroShaderCollection
  public stepAndRepeatCollection: StepAndRepeatCollection
  public datumCollection: DatumShaderCollection
  public datumTextCollection: DatumTextShaderCollection

  public get qtyFeatures(): number {
    return this.image.length
  }

  protected commonConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected queryConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected datumConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawCollections: TLoadedReglRenderers
  public surfaceFrameBuffer: REGL.Framebuffer2D
  public queryFrameBuffer: REGL.Framebuffer2D

  public transform: ShapeTransform = new ShapeTransform()

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
      REGL.DefaultContext & WorldContext
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
        prevQtyFeaturesRef: (context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>) => context.qtyFeaturesRef ?? 1,
        qtyFeaturesRef: (context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>) =>
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
        u_IndexOffset: (context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>) => {
          return this.transform.index / (context.prevQtyFeaturesRef ?? 1)
        },
        u_QtyFeatures: (context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>) => {
          return context.qtyFeaturesRef ?? 0
        },
        u_Polarity: () => this.transform.polarity,
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }), {}),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }), {}),
      },
    })

    this.queryConfig = this.regl<QueryUniforms, QueryAttributes, QueryProps, ShapeRendererCommonContext, REGL.DefaultContext & WorldContext>({
      uniforms: {
        u_QueryMode: true,
        u_Color: [1, 1, 1],
        u_Alpha: 1,
        u_PointerPosition: this.regl.prop<QueryProps, "pointer">("pointer"),
      },
    })

    this.datumConfig = this.regl<DatumUniforms, DatumAttributes, Record<string, never>, WorldContext>({
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
        u_Color: (context: WorldContext) => {
          return [1 - context.settings.BACKGROUND_COLOR[2], 1 - context.settings.BACKGROUND_COLOR[1], 1 - context.settings.BACKGROUND_COLOR[0]]
        },
        u_Alpha: () => 1,
      },
    })

    this.drawCollections = ReglRenderers as TLoadedReglRenderers

    this.queryFrameBuffer = this.regl.framebuffer({
      depth: true,
    })
    this.surfaceFrameBuffer = this.regl.framebuffer({
      depth: true,
    })
  }

  private drawMacros(context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
    this.macroCollection.macros.forEach((macro) => {
      macro.records.forEach((record) => {
        macro.renderer.updateTransformFromPad(record)
        macro.renderer.render(context)
      })
    })
    return this
  }

  private drawStepAndRepeats(context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
    this.stepAndRepeatCollection.steps.forEach((stepAndRepeat) => {
      stepAndRepeat.render(context)
    })
    return this
  }

  private drawSurfaceWithHoles(context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): this {
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

  public select(pointer: vec2, context: REGL.DefaultContext & WorldContext): Shapes.Shape[] {
    const origMatrix = mat3.clone(context.transformMatrix)
    this.transform.update(context.transformMatrix)
    context.transformMatrix = this.transform.matrix
    if (this.qtyFeatures > context.viewportWidth * context.viewportHeight) {
      console.error("Too many features to query")
      // TODO! for too many features, make multiple render passes in order to query all features
      return []
    }
    this.queryFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
    const width = this.qtyFeatures < context.viewportWidth ? this.qtyFeatures % context.viewportWidth : context.viewportWidth
    const height = Math.ceil(this.qtyFeatures / context.viewportWidth)
    this.regl.clear({
      framebuffer: this.queryFrameBuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.queryFrameBuffer.use(() => {
      this.commonConfig(() => {
        this.queryConfig({ pointer }, () => {
          this.drawPrimitives(context)
          this.drawDatums(context)
        })
      })
    })
    const data = this.regl.read({
      framebuffer: this.queryFrameBuffer,
      x: 0,
      y: 0,
      width: width,
      height: height,
    })
    const features: Shapes.Shape[] = []
    for (let i = 0; i < data.length; i += 4) {
      const value = data.slice(i, i + 4).reduce((acc, val) => acc + val, 0)
      if (value > 0) {
        const feat = Object.assign({}, this.image[i / 4])
        features.push(feat)
      }
    }
    this.macroCollection.macros.forEach((macro) => {
      macro.records.forEach((record) => {
        macro.renderer.updateTransformFromPad(record)
        macro.renderer.transform.index = 0
        const macroFeatures = macro.renderer.select(pointer, context)
        if (macroFeatures.length > 0) {
          const macroCopy = Object.assign({}, record)
          macroCopy.symbol = Object.assign({}, macro.macro)
          macroCopy.symbol.shapes = macroFeatures
          features.push(macroCopy)
        }
      })
    })
    this.stepAndRepeatCollection.steps.forEach((stepAndRepeat) => {
      const stepAndRepeatFeatures = stepAndRepeat.select(pointer, context)
      if (stepAndRepeatFeatures.length > 0) {
        const stepAndRepeatCopy = Object.assign({}, stepAndRepeat.record)
        stepAndRepeatCopy.shapes = stepAndRepeatFeatures
        features.push(stepAndRepeatCopy)
      }
    })
    context.transformMatrix = origMatrix
    return features
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
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
      this.drawPrimitives(context)
      this.drawMacros(context)
      this.drawStepAndRepeats(context)
      this.drawDatums(context)
    })
    context.transformMatrix = origMatrix
  }

  private drawDatums(context: REGL.DefaultContext & WorldContext): void {
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

  private drawPrimitives(context: REGL.DefaultContext & WorldContext): void {
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

  public render(context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): void {
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

  public select(pointer: vec2, context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): Shapes.Shape[] {
    const features: Shapes.Shape[] = []
    this.record.repeats.forEach((repeat) => {
      Object.assign(this.transform, repeat)
      context.qtyFeaturesRef = this.record.repeats.length
      this.transform.index = 0
      const nestedFeatures = super.select(pointer, context)
      if (nestedFeatures.length > 0) features.push(...nestedFeatures)
    })
    return features
  }

  public render(context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>): void {
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
