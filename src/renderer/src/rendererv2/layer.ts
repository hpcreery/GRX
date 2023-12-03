import REGL from 'regl'
import PadFrag from '../shaders/src/Pad.frag'
import PadVert from '../shaders/src/Pad.vert'
import LineFrag from '../shaders/src/Line.frag'
import LineVert from '../shaders/src/Line.vert'
import ArcFrag from '../shaders/src/Arc.frag'
import ArcVert from '../shaders/src/Arc.vert'
import SurfaceFrag from '../shaders/src/Surface.frag'
import SurfaceVert from '../shaders/src/Surface.vert'
import { vec2, vec3 } from 'gl-matrix'
import { IPlotRecord } from './types'
import * as Records from './records'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'

const {
  LINE_RECORD_PARAMETERS,
  PAD_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS_MAP,
  PAD_RECORD_PARAMETERS_MAP,
  ARC_RECORD_PARAMETERS_MAP,
  SURFACE_RECORD_PARAMETERS,
  SURFACE_RECORD_PARAMETERS_MAP,
  CONTOUR_RECORD_PARAMETERS_MAP,
  CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP,
  CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
} = Records

const { SYMBOL_PARAMETERS, SYMBOL_PARAMETERS_MAP, STANDARD_SYMBOLS_MAP } = Symbols

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer:
    | REGL.Buffer
    | undefined
    | null
    | false
    | ((context: REGL.DefaultContext, props: LayerRenderer, batchId: number) => REGL.Buffer)
    | REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
}

interface LineUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
}

interface ArcUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
}

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

interface CommonUniforms {}

interface ShaderCollection<T> {
  length: number
  records: T
  update: (data: T) => this
  refresh: () => this
}

class ShapeShaderCollection<T extends IPlotRecord> implements ShaderCollection<T[]> {
  public records: T[] = []
  get length(): number {
    return this.records.length
  }
  public buffer: REGL.Buffer

  constructor(props: { regl: REGL.Regl; records?: T[] }) {
    this.records = props.records ?? []
    this.buffer = props.regl.buffer(0)
    this.refresh()
  }

  public update(data: T[]): this {
    this.records = data
    return this.refresh()
  }

  public refresh(): this {
    const numbers: number[][] = []
    this.records.forEach((record) => {
      numbers.push(record.array)
    })
    this.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.length * 4,
      data: numbers
    })
    return this
  }
}

class SurfaceShaderCollection implements ShaderCollection<Records.Surface_Record> {
  public records: Records.Surface_Record = new Records.Surface_Record({})
  get length(): number {
    return this.records.length
  }
  public contourTexture: REGL.Texture2D
  public attributeBuffer: REGL.Buffer

  constructor(props: { regl: REGL.Regl; record?: Records.Surface_Record }) {
    this.records = props.record ?? new Records.Surface_Record({})
    this.contourTexture = props.regl.texture()
    this.attributeBuffer = props.regl.buffer(0)
    this.refresh()
  }

  public update(record: Records.Surface_Record): this {
    this.records = record
    return this.refresh()
  }

  public refresh(): this {
    const surfaces = this.records.array
    const surfaceCountours = this.records.contoursArray
    const radius = Math.ceil(Math.sqrt(surfaceCountours.length))
    const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
      return surfaceCountours[index] ?? Records.END_SURFACE_ID
    })
    this.attributeBuffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
      data: surfaces
    })
    this.contourTexture({
      width: radius,
      height: radius,
      type: 'float',
      format: 'luminance',
      wrap: 'clamp',
      data: newData
    })
    return this
  }
}

class SymbolShaderCollection implements ShaderCollection<Symbols.Symbol[]> {
  public records: Symbols.Symbol[] = []
  get length(): number {
    return this.records.length
  }
  public texture: REGL.Texture2D

  constructor(props: { regl: REGL.Regl; symbols?: Symbols.Symbol[] }) {
    this.records = props.symbols ?? []
    this.texture = props.regl.texture()
    this.refresh()
  }

  public update(symbols: Symbols.Symbol[]): this {
    this.records = symbols
    return this.refresh()
  }

  public refresh(): this {
    if (this.records.length === 0) {
      return this
    }
    const symbols = this.records.map((symbol) => symbol.array)
    // TODO: make symbols not only expend in width but also in height
    this.texture({
      width: SYMBOL_PARAMETERS.length,
      height: symbols.length,
      type: 'float',
      format: 'luminance',
      data: symbols
    })
    return this
  }
}

// class MacroCollection implements ShaderCollection<Records.Macro_Record[]> {

class ShapeRenderer {
  public regl: REGL.Regl

  public symbols: SymbolShaderCollection
  public pads: ShapeShaderCollection<Records.Pad_Record>
  public lines: ShapeShaderCollection<Records.Line_Record>
  public arcs: ShapeShaderCollection<Records.Arc_Record>
  public surfaces: SurfaceShaderCollection[] = []

  private commonConfig: REGL.DrawCommand<REGL.DefaultContext>
  private drawPads: REGL.DrawCommand<REGL.DefaultContext>
  private drawLines: REGL.DrawCommand<REGL.DefaultContext>
  private drawArcs: REGL.DrawCommand<REGL.DefaultContext>
  private drawSurfaces: REGL.DrawCommand<REGL.DefaultContext>

  constructor(props: ShapeRendererProps) {
    this.regl = props.regl

    this.symbols = new SymbolShaderCollection({ regl: this.regl })
    this.pads = new ShapeShaderCollection<Records.Pad_Record>({
      regl: this.regl
    })
    this.lines = new ShapeShaderCollection<Records.Line_Record>({
      regl: this.regl
    })
    this.arcs = new ShapeShaderCollection<Records.Arc_Record>({
      regl: this.regl
    })

    this.commonConfig = this.regl<CommonUniforms, CommonAttributes>({
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

    this.drawLines = this.regl<LineUniforms, LineAttributes>({
      frag: LineFrag,

      vert: LineVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols.texture,
        u_SymbolsTextureDimensions: () => [this.symbols.texture.width, this.symbols.texture.height]
      },

      attributes: {
        a_Index: {
          buffer: () => this.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.lines.buffer,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.lines.length
    })

    this.drawPads = this.regl<PadUniforms, PadAttributes>({
      frag: PadFrag,

      vert: PadVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols.texture,
        u_SymbolsTextureDimensions: () => [this.symbols.texture.width, this.symbols.texture.height]
      },

      attributes: {
        a_Index: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Location: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.x * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
          divisor: 1
        },

        a_Mirror: {
          buffer: () => this.pads.buffer,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.mirror * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.pads.length
    })

    this.drawArcs = this.regl<ArcUniforms, ArcAttributes>({
      frag: ArcFrag,

      vert: ArcVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols.texture,
        u_SymbolsTextureDimensions: () => [this.symbols.texture.width, this.symbols.texture.height]
      },

      attributes: {
        a_Index: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_Center_Location: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Clockwise: {
          buffer: () => this.arcs.buffer,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.arcs.length
    })

    this.drawSurfaces = this.regl<SurfaceUniforms, SurfaceAttributes>({
      frag: SurfaceFrag,

      vert: SurfaceVert,

      uniforms: {
        u_ContoursTexture: (_context: REGL.DefaultContext, _props, batchId: number) =>
          this.surfaces[batchId].contourTexture,
        u_ContoursTextureDimensions: (_context: REGL.DefaultContext, _props, batchId: number) => [
          this.surfaces[batchId].contourTexture.width,
          this.surfaces[batchId].contourTexture.height
        ],
        u_EndSurfaceId: Records.END_SURFACE_ID,
        u_ContourId: Records.CONTOUR_ID,
        u_EndContourId: Records.END_CONTOUR_ID,
        u_LineSegmentId: Records.CONTOUR_LINE_SEGMENT_ID,
        u_ArcSegmentId: Records.CONTOUR_ARC_SEGMENT_ID
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Box: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributeBuffer,
          offset: SURFACE_RECORD_PARAMETERS_MAP.top * glFloatSize, // implies height is next in vec2
          divisor: 1
        }
      },

      instances: 1
    })
  }

  public update(data: Records.Shape[]): this {
    const qtyFeatures = data.length
    const pads: Records.Pad_Record[] = []
    const lines: Records.Line_Record[] = []
    const arcs: Records.Arc_Record[] = []

    // Auto index
    let index = 0
    data.forEach((record) => {

      // Auto index
      record.index = index++ / qtyFeatures

      if (record instanceof Records.Pad_Record) {
        pads.push(record)
        return
      }
      if (record instanceof Records.Line_Record) {
        lines.push(record)
        return
      }
      if (record instanceof Records.Arc_Record) {
        arcs.push(record)
        return
      }
      if (record instanceof Records.Surface_Record) {
        this.surfaces.push(new SurfaceShaderCollection({ regl: this.regl, record }))
        return
      }
    })

    this.pads.update(pads)
    this.lines.update(lines)
    this.arcs.update(arcs)

    return this
  }

  public render(_context: REGL.DefaultContext): void {
    // this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    // this.regl.clear({
    //   framebuffer: this.framebuffer,
    //   color: [0, 0, 0, 0],
    //   depth: 0
    // })
    // this.framebuffer.use(() => {
    this.commonConfig(() => {
      this.drawPads()
      this.drawArcs()
      this.drawLines()
      this.drawSurfaces(this.surfaces.length)
    })
    // })
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

export interface ShapeRendererProps {
  regl: REGL.Regl
  name: string
}

export interface LayerRendererProps extends ShapeRendererProps {
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

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext>

  public framebuffer: REGL.Framebuffer2D

  macros: { [key: string]: REGL.Framebuffer } = {}

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

    this.layerConfig = this.regl<LayerUniforms, LayerAttributes>({
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

    // this.macros['test'] = this.regl.framebuffer({
    //   color: this.regl.texture({
    //     width: 1,
    //     height: 1
    //   }),
    //   depth: true
    // })
  }

  public render(context: REGL.DefaultContext): void {
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

interface MacroProps extends LayerRendererProps {}

class MacroRenderer extends ShapeRenderer {
  constructor(props: MacroProps) {
    super(props)
  }

  // private getBounds(): vec4 {
  //   for (const pad of this.padsBuffer) {
  //   }
  // }
}
