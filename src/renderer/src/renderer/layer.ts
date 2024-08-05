import REGL from 'regl'
import { vec2, vec3, mat3 } from 'gl-matrix'
import * as Shapes from './shapes'
import * as Symbols from './symbols'
import { Binary, Transform, Units, BoundingBox } from './types'
import {
  ArcAttachments,
  DatumCollection,
  FrameBufferRenderAttachments,
  LineAttachments,
  PadAttachments,
  ReglRenderers,
  SurfaceAttachments
} from './collections'

import {
  ShapesShaderCollection,
  MacroShaderCollection,
  StepAndRepeatCollection
} from './collections'

import { WorldContext } from './engine'
import { getUnitsConversion, UID } from './utils'
import { LineRenderer, PointRenderer, TextRenderer } from './datum'

const { SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

interface CommonAttributes { }

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
interface QueryAttributes { }

export interface NestedFeature {
  ref: Shapes.Shape
  features: Shapes.Shape[]
}

interface QueryProps {
  pointer: vec2
}

// interface ShapeTransform extends Transform {
//   index: number
//   polarity: number
//   matrix: mat3
//   inverseMatrix: mat3
//   update: (inputMatrix: mat3) => void
// }

class ShapeTransform implements Transform {
  public datum: vec2 = vec2.create()
  public rotation = 0
  public scale = 1
  public mirror_x: Binary = 0
  public mirror_y: Binary = 0
  public order: ("scale" | "mirror" | "rotate" | "translate")[] = ['translate', 'rotate', 'mirror', 'scale']
  public index = 0
  public polarity = 1
  public matrix = mat3.create()
  public inverseMatrix = mat3.create()
  public update(inputMatrix: mat3): void {
    const { rotation, scale, datum } = this
    this.matrix = mat3.clone(inputMatrix)
    for (const transform of this.order) {
      switch (transform) {
        case 'scale':
          mat3.scale(this.matrix, this.matrix, [scale, scale])
          break
        case 'translate':
          mat3.translate(this.matrix, this.matrix, datum)
          break
        case 'rotate':
          mat3.rotate(this.matrix, this.matrix, rotation * (Math.PI / 180))
          break
        case 'mirror':
          mat3.scale(this.matrix, this.matrix, [this.mirror_x ? -1 : 1, this.mirror_y ? -1 : 1])
          break
      }
    }
    mat3.invert(this.inverseMatrix, this.matrix)
  }

}

export interface RendererProps {
  regl: REGL.Regl
  ctx: OffscreenCanvasRenderingContext2D
}

export interface ShapeProps {
  image: Shapes.Shape[]
  transform?: Partial<ShapeTransform>
}

// export interface ShapeRendererProps extends RendererProps {
//   image: Shapes.Shape[]
//   transform?: Partial<ShapeTransform>
// }

export interface ShapeRendererProps extends RendererProps, ShapeProps { }

interface ShapeRendererCommonContext {
  qtyFeaturesRef: number
  prevQtyFeaturesRef: number
  transformMatrix: mat3
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

  public shapeCollection: ShapesShaderCollection
  public macroCollection: MacroShaderCollection
  public stepAndRepeatCollection: StepAndRepeatCollection
  public datumCollection: DatumCollection

  public get qtyFeatures(): number {
    return this.image.length
  }

  protected commonConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected queryConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawPads: REGL.DrawCommand<REGL.DefaultContext & WorldContext, PadAttachments>
  protected drawLines: REGL.DrawCommand<REGL.DefaultContext & WorldContext, LineAttachments>
  protected drawArcs: REGL.DrawCommand<REGL.DefaultContext & WorldContext, ArcAttachments>
  protected drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & WorldContext, SurfaceAttachments>
  protected drawDatumLines: LineRenderer
  protected drawDatumText: TextRenderer
  protected drawDatumPoints: PointRenderer
  protected flattenSurfaces: REGL.DrawCommand<
    REGL.DefaultContext & WorldContext,
    FrameBufferRenderAttachments
  >
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
    this.indexImage()
    // this.drawBoundingBoxes()

    this.shapeCollection = new ShapesShaderCollection({
      regl: this.regl,
      image: this.image
    })
    this.macroCollection = new MacroShaderCollection({
      regl: this.regl,
      ctx: this.ctx,
      image: this.image
    })
    this.stepAndRepeatCollection = new StepAndRepeatCollection({
      regl: this.regl,
      ctx: this.ctx,
      image: this.image
    })
    this.datumCollection = new DatumCollection({
      image: this.image
    })

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
        func: 'greater',
        range: [0, 1]
      },
      cull: {
        enable: false,
        face: 'back'
      },
      context: {
        transformMatrix: () => this.transform.matrix,
        prevQtyFeaturesRef: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => context.qtyFeaturesRef ?? 1,
        qtyFeaturesRef: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => this.qtyFeatures * (context.qtyFeaturesRef ?? 1)
      },
      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.inverseMatrix,
        u_SymbolsTexture: () => this.shapeCollection.symbolsCollection.texture,
        u_SymbolsTextureDimensions: () => [
          this.shapeCollection.symbolsCollection.texture.width,
          this.shapeCollection.symbolsCollection.texture.height
        ],
        u_IndexOffset: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => {
          return this.transform.index / (context.prevQtyFeaturesRef ?? 1)
        },
        u_QtyFeatures: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => {
          return context.qtyFeaturesRef ?? 0
        },
        u_Polarity: () => this.transform.polarity,
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }),
          {}
        ),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }),
          {}
        ),
      }
    })

    this.queryConfig = this.regl<
      QueryUniforms,
      QueryAttributes,
      QueryProps,
      ShapeRendererCommonContext,
      REGL.DefaultContext & WorldContext
    >({
      uniforms: {
        u_QueryMode: true,
        u_Color: [1, 1, 1],
        u_Alpha: 1,
        u_PointerPosition: this.regl.prop<QueryProps, 'pointer'>('pointer')
      }
    })

    this.drawPads = ReglRenderers.drawPads!
    this.drawLines = ReglRenderers.drawLines!
    this.drawArcs = ReglRenderers.drawArcs!
    this.drawSurfaces = ReglRenderers.drawSurfaces!
    this.flattenSurfaces = ReglRenderers.drawFrameBuffer!

    this.drawDatumLines = new LineRenderer(this.ctx, this.datumCollection.lines)
    this.drawDatumText = new TextRenderer(this.ctx, this.datumCollection.texts)
    this.drawDatumPoints = new PointRenderer(this.ctx, this.datumCollection.points)

    this.queryFrameBuffer = this.regl.framebuffer({
      depth: true
    })
    this.surfaceFrameBuffer = this.regl.framebuffer({
      depth: true
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
        depth: 0
      })
      this.surfaceFrameBuffer.use(() => {
        this.drawSurfaces(attachment)
      })
      this.flattenSurfaces({
        renderTexture: this.surfaceFrameBuffer,
        qtyFeatures: this.qtyFeatures,
        index: attachment.surfaceIndex,
        polarity: attachment.surfacePolarity
      })
    })
    return this
  }

  public indexImage(): this {
    this.image.map((record, i) => (record.index = i))
    return this
  }

  public select(pointer: vec2, context: REGL.DefaultContext & WorldContext): Shapes.Shape[] {
    const origMatrix = mat3.clone(context.transformMatrix)
    this.transform.update(context.transformMatrix)
    context.transformMatrix = this.transform.matrix
    if (this.qtyFeatures > context.viewportWidth * context.viewportHeight) {
      console.error('Too many features to query')
      // TODO! for too many features, make multiple render passes in order to query all features
      return []
    }
    this.queryFrameBuffer.resize(context.viewportWidth, context.viewportHeight)
    const width = this.qtyFeatures < context.viewportWidth ? this.qtyFeatures % context.viewportWidth : context.viewportWidth
    const height = Math.ceil(this.qtyFeatures / context.viewportWidth)
    this.regl.clear({
      framebuffer: this.queryFrameBuffer,
      color: [0, 0, 0, 0],
      depth: 0
    })
    this.queryFrameBuffer.use(() => {
      this.commonConfig(() => {
        this.queryConfig({ pointer }, () => {
          this.drawPrimitives(context)
        })
      })
    })
    const data = this.regl.read({
      framebuffer: this.queryFrameBuffer,
      x: 0,
      y: 0,
      width: width,
      height: height
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
      this.shapeCollection.refresh()
      this.macroCollection.refresh()
      this.stepAndRepeatCollection.refresh()
      this.datumCollection.refresh()
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
    this.drawDatumLines.render(context)
    this.drawDatumText.render(context)
    this.drawDatumPoints.render(context)
  }

  private drawPrimitives(context: REGL.DefaultContext & WorldContext): void {
    if (this.shapeCollection.shaderAttachment.pads.length != 0)
      this.drawPads(this.shapeCollection.shaderAttachment.pads)
    if (this.shapeCollection.shaderAttachment.arcs.length != 0)
      this.drawArcs(this.shapeCollection.shaderAttachment.arcs)
    if (this.shapeCollection.shaderAttachment.lines.length != 0)
      this.drawLines(this.shapeCollection.shaderAttachment.lines)
    if (this.shapeCollection.shaderAttachment.surfaces.length != 0)
      this.drawSurfaces(this.shapeCollection.shaderAttachment.surfaces)
    this.drawSurfaceWithHoles(context)
  }

  public getBoundingBox(): BoundingBox {
    const contextBoundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity)
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

export interface LayerProps {
  name: string
  uid?: string
  /**
   * Units of the layer. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
   */
  units: Units
  visible?: boolean
  color?: vec3
  alpha?: number
  context?: string
  type?: string
  format?: string

}

export interface LayerRendererProps extends ShapeRendererProps, LayerProps { }


interface LayerUniforms {
  u_Color: vec3
  u_Alpha: number
}

interface LayerAttributes { }


export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public uid: string = UID()
  public name: string
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public alpha: number = 1
  public context = 'misc'
  public type = 'document'
  public format = 'raw'
  /**
   * Units of the layer. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
   */
  public units: 'mm' | 'inch' | 'mil' | 'cm' | number = 'mm'

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  constructor(props: LayerRendererProps) {
    super(props)

    this.units = props.units


    this.name = props.name
    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.alpha !== undefined) {
      this.alpha = props.alpha
    }
    if (props.context !== undefined) {
      this.context = props.context
    }
    if (props.type !== undefined) {
      this.type = props.type
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }
    if (props.uid !== undefined) {
      this.uid = props.uid
    }
    if (props.format !== undefined) {
      this.format = props.format
    }

    this.framebuffer = this.regl.framebuffer()

    this.layerConfig = this.regl<
      LayerUniforms,
      LayerAttributes,
      Record<string, never>,
      WorldContext
    >({
      depth: {
        enable: true,
        mask: true,
        func: 'greater',
        range: [0, 1]
      },
      // cull: {
      //   enable: true,
      //   face: 'back'
      // },
      uniforms: {
        u_Color: () => this.color,
        u_Alpha: () => this.alpha
      }
    })
  }

  public getBoundingBox(): BoundingBox {
    const boundingBox = super.getBoundingBox()
    vec2.scale(boundingBox.min, boundingBox.min, 1 / getUnitsConversion(this.units))
    vec2.scale(boundingBox.max, boundingBox.max, 1 / getUnitsConversion(this.units))
    return boundingBox
  }

  public select(pointer: vec2, context: REGL.DefaultContext & WorldContext): Shapes.Shape[] {
    this.transform.scale = this.transform.scale * 1 / getUnitsConversion(this.units)
    const features = super.select(pointer, context)
    this.transform.scale = this.transform.scale * getUnitsConversion(this.units)
    return features
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        this.transform.scale = this.transform.scale * 1 / getUnitsConversion(this.units)
        super.render(context)
        this.transform.scale = this.transform.scale * getUnitsConversion(this.units)
      })
    })
  }
}

interface MacroRendererProps extends Omit<ShapeRendererProps, 'transform'> {
  flatten: boolean
}

export class MacroRenderer extends ShapeRenderer {
  public framebuffer: REGL.Framebuffer2D
  public flatten: boolean
  private drawFrameBuffer: REGL.DrawCommand<
    REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>,
    FrameBufferRenderAttachments
  >
  constructor(props: MacroRendererProps) {
    super(props)

    this.flatten = props.flatten

    this.framebuffer = this.regl.framebuffer({
      depth: true
    })

    this.drawFrameBuffer = ReglRenderers.drawFrameBuffer!
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

  public render(
    context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
  ): void {
    if (this.flatten === false) {
      super.render(context)
      return
    }
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 1],
      stencil: 0,
      depth: 0
    })
    const tempPol = this.transform.polarity
    this.transform.polarity = 1
    this.framebuffer.use(() => {
      super.render(context)
    })
    this.transform.polarity = tempPol
    this.commonConfig(() => {
      this.drawFrameBuffer({
        renderTexture: this.framebuffer,
        index: this.transform.index,
        qtyFeatures: context.prevQtyFeaturesRef ?? 1,
        polarity: this.transform.polarity
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
      image: props.record.shapes
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
