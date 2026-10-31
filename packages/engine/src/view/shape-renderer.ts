import type * as Shapes from "@grx/artwork-format/shape"
import * as Symbols from "@grx/artwork-format/symbol"
import type { TShapeTransform } from "@grx/artwork-format/types"
import { type BoundingBox, FeatureTypeIdentifier } from "@grx/artwork-format/types"
import * as ArtworkUtils from "@grx/artwork-format/utils"
import type { ShapesBufferCollection } from "@src/data/artwork-collections"
import { type mat3, vec2, type vec4 } from "gl-matrix"
import type REGL from "regl"
import { settings } from "../settings"
import { type ShapeDistance, SNAP_MODES_MAP } from "../types"
import { UpdateEventTarget } from "../utils"
import { MacroShaderCollection, ShapesShaderCollection, SymbolShaderCollection } from "./buffer-collections"
import { ReglRenderers, type TLoadedReglRenderers } from "./gl-commands"
import ShapeTransform from "./shape-transform"
import type { DrawWorldContext } from "./view"

const { SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

type CommonAttributes = {}

interface CommonUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_QtyFeatures: number
  u_IndexOffset: number
  u_Polarity: number
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
}

interface DrawQueryUniforms {
  u_QueryMode: boolean
  u_Color: vec4
  u_PointerPosition: vec2
}

type DrawQueryAttributes = {}

interface DrawQueryProps {
  pointer: vec2
}

interface DrawDatumUniforms {
  u_Color: vec4
}

interface DrawSurfaceBufferContext {
  preRender: undefined
}

export interface RendererProps {
  regl: REGL.Regl
}

export interface ShapeProps {
  image: ShapesBufferCollection
  transform?: Partial<TShapeTransform>
}

export interface ShapeRendererProps extends RendererProps, ShapeProps {}

interface ShapeRendererCommonContext {
  qtyFeaturesRef: number
  prevQtyFeaturesRef: number
  transformMatrix: mat3
}

export interface ShapeRendererEvents {
  update: Event
}

type DistanceQueryDirection = "center" | "right" | "left" | "up" | "down"

export class ShapeRenderer extends UpdateEventTarget {
  public regl: REGL.Regl
  public artwork: ShapesBufferCollection

  public shapeShaderAttachments: ShapesShaderCollection

  public get qtyFeatures(): number {
    return this.artwork.length
  }

  protected drawArtwork: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext & Partial<ShapeRendererCommonContext>>
  protected drawQuery: REGL.DrawCommand<REGL.DefaultContext>
  protected drawDatum: REGL.DrawCommand<REGL.DefaultContext>
  protected drawSurfaceFrameBuffer: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext & Partial<ShapeRendererCommonContext>>
  protected drawCollections: TLoadedReglRenderers

  private surfaceFrameBuffer: REGL.Framebuffer2D
  private queryFrameBuffer: REGL.Framebuffer2D

  public transform = new ShapeTransform()

  public distanceQuery: Record<DistanceQueryDirection, Float32Array> = {
    center: new Float32Array(0),
    right: new Float32Array(0),
    left: new Float32Array(0),
    up: new Float32Array(0),
    down: new Float32Array(0),
  }

  constructor(props: ShapeRendererProps) {
    super()
    this.regl = props.regl

    if (props.transform) {
      Object.assign(this.transform, props.transform)
    }

    this.artwork = props.image

    this.shapeShaderAttachments = new ShapesShaderCollection({
      regl: this.regl,
      artwork: this.artwork,
    })

    this.shapeShaderAttachments.onUpdate(() => this.announceUpdate())

    this.drawArtwork = this.regl<
      CommonUniforms,
      CommonAttributes,
      Record<string, never>,
      ShapeRendererCommonContext,
      REGL.DefaultContext & DrawWorldContext
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
        transformMatrix: (context) => {
          this.transform.update(context.transformMatrix)
          return this.transform.matrix
        },
        prevQtyFeaturesRef: (context: REGL.DefaultContext & Partial<ShapeRendererCommonContext>) => context.qtyFeaturesRef ?? 1,
        qtyFeaturesRef: (context: REGL.DefaultContext & Partial<ShapeRendererCommonContext>) => this.qtyFeatures * (context.qtyFeaturesRef ?? 1),
      },
      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        u_SymbolsTexture: () => SymbolShaderCollection.texture,
        u_SymbolsTextureDimensions: () => [SymbolShaderCollection.texture.width, SymbolShaderCollection.texture.height],
        u_IndexOffset: (context: REGL.DefaultContext & Partial<ShapeRendererCommonContext>) => {
          return this.transform.index / (context.prevQtyFeaturesRef ?? 1)
        },
        u_QtyFeatures: (context: REGL.DefaultContext & Partial<ShapeRendererCommonContext>) => {
          return context.qtyFeaturesRef ?? 0
        },
        u_Polarity: () => this.transform.polarity,
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Symbols.${key}`]: value }), {}),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }), {}),
        ...Object.entries(SNAP_MODES_MAP).reduce((acc, [key, value]) => Object.assign(acc, { [`u_SnapModes.${key}`]: value }), {}),
      },
    })

    this.queryFrameBuffer = this.regl.framebuffer({
      depth: true,
      colorType: "float",
    })

    this.drawQuery = this.regl<
      DrawQueryUniforms,
      DrawQueryAttributes,
      DrawQueryProps,
      ShapeRendererCommonContext & DrawWorldContext,
      REGL.DefaultContext
    >({
      uniforms: {
        u_QueryMode: true,
        u_Color: [1, 1, 1, 1],
        u_PointerPosition: this.regl.prop<DrawQueryProps, "pointer">("pointer"),
      },
      framebuffer: this.queryFrameBuffer,
    })

    this.drawDatum = this.regl<DrawDatumUniforms, Record<string, never>, Record<string, never>>({
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
        u_Color: () => {
          return [1 - settings.BACKGROUND_COLOR[2], 1 - settings.BACKGROUND_COLOR[1], 1 - settings.BACKGROUND_COLOR[0], 1.0]
        },
      },
    })

    this.drawCollections = ReglRenderers as TLoadedReglRenderers

    this.surfaceFrameBuffer = this.regl.framebuffer({
      depth: true,
      colorType: "float",
    })

    this.drawSurfaceFrameBuffer = this.regl<
      {},
      {},
      {},
      DrawSurfaceBufferContext,
      REGL.DefaultContext & DrawWorldContext & Partial<ShapeRendererCommonContext>
    >({
      context: {
        preRender: (context) => {
          this.surfaceFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
        },
      },
      framebuffer: this.surfaceFrameBuffer,
    })
  }

  /**
   * Queries the distance from the pointer to all shapes in the renderer
   * @param pointer the pointer in gl screen/view coordinates
   * @param context the regl context
   * @returns an array of ShapeDistance objects, one for each shape in the renderer that is within the query distance. Returned distances are in world coordinates.
   */
  public queryDistance(pointer: vec2): ShapeDistance[] {
    if (this.qtyFeatures === 0) return []
    const renderDistance = (pointer: vec2, direction: DistanceQueryDirection): void => {
      this.regl.clear({
        framebuffer: this.queryFrameBuffer,
        // in the color buffer, the first value is the distance, the next two are the direction, the last is to indicate there is a measurement at all. (0 = empty)
        color: [0, 0, 0, 0],
        depth: 0,
      })
      let width: number = 0
      let height: number = 0
      this.drawArtwork((context) => {
        if (this.qtyFeatures > context.viewportWidth * context.viewportHeight) {
          console.error("Too many features to query")
          // TODO! for too many features, make multiple render passes in order to query all features
          return undefined
        }
        this.queryFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
        width = this.qtyFeatures < context.viewportWidth ? this.qtyFeatures % context.viewportWidth : context.viewportWidth
        height = Math.ceil(this.qtyFeatures / context.viewportWidth)
        const bufferLength = width * height * Float32Array.BYTES_PER_ELEMENT
        this.distanceQuery[direction] = new Float32Array(bufferLength)

        this.drawQuery({ pointer }, () => {
          this.drawPrimitives()
          this.drawSufaces()
          this.drawSurfaceWithHoles()
          this.drawDatums()
          this.drawPolyLines()
        })
      })

      this.regl.read<Float32Array>({
        framebuffer: this.queryFrameBuffer,
        x: 0,
        y: 0,
        width,
        height,
        data: this.distanceQuery[direction],
      })
    }

    renderDistance(pointer, "center")
    const epsilons = 0.1
    renderDistance(vec2.add(vec2.create(), pointer, vec2.fromValues(epsilons, 0)), "right")
    renderDistance(vec2.add(vec2.create(), pointer, vec2.fromValues(-epsilons, 0)), "left")
    renderDistance(vec2.add(vec2.create(), pointer, vec2.fromValues(0, epsilons)), "up")
    renderDistance(vec2.add(vec2.create(), pointer, vec2.fromValues(0, -epsilons)), "down")

    const distData = this.distanceQuery["center"]
    const distances: ShapeDistance[] = []
    for (let i = 0; i < distData.length; i += 4) {
      // the last value is to indicate there is a measurement at all. (0 = empty)
      if (distData[i + 3] == 0) continue
      const distance = distData[i] * this.transform.scale

      const direction = vec2.fromValues(
        this.distanceQuery["right"][i] - this.distanceQuery["left"][i],
        this.distanceQuery["up"][i] - this.distanceQuery["down"][i],
      )
      // *** QUERYING THE DIRECTION FROM THE SHADER IS CURRENTLY DISABLED BECAUSE IT PUTS MORE LOAD ON THE GPU AND ESPECIALLY THE SHADER COMPILER DUE TO UNROLLING, BUT IT IS MORE ACCURATE THAN THE FINITE DIFFERENCE APPROXIMATION ***
      // direction[0] = distData[i + 1] // use the direction encoded in the green and blue channels of the texture, as it is more accurate than the finite difference approximation
      // direction[1] = distData[i + 2]
      vec2.normalize(direction, direction)

      // sanity check for if the distances of the four directions are the same
      let validDistance = true
      if (
        [this.distanceQuery["down"][i], this.distanceQuery["up"][i], this.distanceQuery["left"][i], this.distanceQuery["right"][i]].every(
          (d, _i, arr) => d === arr[0],
        )
      ) {
        validDistance = false
      }

      distances.push({
        shape: this.artwork.read(i / 4),
        direction: validDistance ? direction : undefined,
        distance: validDistance ? distance : undefined,
        children: [],
      })
    }

    this.artwork.shapes[FeatureTypeIdentifier.PAD].macros.forEach((macro) => {
      if (macro === undefined) return
      const macroRenderer = MacroShaderCollection.macros.get(macro.symbol.id)
      if (!macroRenderer) {
        console.warn("Macro renderer not found for macro", macro)
        return
      }
      macroRenderer.updateTransformFromPad(macro)
      macroRenderer.transform.index = 0
      const macroFeatures = macroRenderer.queryDistance(pointer)
      if (macroFeatures.length > 0) {
        const closest = macroFeatures.reduce((prev, current) => {
          if (prev.distance == undefined) return current
          if (current.distance == undefined) return prev
          return prev.distance < current.distance ? prev : current
        })
        distances.push({
          shape: macro,
          direction: closest.direction,
          distance: closest.distance,
          children: macroFeatures,
        })
      }
    })

    this.shapeShaderAttachments.stepAndRepeats.forEach((stepAndRepeat) => {
      const stepAndRepeatFeatures = stepAndRepeat.queryDistance(pointer)
      if (stepAndRepeatFeatures.length > 0) {
        const closest = stepAndRepeatFeatures.reduce((prev, current) => {
          if (prev.distance == undefined) return current
          if (current.distance == undefined) return prev
          return prev.distance < current.distance ? prev : current
        })
        distances.push({
          shape: this.artwork.read(stepAndRepeat.transform.index),
          direction: closest.direction,
          distance: closest.distance,
          children: stepAndRepeatFeatures,
        })
      }
    })
    return distances
  }

  public render(): void {
    this.drawArtwork((context) => {
      this.drawPrimitives()
      // we do not have to render surfaces in outline mode, as they are rendered as outlines (lines and arcs)
      if (!context.viewSettings.OUTLINE_MODE && !context.viewSettings.SKELETON_MODE) {
        this.drawSufaces()
        this.drawSurfaceWithHoles()
      }
      this.drawSurfaceEdges()
      this.drawMacros()
      this.drawStepAndRepeats()
      this.drawDatums()
      this.drawPolyLines()
    })
  }

  private drawDatums(): void {
    if (settings.SHOW_DATUMS === false) return
    this.drawDatum(() => {
      // this.drawCollections.drawPads(this.shapeShaderAttachments.shaderAttachment.datumPoints)
      this.drawCollections.drawLines(this.shapeShaderAttachments.shaderAttachment.datumLines)
      this.drawCollections.drawArcs(this.shapeShaderAttachments.shaderAttachment.datumArcs)
      // draw datum text function is not always ready immediatly as it requires a font to be loaded
      if (typeof this.drawCollections.drawDatumText === "function")
        this.drawCollections.drawDatumText(this.shapeShaderAttachments.shaderAttachment.datumTexts)
      this.drawCollections.drawDatums(this.shapeShaderAttachments.shaderAttachment.datumPoints)
    })
  }

  private drawPrimitives(): void {
    if (this.shapeShaderAttachments.shaderAttachment.pads.length != 0)
      this.drawCollections.drawPads(this.shapeShaderAttachments.shaderAttachment.pads)
    if (this.shapeShaderAttachments.shaderAttachment.arcs.length != 0)
      this.drawCollections.drawArcs(this.shapeShaderAttachments.shaderAttachment.arcs)
    if (this.shapeShaderAttachments.shaderAttachment.lines.length != 0)
      this.drawCollections.drawLines(this.shapeShaderAttachments.shaderAttachment.lines)
  }

  private drawMacros(): this {
    this.artwork.shapes[FeatureTypeIdentifier.PAD].macros.forEach((macro) => {
      if (macro === undefined) return
      const macroRenderer = MacroShaderCollection.macros.get(macro.symbol.id)
      if (!macroRenderer) {
        console.warn("Macro renderer not found for macro", macro)
        return
      }
      macroRenderer.updateTransformFromPad(macro)
      macroRenderer.render()
    })
    return this
  }

  private drawStepAndRepeats(): this {
    this.shapeShaderAttachments.stepAndRepeats.forEach((stepAndRepeat) => {
      stepAndRepeat.render()
    })
    return this
  }

  private drawSufaces(): this {
    if (this.shapeShaderAttachments.shaderAttachment.surfaces.withoutHoles.length != 0)
      this.drawCollections.drawSurfaces(this.shapeShaderAttachments.shaderAttachment.surfaces.withoutHoles)
    return this
  }

  private drawSurfaceWithHoles(): this {
    if (this.shapeShaderAttachments.shaderAttachment.surfaces.withHoles.length === 0) return this
    this.shapeShaderAttachments.shaderAttachment.surfaces.withHoles.forEach((attachment) => {
      this.regl.clear({
        framebuffer: this.surfaceFrameBuffer,
        color: [0, 0, 0, 1],
        depth: 0,
      })
      this.drawSurfaceFrameBuffer(() => {
        this.drawCollections.drawSurfaces(attachment)
      })
      this.drawCollections.drawGroupedShapes({
        renderTexture: this.surfaceFrameBuffer,
        qtyFeatures: this.qtyFeatures,
        index: attachment.surfaceIndex,
        polarity: attachment.surfacePolarity,
      })
    })
    return this
  }

  private drawSurfaceEdges(): void {
    if (this.shapeShaderAttachments.shaderAttachment.surfaces.edgeArcs.length != 0) {
      this.drawCollections.drawArcs(this.shapeShaderAttachments.shaderAttachment.surfaces.edgeArcs)
    }
    if (this.shapeShaderAttachments.shaderAttachment.surfaces.edgeLines.length != 0) {
      this.drawCollections.drawLines(this.shapeShaderAttachments.shaderAttachment.surfaces.edgeLines)
    }
  }

  private drawPolyLines(): void {
    if (this.shapeShaderAttachments.shaderAttachment.polylines.lines.length != 0) {
      this.drawCollections.drawLines(this.shapeShaderAttachments.shaderAttachment.polylines.lines)
    }
    if (this.shapeShaderAttachments.shaderAttachment.polylines.pads.length != 0) {
      this.drawCollections.drawPads(this.shapeShaderAttachments.shaderAttachment.polylines.pads)
    }
  }

  public getBoundingBox(): BoundingBox {
    const contextBoundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity),
    }
    for (let i = 0; i < this.artwork.length; i++) {
      const record = this.artwork.read(i)
      const feature_bb = ArtworkUtils.getBoundingBoxOfShape(record)
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

  public destroy(): void {
    super.unSubscribe()
    this.shapeShaderAttachments.destroy()
    this.surfaceFrameBuffer.destroy()
    this.queryFrameBuffer.destroy()
  }
}

interface MacroRendererProps extends Omit<ShapeRendererProps, "transform"> {
  flatten?: boolean
}

// !IDEA render macro to a texture first, then render that texture as a quad. Only re-render the macro texture when the transform changes zoom. Switch back to hard render when macro is larger than viewport.
// !IDEA optimize render by manually performing culling and disabling render outside viewport

interface DrawMacroContext {
  // polarity: number
  preRender: undefined
}

export class MacroRenderer extends ShapeRenderer {
  public framebuffer: REGL.Framebuffer2D
  public flatten: boolean
  private drawMacro: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext>
  constructor(props: MacroRendererProps) {
    super(props)

    this.flatten = props.flatten ?? true

    this.framebuffer = this.regl.framebuffer({
      depth: true,
    })

    this.drawMacro = this.regl<
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      DrawMacroContext,
      REGL.DefaultContext & DrawWorldContext
    >({
      context: {
        // polarity: 1,
        preRender: (context) => {
          this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
        },
      },
      framebuffer: this.framebuffer,
    })
  }

  /**
   * Updates the internal transform from a pad shape
   * @param pad the pad to update the transform from
   */
  public updateTransformFromPad(pad: Shapes.Pad): void {
    this.transform.index = pad.index
    this.transform.polarity = pad.polarity
    this.transform.datum = vec2.fromValues(pad.x, pad.y)
    this.transform.rotation = pad.rotation
    this.transform.scale = pad.resize_factor
    this.transform.mirror_x = pad.mirror_x
    this.transform.mirror_y = pad.mirror_y
  }

  public render(): void {
    if (this.flatten === false) {
      super.render()
      return
    }
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      stencil: 0,
      depth: 0,
    })
    const tempPol = this.transform.polarity
    this.transform.polarity = 1
    this.drawMacro(() => {
      super.render()
    })
    this.transform.polarity = tempPol
    this.drawArtwork((context) => {
      this.drawCollections.drawGroupedShapes({
        renderTexture: this.framebuffer,
        index: this.transform.index,
        qtyFeatures: context.prevQtyFeaturesRef ?? 1,
        polarity: this.transform.polarity,
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}

interface StepAndRepeatRendererProps {
  regl: REGL.Regl
  image: ShapesBufferCollection
  repeats: TShapeTransform[]
  index: number
}

export class StepAndRepeatRenderer extends ShapeRenderer {
  public repeats: TShapeTransform[]
  public drawReassignQtyFeaturesRef: REGL.DrawCommand<REGL.DefaultContext>
  constructor(props: StepAndRepeatRendererProps) {
    const { regl, image, repeats, index } = props
    super({
      regl,
      image,
    })
    this.repeats = repeats
    this.transform.index = index
    this.drawReassignQtyFeaturesRef = regl({
      uniforms: {
        qtyFeaturesRef: () => this.repeats.length,
      },
    })
  }

  public queryDistance(pointer: vec2): ShapeDistance[] {
    const features: ShapeDistance[] = []
    this.repeats.forEach((repeat) => {
      Object.assign(this.transform, repeat)
      this.transform.index = 0
      this.drawReassignQtyFeaturesRef(() => {
        const nestedFeatures = super.queryDistance(pointer)
        features.push(...nestedFeatures)
      })
    })
    return features
  }

  public render(): void {
    this.repeats.forEach((repeat) => {
      Object.assign(this.transform, repeat)
      this.transform.index = 0
      this.drawReassignQtyFeaturesRef(() => {
        super.render()
      })
    })
  }
}
