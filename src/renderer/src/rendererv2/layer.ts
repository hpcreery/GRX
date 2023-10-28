import REGL from 'regl'
import PadFrag from '../shaders/Pad.frag'
import PadVert from '../shaders/Pad.vert'
import LineFrag from '../shaders/Line.frag'
import LineVert from '../shaders/Line.vert'
import ArcFrag from '../shaders/Arc.frag'
import ArcVert from '../shaders/Arc.vert'
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
  ARC_RECORD_PARAMETERS_MAP
} = Records
const { SYMBOL_PARAMETERS, STANDARD_SYMBOLS_MAP } = Symbols

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer:
    | REGL.Buffer
    | undefined
    | null
    | false
    | ((context: REGL.DefaultContext, props: Layer) => REGL.Buffer)
    | REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
  u_Color: vec3
}

interface LineUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
  u_Color: vec3
}

interface ArcUniforms {
  u_SymbolsTexture: REGL.Texture2D
  u_SymbolsTextureDimensions: vec2
  u_Color: vec3
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

export default class Layer {
  public visible = true
  public name: string
  public regl: REGL.Regl
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public pads: REGL.Buffer
  public qtyPads: number
  public lines: REGL.Buffer
  public qtyLines: number
  public arcs: REGL.Buffer
  public qtyArcs: number
  public symbols: REGL.Texture2D
  public framebuffer: REGL.Framebuffer2D
  drawPads: REGL.DrawCommand<REGL.DefaultContext>
  drawLines: REGL.DrawCommand<REGL.DefaultContext>
  drawArcs: REGL.DrawCommand<REGL.DefaultContext>
  constructor(props: { regl: REGL.Regl; data: IPlotRecord[]; name: string }) {
    this.regl = props.regl

    const pads: number[][] = []
    const lines: number[][] = []
    const arcs: number[][] = []
    const symbols: number[][] = []
    const data = props.data

    data.forEach((record) => {
      if (record.type === 'pad') {
        pads.push(record.array)
      }
      if (record.type === 'line') {
        lines.push(record.array)
      }
      if (record.type === 'arc') {
        arcs.push(record.array)
      }
      if (record.type === 'symbol') {
        symbols.push(record.array)
      }
    })

    const symbolTexture = this.regl.texture({
      width: SYMBOL_PARAMETERS.length,
      height: Object.keys(STANDARD_SYMBOLS_MAP).length,
      type: 'float',
      format: 'luminance',
      data: symbols
    })
    const padBuffer = this.regl.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: (pads ?? []).length * PAD_RECORD_PARAMETERS.length * glFloatSize,
      data: pads
    })
    const lineBuffer = this.regl.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: (lines ?? []).length * LINE_RECORD_PARAMETERS.length * glFloatSize,
      data: lines
    })
    const arcBuffer = this.regl.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: (arcs ?? []).length * ARC_RECORD_PARAMETERS.length * glFloatSize,
      data: arcs
    })

    this.name = props.name
    this.qtyPads = (pads ?? []).length
    this.qtyLines = (lines ?? []).length
    this.qtyArcs = (arcs ?? []).length
    this.pads = padBuffer
    this.lines = lineBuffer
    this.arcs = arcBuffer
    this.symbols = symbolTexture
    this.framebuffer = this.regl.framebuffer()

    this.drawLines = this.regl<LineUniforms, LineAttributes>({
      frag: LineFrag,

      vert: LineVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols,
        u_SymbolsTextureDimensions: () => [this.symbols.width, this.symbols.height],
        u_Color: () => this.color
      },

      attributes: {
        a_Index: {
          buffer: () => this.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.qtyLines
    })

    this.drawPads = this.regl<PadUniforms, PadAttributes>({
      frag: PadFrag,

      vert: PadVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols,
        u_SymbolsTextureDimensions: () => [this.symbols.width, this.symbols.height],
        u_Color: () => this.color
      },

      attributes: {
        a_Index: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Location: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.x * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
          divisor: 1
        },

        a_Mirror: {
          buffer: () => this.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: PAD_RECORD_PARAMETERS_MAP.mirror * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.qtyPads
    })

    this.drawArcs = this.regl<ArcUniforms, ArcAttributes>({
      frag: ArcFrag,

      vert: ArcVert,

      uniforms: {
        u_SymbolsTexture: () => this.symbols,
        u_SymbolsTextureDimensions: () => [this.symbols.width, this.symbols.height],
        u_Color: () => this.color
      },

      attributes: {
        a_Index: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_Center_Location: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_Clockwise: {
          buffer: () => this.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
          divisor: 1
        }
      },

      instances: () => this.qtyArcs
    })
  }

  public render(): void {
    if (!this.visible) return
    this.framebuffer.use(() => {
      this.drawPads()
      this.drawLines()
      this.drawArcs()
    })
  }
}
