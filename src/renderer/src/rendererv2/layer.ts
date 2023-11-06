import REGL from 'regl'
import PadFrag from '../shaders/Pad.frag'
import PadVert from '../shaders/Pad.vert'
import LineFrag from '../shaders/Line.frag'
import LineVert from '../shaders/Line.vert'
import ArcFrag from '../shaders/Arc.frag'
import ArcVert from '../shaders/Arc.vert'
import SurfaceFrag from '../shaders/Surface.frag'
import SurfaceVert from '../shaders/Surface.vert'
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
  SURFACE_RECORD_PARAMETERS_MAP
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

interface SurfaceFeature {
  attributes: REGL.Buffer
  contours: REGL.Texture2D
}

export default class Layer {
  public regl: REGL.Regl

  public visible = true
  public name: string
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())

  public pads: REGL.Buffer
  get qtyPads(): number {
    return this.pads.stats.size / (PAD_RECORD_PARAMETERS.length * glFloatSize * 4) // not sure why 4
  }

  public lines: REGL.Buffer
  get qtyLines(): number {
    return this.lines.stats.size / (LINE_RECORD_PARAMETERS.length * glFloatSize * 4)
  }

  public arcs: REGL.Buffer
  get qtyArcs(): number {
    return this.arcs.stats.size / (ARC_RECORD_PARAMETERS.length * glFloatSize * 4)
  }

  // public surfaces: REGL.Buffer[] = []
  // public contours: REGL.Texture2D[] = []
  public surfaces: SurfaceFeature[] = []

  public symbols: REGL.Texture2D

  public framebuffer: REGL.Framebuffer2D

  drawPads: REGL.DrawCommand<REGL.DefaultContext>
  drawLines: REGL.DrawCommand<REGL.DefaultContext>
  drawArcs: REGL.DrawCommand<REGL.DefaultContext>
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext>

  macros: { [key: string]: REGL.Framebuffer } = {}

  constructor(props: { regl: REGL.Regl; name: string }) {
    this.regl = props.regl

    this.name = props.name
    this.pads = this.regl.buffer(0)
    this.lines = this.regl.buffer(0)
    this.arcs = this.regl.buffer(0)
    this.symbols = this.regl.texture()
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

    this.drawSurfaces = this.regl<NonNullable<unknown>, NonNullable<unknown>>({
      frag: SurfaceFrag,

      vert: SurfaceVert,

      uniforms: {
        u_Color: () => this.color,
        u_ContoursTexture: (_context: REGL.DefaultContext, _props, batchId: number) =>
          this.surfaces[batchId].contours,
        u_ContoursTextureDimensions: (_context: REGL.DefaultContext, _props, batchId: number) => [
          this.surfaces[batchId].contours.width,
          this.surfaces[batchId].contours.height
        ]
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributes,
          // stride: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          offset: SURFACE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributes,
          // stride: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          offset: SURFACE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        // a_Size: {
        //   buffer: (_context: REGL.DefaultContext, _props, batchId: number) => this.surfaces[batchId].attributes,
        //   // stride: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
        //   offset: SURFACE_RECORD_PARAMETERS_MAP.width * glFloatSize, // implies height is next in vec2
        //   divisor: 1
        // },

        a_Box: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributes,
          // stride: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          offset: SURFACE_RECORD_PARAMETERS_MAP.top * glFloatSize, // implies height is next in vec2
          divisor: 1
        },

        a_SegmentsCount: {
          buffer: (_context: REGL.DefaultContext, _props, batchId: number) =>
            this.surfaces[batchId].attributes,
          // stride: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          offset: SURFACE_RECORD_PARAMETERS_MAP.segmentsCount * glFloatSize,
          divisor: 1
        }
      },

      instances: 1
    })

    this.macros['test'] = this.regl.framebuffer({
      color: this.regl.texture({
        width: 1,
        height: 1
      }),
      depth: true
    })
  }

  public init(data: (Records.Input_Record | Symbols.Symbol)[]): this {
    const pads: number[][] = []
    const lines: number[][] = []
    const arcs: number[][] = []
    const symbols: number[][] = []

    // Auto index if not provided
    let index = 0
    data.forEach((record) => {
      if (record.type === 'symbol') {
        symbols.push(record.array)
      }
      // Auto index if not provided
      if (!(record instanceof Symbols.Symbol)) {
        if (record.index === 0) {
          record.index = index++
        } else {
          index = record.index
        }
      }
      if (record.type === 'pad') {
        pads.push(record.array)
      }
      if (record.type === 'line') {
        lines.push(record.array)
      }
      if (record.type === 'arc') {
        arcs.push(record.array)
      }
      if (record.type === 'surface') {
        // surfaces.push(record.array)
        // contours.push(record.contoursArray)

        const surfaces = record.array
        const surfaceCountours = record.contoursArray
        // console.log('surfaceContours', surfaceCountours)
        // console.log('surfaceContours length', surfaceCountours.length)
        // console.log('segments count', record.segmentsCount)
        // console.log('trbl', record.top, record.right, record.bottom, record.left)
        // console.log('radius', Math.ceil(Math.sqrt(surfaceCountours.length)))
        const radius = Math.ceil(Math.sqrt(surfaceCountours.length))
        // console.log('radius', radius)
        // console.log('new length', Math.round(Math.pow(radius, 2)))
        const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
          return surfaceCountours[index] ?? 999
        })
        console.log('newData', newData)
        this.surfaces.push({
          attributes: this.regl.buffer({
            usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
            type: 'float',
            length: surfaces.length * SURFACE_RECORD_PARAMETERS.length * glFloatSize,
            data: surfaces
          }),
          contours: this.regl.texture({
            width: radius,
            height: radius,
            type: 'float',
            format: 'luminance',
            wrap: 'clamp',
            data: newData
          })
          // contours: this.regl.texture({
          //   width: surfaceCountours.length,
          //   height: 1,
          //   type: 'float',
          //   format: 'luminance',
          //   wrap: 'clamp',
          //   data: surfaceCountours
          // })
        })
      }
    })

    // TODO: make symbols not only expend in width but also in height
    symbols.length > 0 &&
      this.symbols({
        width: SYMBOL_PARAMETERS.length,
        height: symbols.length,
        type: 'float',
        format: 'luminance',
        data: symbols
      })
    this.pads({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: pads.length * PAD_RECORD_PARAMETERS.length * glFloatSize,
      data: pads
    })
    this.lines({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: lines.length * LINE_RECORD_PARAMETERS.length * glFloatSize,
      data: lines
    })
    this.arcs({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: arcs.length * ARC_RECORD_PARAMETERS.length * glFloatSize,
      data: arcs
    })

    // this.qtyPads = pads.length
    // this.qtyLines = lines.length
    // this.qtyArcs = qtyArcs.length

    return this
  }

  public render(context: REGL.DefaultContext): void {
    if (!this.visible) return
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 1
    })
    this.framebuffer.use(() => {
      this.drawPads()
      this.drawLines()
      this.drawArcs()
      this.drawSurfaces(this.surfaces.length)
    })
  }
}
