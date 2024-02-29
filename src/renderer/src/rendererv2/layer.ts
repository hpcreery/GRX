import REGL from 'regl'
import { vec2, vec3, mat3 } from 'gl-matrix'
import * as Shapes from './shapes'
import * as Symbols from './symbols'
import onChange from 'on-change'
import { Transform } from './types'
import { ReglRenderers } from './collections'

import {
  ShapesShaderCollection,
  MacroShaderCollection,
  StepAndRepeatCollection
} from './collections'

import { WorldContext } from './engine'

const {
  SURFACE_RECORD_PARAMETERS_MAP,
  CONTOUR_RECORD_PARAMETERS_MAP,
  CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP,
  CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
} = Shapes

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

interface ShapeTransfrom extends Transform {
  index: number
  polarity: number
  matrix: mat3
  inverseMatrix: mat3
  update: (inputMatrix: mat3) => void
}

export interface ShapeRendererProps {
  regl: REGL.Regl
  image: Shapes.Shape[]
  transform?: Partial<ShapeTransfrom>
}

interface ShapeRendererCommonContext {
  qtyFeaturesRef: number
  prevQtyFeaturesRef: number
}

export class ShapeRenderer {
  public regl: REGL.Regl
  public dirty = true
  // ** unfortunately, onChange adds a lot of overhead to the records array and it's not really needed
  // public readonly records: Shapes.Shape[] = onChange([], (path, value, prev, apply) => {
  //   // console.log('records changed', { path, value, prev, apply })
  //   onChange.target(this.records).map((record, i) => (record.index = i))
  //   this.dirty = true
  // })
  public readonly records: Shapes.Shape[] = []

  public shapeCollection: ShapesShaderCollection
  public macroCollection: MacroShaderCollection
  public stepAndRepeatCollection: StepAndRepeatCollection

  public get qtyFeatures(): number {
    return this.records.length
  }

  protected commonConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawPads!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawLines!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawArcs!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  // *** Brushed Shapes - DISABLED FOR PERFORMANCE REASONS ***
  // protected drawBrushedLines!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>[]
  // *** Brushed Shapes - DISABLED FOR PERFORMANCE REASONS ***
  // protected drawBrushedArcs!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>[]
  protected drawSurfaces!: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawMacros: (context: REGL.DefaultContext & WorldContext) => this
  protected drawStepAndRepeats: (context: REGL.DefaultContext & WorldContext) => this

  public transform: ShapeTransfrom = {
    datum: vec2.create(),
    rotation: 0,
    scale: 1,
    mirror: 0,
    order: ['rotate', 'translate', 'scale', 'mirror'], // // Default Order
    index: 0,
    polarity: 1,
    matrix: mat3.create(),
    inverseMatrix: mat3.create(),
    update: (inputMatrix: mat3) => this.updateTransform(inputMatrix)
  }

  constructor(props: ShapeRendererProps) {
    this.regl = props.regl

    if (props.transform) {
      Object.assign(this.transform, props.transform)
    }

    this.records.push(...props.image)
    this.shapeCollection = new ShapesShaderCollection({
      regl: this.regl,
      records: this.records
    })
    this.macroCollection = new MacroShaderCollection({
      regl: this.regl,
      records: this.records
    })
    this.stepAndRepeatCollection = new StepAndRepeatCollection({
      regl: this.regl,
      records: this.records
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
        enable: true,
        face: 'back'
      },
      context: {
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
          const ioff =
            (this.transform.index * (context.qtyFeaturesRef ?? 1)) /
              (context.prevQtyFeaturesRef ?? 1) || 0
          return ioff
        },
        u_QtyFeatures: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => {
          const qtyFeatures = context.qtyFeaturesRef ?? 1
          return qtyFeatures
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
        ...Object.entries(SURFACE_RECORD_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_SurfaceParameters.${key}`]: value }),
          {}
        ),
        ...Object.entries(CONTOUR_RECORD_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_ContourParameters.${key}`]: value }),
          {}
        ),
        ...Object.entries(CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_ArcSegmentParameters.${key}`]: value }),
          {}
        ),
        ...Object.entries(CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_LineSegmentParameters.${key}`]: value }),
          {}
        )
      }
    })

    Object.assign(this, ReglRenderers)

    this.drawMacros = (context: REGL.DefaultContext & WorldContext): this => {
      this.macroCollection.macros.forEach((macro) => {
        macro.records.forEach((record) => {
          macro.renderer.updateTransformFromPad(record)
          macro.renderer.render(context)
        })
      })
      return this
    }

    this.drawStepAndRepeats = (context: REGL.DefaultContext & WorldContext): this => {
      this.stepAndRepeatCollection.steps.forEach((stepAndRepeat) => {
        stepAndRepeat.render(context)
      })
      return this
    }
  }

  public updateTransform(inputMatrix: mat3): void {
    const { rotation, scale, datum } = this.transform
    this.transform.matrix = mat3.clone(inputMatrix)
    if (!this.transform.order) this.transform.order = ['rotate', 'translate', 'scale', 'mirror']
    for (const transform of this.transform.order) {
      switch (transform) {
        case 'scale':
          mat3.scale(this.transform.matrix, this.transform.matrix, [scale, scale])
          break
        case 'translate':
          mat3.translate(this.transform.matrix, this.transform.matrix, datum)
          break
        case 'rotate':
          mat3.rotate(this.transform.matrix, this.transform.matrix, rotation * (Math.PI / 180))
          break
        case 'mirror':
          mat3.scale(this.transform.matrix, this.transform.matrix, [1, this.transform.mirror ? -1 : 1])
          break
      }
    }

    // GDSII order
    // mat3.scale(this.transform.matrix, inputMatrix, [1, this.transform.mirror ? -1 : 1])
    // mat3.translate(this.transform.matrix, this.transform.matrix, this.transform.mirror ? [datum[0], -datum[1]] : datum)
    // mat3.rotate(this.transform.matrix, this.transform.matrix, (this.transform.mirror ? -1 : 1)*rotation * (Math.PI / 180))
    // mat3.scale(this.transform.matrix, this.transform.matrix, [scale, scale])

    // Default Order
    // mat3.rotate(this.transform.matrix, inputMatrix, rotation * (Math.PI / 180))
    // mat3.translate(this.transform.matrix, this.transform.matrix, datum)
    // mat3.scale(this.transform.matrix, this.transform.matrix, [scale, scale])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [this.transform.mirror ? -1 : 1, 1])

    mat3.invert(this.transform.inverseMatrix, this.transform.matrix)
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.transform.update(context.transform.matrix)
    if (this.dirty) {
      this.shapeCollection.refresh()
      this.macroCollection.refresh()
      this.stepAndRepeatCollection.refresh()
      this.dirty = false
    }
    this.commonConfig(() => {
      if (this.shapeCollection.shaderAttachment.pads.length != 0) this.drawPads(this.shapeCollection.shaderAttachment.pads)
      if (this.shapeCollection.shaderAttachment.arcs.length != 0) this.drawArcs(this.shapeCollection.shaderAttachment.arcs)
      if (this.shapeCollection.shaderAttachment.lines.length != 0) this.drawLines(this.shapeCollection.shaderAttachment.lines)
      if (this.shapeCollection.shaderAttachment.surfaces.length != 0) this.drawSurfaces(this.shapeCollection.shaderAttachment.surfaces)
      this.drawMacros(context)
      this.drawStepAndRepeats(context)
      // *** Brushed Shapes - DISABLED FOR PERFORMANCE REASONS ***
      // this.shapeCollection.shaderAttachment.brushedLines.forEach((attachment) => {
      //   if (attachment.length === 0) return
      //   this.drawBrushedLines[attachment.symbol](attachment)
      // })
      // *** Brushed Shapes - DISABLED FOR PERFORMANCE REASONS ***
      // this.shapeCollection.shaderAttachment.brushedArcs.forEach((attachment) => {
      //   if (attachment.length === 0) return
      //   this.drawBrushedArcs[attachment.symbol](attachment)
      // })

    })
  }
}

export interface LayerRendererProps extends ShapeRendererProps {
  name: string
  color?: vec3
  context?: string
  type?: string
}

interface LayerUniforms {
  u_Color: vec3
}

interface LayerAttributes {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public name: string
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public context = 'misc'
  public type = 'document'

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  constructor(props: LayerRendererProps) {
    super(props)

    this.name = props.name
    if (props.color) {
      this.color = props.color
    }
    if (props.context) {
      this.context = props.context
    }
    if (props.type) {
      this.type = props.type
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
      cull: {
        enable: true,
        face: 'back'
      },
      uniforms: {
        u_Color: () => this.color
      }
    })
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    if (!this.visible) return
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        super.render(context)
      })
    })
  }
}

interface MacroUniforms {
  u_QtyFeatures: number
  u_Index: number
  u_Polarity: number
  u_RenderTexture: REGL.Framebuffer2D
}
interface MacroAttributes {}

interface MacroRendererProps extends Omit<ShapeRendererProps, 'transform'> {
  flatten: boolean
}

export class MacroRenderer extends ShapeRenderer {
  public framebuffer: REGL.Framebuffer2D
  public flatten: boolean
  private drawFrameBuffer: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  constructor(props: MacroRendererProps) {
    super(props)

    this.flatten = props.flatten

    this.framebuffer = this.regl.framebuffer({
      depth: true
    })

    this.drawFrameBuffer = this.regl<
      MacroUniforms,
      MacroAttributes,
      Record<string, never>,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      vert: `
      precision highp float;

      uniform float u_Index;
      uniform float u_QtyFeatures;

      attribute vec2 a_Vertex_Position;

      varying float v_Index;
      varying vec2 v_UV;

      void main () {
        float Index = u_Index / u_QtyFeatures;
        v_UV = a_Vertex_Position;
        v_Index =  Index;
        gl_Position = vec4(a_Vertex_Position, Index, 1.0);
      }
    `,
      frag: `
      precision highp float;

      uniform sampler2D u_RenderTexture;
      uniform float u_Polarity;
      uniform bool u_OutlineMode;

      varying vec2 v_UV;
      varying float v_Index;

      void main () {
        vec4 color = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) {
          discard;
        }
        if (u_Polarity == 0.0 && !u_OutlineMode) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
        gl_FragColor = color;
        //gl_FragColor = vec4(v_Index, 0.0, 0.0, 1.0);
      }
    `,
      depth: {
        enable: true,
        mask: true,
        func: 'greater',
        range: [0, 1]
      },
      uniforms: {
        u_QtyFeatures: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => context.prevQtyFeaturesRef ?? 1,
        u_RenderTexture: () => this.framebuffer,
        u_Index: () => this.transform.index,
        u_Polarity: () => this.transform.polarity
      }
    })
  }

  public updateTransformFromPad(pad: Shapes.Pad): void {
    this.transform.datum = vec2.fromValues(pad.x, pad.y)
    this.transform.rotation = pad.rotation
    this.transform.scale = pad.resize_factor
    this.transform.mirror = pad.mirror
    this.transform.index = pad.index
    this.transform.polarity = pad.polarity
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
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
      this.drawFrameBuffer()
    })
  }
}

export class StepAndRepeatRenderer extends ShapeRenderer {
  public repeats: Transform[]

  constructor(props: ShapeRendererProps & { repeats: Transform[] }) {
    super(props)
    this.repeats = props.repeats
  }

  public updateTransformFromRepeat(repeat: Transform): void {
    this.transform.datum = repeat.datum
    this.transform.rotation = repeat.rotation
    this.transform.scale = repeat.scale
    this.transform.mirror = repeat.mirror
    this.transform.order = repeat.order
    this.transform.index = 0
    this.transform.polarity = 1
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.repeats.forEach((repeat) => {
      this.updateTransformFromRepeat(repeat)
      super.render(context)
    })
  }
}
