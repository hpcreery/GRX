import REGL from 'regl'
import PadFrag from '../shaders/src/Pad.frag'
import PadVert from '../shaders/src/Pad.vert'
import LineFrag from '../shaders/src/Line.frag'
import LineVert from '../shaders/src/Line.vert'
import ArcFrag from '../shaders/src/Arc.frag'
import ArcVert from '../shaders/src/Arc.vert'
import SurfaceFrag from '../shaders/src/Surface.frag'
import SurfaceVert from '../shaders/src/Surface.vert'
import { vec2, vec3, mat3 } from 'gl-matrix'
import * as Shapes from './shapes'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import onChange from 'on-change'
import { Transform } from './types'

import { ShapesShaderCollection, MacroShaderCollection } from './collections'

import { WorldContext } from './engine'

const {
  LINE_RECORD_PARAMETERS,
  PAD_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS_MAP,
  PAD_RECORD_PARAMETERS_MAP,
  ARC_RECORD_PARAMETERS_MAP,
  SURFACE_RECORD_PARAMETERS_MAP,
  CONTOUR_RECORD_PARAMETERS_MAP,
  CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP,
  CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
} = Shapes

const { SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer:
    | REGL.Buffer
    | undefined
    | null
    | false
    | ((context: REGL.DefaultContext, props: LayerRenderer, batchId: number) => REGL.Buffer)
    | REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {}

interface LineUniforms {}

interface ArcUniforms {}

interface SurfaceUniforms {
  u_ContoursTexture: REGL.Texture2D
  u_ContoursTextureDimensions: vec2
  u_EndSurfaceId: number
  u_ContourId: number
  u_EndContourId: number
  u_LineSegmentId: number
  u_ArcSegmentId: number
}

interface PadAttributes {
  a_SymNum: CustomAttributeConfig
  a_Location: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror: CustomAttributeConfig
}

interface LineAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
}

interface ArcAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Center_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Clockwise: CustomAttributeConfig
}

interface SurfaceAttributes {
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Box: CustomAttributeConfig
}

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
  private dirty = false
  public readonly records: Shapes.Shape[] = onChange([], (path, value, prev, apply) => {
    console.log('records changed', { path, value, prev, apply })
    onChange.target(this.records).map((record, i) => (record.index = i))
    this.dirty = true
  })

  public shapeCollection: ShapesShaderCollection
  public macroCollection: MacroShaderCollection

  public get qtyFeatures(): number {
    return this.records.length
  }

  protected commonConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawPads: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawLines: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawArcs: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & WorldContext>
  protected drawMacros: (context: REGL.DefaultContext & WorldContext) => this

  public transform: ShapeTransfrom = {
    datum: vec2.create(),
    rotation: 0,
    scale: 1,
    mirror: 0,
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
          // console.log(this.transform.datum.toString(), 'u_IndexOffset', ioff)
          return ioff
        },
        u_QtyFeatures: (
          context: REGL.DefaultContext & WorldContext & Partial<ShapeRendererCommonContext>
        ) => {
          const qtyFeatures = context.qtyFeaturesRef ?? 1
          // console.log(this.transform.datum.toString(), 'u_QtyFeatures', qtyFeatures)
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

    this.drawLines = this.regl<
      LineUniforms,
      LineAttributes,
      Record<string, never>,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: LineFrag,

      vert: LineVert,

      uniforms: {},

      attributes: {
        a_Index: {
          buffer: () => this.shapeCollection.shaderAttachment.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.shapeCollection.shaderAttachment.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.shapeCollection.shaderAttachment.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.shapeCollection.shaderAttachment.lines.length
    })

    this.drawPads = this.regl<
      PadUniforms,
      PadAttributes,
      Record<string, never>,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: PadFrag,

      vert: PadVert,

      uniforms: {},

      attributes: {
        a_Index: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.x * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
          divisor: 1
        },

        a_Mirror: {
          buffer: () => this.shapeCollection.shaderAttachment.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.mirror * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.shapeCollection.shaderAttachment.pads.length
    })

    this.drawArcs = this.regl<
      ArcUniforms,
      ArcAttributes,
      Record<string, never>,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: ArcFrag,

      vert: ArcVert,

      uniforms: {},

      attributes: {
        a_Index: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_Center_Location: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Clockwise: {
          buffer: () => this.shapeCollection.shaderAttachment.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.shapeCollection.shaderAttachment.arcs.length
    })

    this.drawSurfaces = this.regl<
      SurfaceUniforms,
      SurfaceAttributes,
      Record<string, never>,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: SurfaceFrag,

      vert: SurfaceVert,

      uniforms: {
        u_ContoursTexture: (_context: REGL.DefaultContext, _props, batchId: number) =>
          this.shapeCollection.shaderAttachment.surfaces[batchId].contourTexture,
        u_ContoursTextureDimensions: (_context: REGL.DefaultContext, _props, batchId: number) => [
          this.shapeCollection.shaderAttachment.surfaces[batchId].contourTexture.width,
          this.shapeCollection.shaderAttachment.surfaces[batchId].contourTexture.height
        ],
        u_EndSurfaceId: Shapes.END_SURFACE_ID,
        u_ContourId: Shapes.CONTOUR_ID,
        u_EndContourId: Shapes.END_CONTOUR_ID,
        u_LineSegmentId: Shapes.CONTOUR_LINE_SEGMENT_ID,
        u_ArcSegmentId: Shapes.CONTOUR_ARC_SEGMENT_ID
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.shapeCollection.shaderAttachment.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.shapeCollection.shaderAttachment.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Box: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.shapeCollection.shaderAttachment.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.top * glFloatSize, // implies right, bottom, left is next in vec4
          divisor: 1
        }
      },

      instances: 1
    })

    this.drawMacros = (context: REGL.DefaultContext & WorldContext): this => {
      this.macroCollection.macros.forEach((macro) => {
        macro.records.forEach((record) => {
          macro.renderer.updateTransformFromPad(record)
          macro.renderer.render(context)
        })
      })
      return this
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
  }

  public updateTransform(inputMatrix: mat3): void {
    const { rotation, scale, datum } = this.transform
    mat3.rotate(this.transform.matrix, inputMatrix, rotation * (Math.PI / 180))
    mat3.translate(this.transform.matrix, this.transform.matrix, datum)
    mat3.scale(this.transform.matrix, this.transform.matrix, [scale, scale])
    mat3.scale(this.transform.matrix, this.transform.matrix, [this.transform.mirror ? -1 : 1, 1])
    mat3.invert(this.transform.inverseMatrix, this.transform.matrix)
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.transform.update(context.transform.matrix)
    if (this.dirty) {
      this.shapeCollection.refresh()
      this.macroCollection.refresh()
      this.dirty = false
    }
    this.commonConfig(() => {
      this.drawPads()
      this.drawArcs()
      this.drawLines()
      this.drawSurfaces(this.shapeCollection.shaderAttachment.surfaces.length)
      this.drawMacros(context)
    })
  }
}

export const LayerContext = {
  BOARD: 'board',
  MISC: 'misc'
} as const
export type LayerContexts = (typeof LayerContext)[keyof typeof LayerContext]

export const LayerType = {
  SILKSCREEN: 'silkscreen',
  SOLDERMASK: 'soldermask',
  SIGNAL: 'signal',
  MIXED: 'mixed',
  POWER_GROUND: 'power_ground',
  DOCUMENT: 'document',
  DRILL: 'drill',
  ROUT: 'rout'
} as const
export type LayerTypes = (typeof LayerType)[keyof typeof LayerType]

export interface LayerRendererProps extends ShapeRendererProps {
  name: string
  color?: vec3
  context?: LayerContexts
  type?: LayerTypes
}

interface LayerUniforms {
  u_Color: vec3
}

interface LayerAttributes {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public name: string
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public context: LayerContexts = 'misc'
  public type: LayerTypes = 'document'

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
      precision mediump float;

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
      precision mediump float;

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
