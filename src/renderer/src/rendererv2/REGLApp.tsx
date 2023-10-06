/* eslint-disable react/prop-types */
import React from 'react'
import '../App.css'
import PadFrag from '../shaders/Pad.frag'
import PadVert from '../shaders/Pad.vert'
import LineFrag from '../shaders/Line.frag'
import LineVert from '../shaders/Line.vert'
import regl from 'regl'
import { mat2, mat2d, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix'
// import ndarray from 'ndarray'
// import glsl from 'glslify'

const STANDARD_SYMBOLS = [
  'Null',
  'Round',
  'Square',
  'Rectangle',
  'Rounded_Rectangle',
  'Chamfered_Rectangle',
  'Oval',
  'Diamond',
  'Octagon',
  'Round_Donut',
  'Square_Donut',
  'SquareRound_Donut',
  'Rounded_Square_Donut',
  'Rectange_Donut',
  'Rounded_Rectangle_Donut',
  'Oval_Donut',
  'Horizontal_Hexagon',
  'Vertical_Hexagon',
  'Butterfly',
  'Square_Butterfly',
  'Triangle',
  'Half_Oval',
  'Rounded_Round_Thermal',
  'Squared_Round_Thermal',
  'Square_Thermal',
  'Open_Corners_Square_Thermal',
  'Line_Thermal',
  'Square_Round_Thermal',
  'Rectangular_Thermal',
  'Rectangular_Thermal_Open_Corners',
  'Rounded_Square_Thermal',
  'Rounded_Square_Thermal_Open_Corners',
  'Rounded_Rectangular_Thermal',
  'Oval_Thermal',
  'Oblong_Thermal',
  // ! Implement these symbols
  // "Home_Plate",
  // "Inverted_Home_Plate",
  // "Flat_Home_Plate",
  // "Radiused_Inverted_Home_Plate",
  // "Radiused_Home_Plate",
  // "Cross",
  // "Dogbone",
  // "DPack",
  'Ellipse',
  'Moire',
  'Hole'
] as const
const STANDARD_SYMBOLS_MAP = Object.fromEntries(STANDARD_SYMBOLS.map((key, i) => [key, i])) as {
  [key in (typeof STANDARD_SYMBOLS)[number]]: number
}

// =================
const PAD_RECORD_PARAMETERS = [
  'index',
  'x',
  'y',
  'sym_num',
  'resize_factor',
  'polarity',
  'rotation',
  'mirror'
] as const
const PAD_RECORD_PARAMETERS_MAP = Object.fromEntries(
  PAD_RECORD_PARAMETERS.map((key, i) => [key, i])
) as { [key in (typeof PAD_RECORD_PARAMETERS)[number]]: number }

interface IBufferElement {
  toArray(): number[]
}

interface ITextureElement {
  toArray(): number[]
}

// =================
type TPad_Record = typeof PAD_RECORD_PARAMETERS_MAP

type IPad_Record = TPad_Record

class Pad_Record implements IPad_Record, IBufferElement {
  public index = 0
  public x = 0
  public y = 0
  public sym_num = 0
  public resize_factor = 0
  public polarity = 0
  public rotation = 0
  public mirror = 0

  constructor(record: Partial<TPad_Record>) {
    Object.assign(this, record)
  }

  public toArray(): number[] {
    const array: number[] = []
    PAD_RECORD_PARAMETERS.forEach((key, i) => (array[i] = this[key]))
    return array
  }
}
// =================

// =================
const LINE_RECORD_PARAMETERS = ['index', 'xs', 'ys', 'xe', 'ye', 'sym_num', 'polarity'] as const

const LINE_RECORD_PARAMETERS_MAP = Object.fromEntries(
  LINE_RECORD_PARAMETERS.map((key, i) => [key, i])
) as { [key in (typeof LINE_RECORD_PARAMETERS)[number]]: number }

type TLine_Record = typeof LINE_RECORD_PARAMETERS_MAP

type ILine_Record = TLine_Record

class Line_Record implements ILine_Record, IBufferElement {
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public sym_num = 0
  public polarity = 0

  constructor(record: Partial<TLine_Record>) {
    Object.assign(this, record)
  }

  public toArray(): number[] {
    const array: number[] = []
    LINE_RECORD_PARAMETERS.forEach((key, i) => (array[i] = this[key]))
    return array
  }
}
// =================

// =================
const ARC_RECORD_PARAMETERS = [
  'index',
  'xs',
  'ys',
  'xe',
  'ye',
  'xc',
  'yc',
  'sym_num',
  'polarity',
  'clockwise'
] as const

const ARC_RECORD_PARAMETERS_MAP = Object.fromEntries(
  ARC_RECORD_PARAMETERS.map((key, i) => [key, i])
) as { [key in (typeof ARC_RECORD_PARAMETERS)[number]]: number }

type TArc_Record = typeof ARC_RECORD_PARAMETERS_MAP

type IArc_Record = TArc_Record

class Arc_Record implements IArc_Record, IBufferElement {
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public xc = 0
  public yc = 0
  public sym_num = 0
  public polarity = 0
  public clockwise = 0

  constructor(record: Partial<TArc_Record>) {
    Object.assign(this, record)
  }

  public toArray(): number[] {
    const array: number[] = []
    ARC_RECORD_PARAMETERS.forEach((key, i) => (array[i] = this[key]))
    return array
  }
}
// =================

// =================
const SYMBOL_PARAMETERS = [
  'symbol',
  'width',
  'height',
  'corner_radius',
  'corners',
  'outer_dia',
  'inner_dia',
  'line_width',
  'line_length',
  'angle',
  'gap',
  'num_spokes',
  'round',
  'cut_size',
  'ring_width',
  'ring_gap',
  'num_rings'
] as const
const SYMBOL_PARAMETERS_MAP = Object.fromEntries(SYMBOL_PARAMETERS.map((key, i) => [key, i])) as {
  [key in (typeof SYMBOL_PARAMETERS)[number]]: number
}

type TSymbol = typeof SYMBOL_PARAMETERS_MAP

interface ISymbol extends TSymbol {
  toArray(): number[]
}

class Symbol implements ISymbol, ITextureElement {
  public symbol: number = STANDARD_SYMBOLS_MAP.Null
  public width = 0
  public height = 0
  public corner_radius = 0
  public corners = 0
  public outer_dia = 0
  public inner_dia = 0
  public line_width = 0
  public line_length = 0
  public angle = 0
  public gap = 0
  public num_spokes = 0
  public round = 0
  public cut_size = 0
  public ring_width = 0
  public ring_gap = 0
  public num_rings = 0

  constructor(symbol: Partial<TSymbol>) {
    Object.assign(this, symbol)
  }

  public toArray(): number[] {
    const array: number[] = []
    SYMBOL_PARAMETERS.forEach((key, i) => (array[i] = this[key]))
    return array
  }
}
// =================

function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  // N == Number of Shapes
  const N_PADS = 300
  const N_LINES = 30

  const COLOR1: vec3 = [0, 0.6, 0.6]
  const COLOR2: vec3 = [0.6, 0, 0.6]

  const OUTLINE_MODE = false

  const FPS = 60
  const FPSMS = 1000 / FPS

  const FLOAT_SIZE = 4

  const transform = mat3.create()
  mat3.identity(transform)

  const inverseTransform = mat3.create()
  mat3.identity(inverseTransform)

  const identity = mat2d.create()
  mat2d.identity(identity)

  let dirty = true
  let scale = 1
  const postion = vec2.create()
  let velocity = vec2.create()
  let dragging = false

  function updateTransform(x: number, y: number): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const s = scale
    const { width, height } = reglRef.current.getBoundingClientRect()
    mat3.projection(transform, width, height)
    mat3.translate(transform, transform, [x, y])
    mat3.scale(transform, transform, [s, s])
    mat3.translate(transform, transform, [width / 2, height / 2])
    mat3.scale(transform, transform, [width / 2, -height / 2])
    // console.log(
    //   'transform \n' +
    //   `${Math.round(transform[0] * 100) / 100}, ${Math.round(transform[1] * 100) / 100}, ${Math.round(transform[2] * 100) / 100},\n` +
    //   `${Math.round(transform[3] * 100) / 100}, ${Math.round(transform[4] * 100) / 100}, ${Math.round(transform[5] * 100) / 100},\n` +
    //   `${Math.round(transform[6] * 100) / 100}, ${Math.round(transform[7] * 100) / 100}, ${Math.round(transform[8] * 100) / 100
    //   }`
    // )

    mat3.invert(inverseTransform, transform)
    // console.log(
    //   'inverseTransform \n' +
    //   `${Math.round(inverseTransform[0] * 100) / 100}, ${Math.round(inverseTransform[1] * 100) / 100}, ${Math.round(inverseTransform[2] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[3] * 100) / 100}, ${Math.round(inverseTransform[4] * 100) / 100}, ${Math.round(inverseTransform[5] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[6] * 100) / 100}, ${Math.round(inverseTransform[7] * 100) / 100}, ${Math.round(inverseTransform[8] * 100) / 100
    //   }`
    // )

    // console.log(s)
  }

  function scaleAtPoint(x: number, y: number, s: number): void {
    let newscale = scale - s / (1000 / scale / 2)
    let scaleby = newscale / scale
    if (newscale < 0.01) {
      newscale = 0.01
      scaleby = newscale / scale
      scale = newscale
    } else if (newscale > 10) {
      newscale = 10
      scaleby = newscale / scale
      scale = newscale
    } else {
      scale = newscale
    }
    postion[0] = x - (x - postion[0]) * scaleby
    postion[1] = y - (y - postion[1]) * scaleby
    updateTransform(postion[0], postion[1])
  }

  React.useEffect(() => {
    const REGL = regl({
      container: reglRef.current,
      extensions: ['angle_instanced_arrays', 'OES_texture_float', 'EXT_blend_minmax'],
      attributes: { antialias: false }
    })

    console.log(REGL.limits)

    const colorBuffer1 = REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N_PADS * 3,
      data: Array(N_PADS)
        .fill(0)
        .map((_, i) => {
          const r = Math.floor(i / N_PADS)
          const g = (i % N_PADS) / N_PADS
          return [r, g, r * g + 0.9]
        })
    })

    const PAD_RECORDS_ARRAY = Array<number[]>(N_PADS)
      .fill(Array<number>(PAD_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Pad_Record({
          // index of feature
          // index: i / N_PADS,
          index: (i) / (N_LINES + N_PADS),
          // Center point.
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % Object.keys(STANDARD_SYMBOLS).length,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          resize_factor: 0,
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
          // Pad orientation (degrees)
          rotation: 0,
          // 0 = no mirror, 1 = mirror
          mirror: 0
        }).toArray()
      })

    // console.log(PAD_RECORDS_ARRAY)

    const PAD_RECORDS_BUFFER = REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N_PADS * PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
      data: PAD_RECORDS_ARRAY
    })

    const LINE_RECORDS_ARRAY = Array<number[]>(N_LINES)
      .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Line_Record({
          // index of feature
          // index: i / N_LINES,
          index: (i + N_PADS) / (N_LINES + N_PADS),

          // Start point.
          xs: (Math.random() - 0.5) * 100,
          ys: (Math.random() - 0.5) * 100,

          // End point.
          xe: (Math.random() - 0.5) * 100,
          ye: (Math.random() - 0.5) * 100,

          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
        }).toArray()
      })


    const LINE_RECORDS_BUFFER = REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N_LINES * LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
      data: LINE_RECORDS_ARRAY
    })

    const LINE_RECORDS_ARRAY2 = Array<number[]>(N_LINES)
      .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Line_Record({
          // index of feature
          index: i / N_LINES,

          // Start point.
          xs: (Math.random() - 0.5) * 100,
          ys: (Math.random() - 0.5) * 100,

          // End point.
          xe: (Math.random() - 0.5) * 100,
          ye: (Math.random() - 0.5) * 100,

          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
        }).toArray()
      })


    const LINE_RECORDS_BUFFER2 = REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N_LINES * LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
      data: LINE_RECORDS_ARRAY2
    })

    const SYMBOLS_ARRAY = new Array<number[]>(STANDARD_SYMBOLS.length)
      .fill(Array<number>(SYMBOL_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Symbol({
          symbol: i, // symbol
          width: 1.0, // width, square side, diameter
          height: 1.0, // height
          corner_radius: 0.2, // corner radius
          corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
          outer_dia: 1.0, // — Outer diameter of the shape
          inner_dia: 0.8, // — Inner diameter of the shape
          line_width: 0.1, // — Line width of the shape (applies to the whole shape)
          line_length: 2.0, // — Line length of the shape (applies to the whole shape)
          angle: 0, // — Angle of the spoke from 0 degrees
          gap: 0.1, // — Gap
          num_spokes: 2, // — Number of spokes
          round: 0, // —r|s == 1|0 — Support for rounded or straight corners
          cut_size: 0, // — Size of the cut ( see corner radius )
          ring_width: 0.1, // — Ring width
          ring_gap: 0.4, // — Ring gap
          num_rings: 2 // — Number of rings
        }).toArray()
      })

    const SYMBOLS_TEXTURE = REGL.texture({
      width: SYMBOL_PARAMETERS.length,
      height: Object.keys(STANDARD_SYMBOLS_MAP).length,
      type: 'float',
      format: 'luminance',
      data: SYMBOLS_ARRAY
    })


    interface REGLDefaultProps {
      records: regl.Buffer
      symbols: regl.Texture2D,
      color: vec3
    }

    interface REGLPadDrawProps extends REGLDefaultProps {
      // records: regl.Buffer
      // symbols: regl.Texture2D,
      // color: [number, number, number, number]
    }

    interface REGLLineDrawProps extends REGLDefaultProps {
      // records: regl.Buffer
      // symbols: regl.Texture2D,
      // color: [number, number, number, number]
    }


    type CustomAttributeConfig = Omit<regl.AttributeConfig, 'buffer'> & {
      buffer:
      | regl.Buffer
      | undefined
      | null
      | false
      | ((context: regl.DefaultContext, props: REGLPadDrawProps | REGLLineDrawProps) => regl.Buffer)
      | regl.DynamicVariable<regl.Buffer>
    }

    interface REGLDefaultUniforms {

    }

    interface REGLPadUniforms extends REGLDefaultUniforms {
      u_SymbolsTexture: regl.Texture2D
      u_SymbolsTextureDimensions: vec2
      u_Transform: mat3
      u_InverseTransform: mat3
      u_Resolution: vec2
      u_Screen: vec2
      u_PixelSize: number
      u_OutlineMode: boolean
      u_Color: vec3
    }

    interface REGLDefaultAttributes {

    }

    interface REGLPadAttributes extends REGLDefaultAttributes {
      a_Vertex_Position: vec2[]
      a_SymNum: CustomAttributeConfig
      a_Location: CustomAttributeConfig
      a_ResizeFactor: CustomAttributeConfig
      a_Index: CustomAttributeConfig
      a_Polarity: CustomAttributeConfig
      a_Rotation: CustomAttributeConfig
      a_Mirror: CustomAttributeConfig
    }

    const drawFeaturesDefault = REGL<REGLDefaultUniforms, REGLDefaultAttributes, REGLDefaultProps>({
      cull: {
        enable: true,
        face: 'front'
      },

      depth: {
        enable: true,
        mask: true,
        func: 'less',
        range: [0, 1]
      },

      blend: {
        enable: false,

        func: {
          srcRGB: 'one minus dst color',
          srcAlpha: 0,
          dstRGB: 0,
          dstAlpha: 0
        },

        equation: {
          rgb: 'subtract',
          alpha: 'subtract'
        },
        color: [0.5, 0.5, 0.5, 0],
      }
    })

    const drawStandardPads = REGL<REGLPadUniforms, REGLPadAttributes, REGLPadDrawProps>({

      frag: PadFrag,

      vert: PadVert,

      uniforms: {
        u_SymbolsTexture: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.symbols,
        u_SymbolsTextureDimensions: (_context: regl.DefaultContext, props: REGLPadDrawProps) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Transform: () => transform,
        u_InverseTransform: () => inverseTransform,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        u_Screen: () => [
          window.screen.width * window.devicePixelRatio,
          window.screen.height * window.devicePixelRatio
        ],
        u_PixelSize: () =>
          3.6 /
          Math.pow(
            window.screen.width *
            window.devicePixelRatio *
            window.screen.height *
            window.devicePixelRatio,
            0.5
          ),
        u_OutlineMode: () => OUTLINE_MODE,
        u_Color: REGL.prop<REGLPadDrawProps, 'color'>('color'),
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }),
          {}
        ),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }),
          {}
        )
      },

      attributes: {

        a_Vertex_Position: () => [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, -1],
          [+1, -1]
        ],

        a_Index: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 0 * FLOAT_SIZE,
          divisor: 1
        },

        a_Location: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 1 * FLOAT_SIZE,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 3 * FLOAT_SIZE,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 4 * FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 5 * FLOAT_SIZE,
          divisor: 1
        },

        a_Rotation: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 6 * FLOAT_SIZE,
          divisor: 1
        },

        a_Mirror: {
          buffer: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.records,
          stride: PAD_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 7 * FLOAT_SIZE,
          divisor: 1
        }
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: N_PADS
    })

    interface REGLLineUniforms extends REGLDefaultUniforms {
      u_SymbolsTexture: regl.Texture2D
      u_SymbolsTextureDimensions: vec2
      u_Transform: mat3
      u_InverseTransform: mat3
      u_Resolution: vec2
      u_Screen: vec2
      u_PixelSize: number
      u_OutlineMode: boolean
      u_Color: vec3
    }

    interface REGLLineAttributes extends REGLDefaultAttributes {
      a_Vertex_Position: vec2[]
      a_SymNum: CustomAttributeConfig
      a_Start_Location: CustomAttributeConfig
      a_End_Location: CustomAttributeConfig
      a_Index: CustomAttributeConfig
      a_Polarity: CustomAttributeConfig
    }

    const drawLines = REGL<REGLLineUniforms, REGLLineAttributes, REGLLineDrawProps>({

      frag: LineFrag,

      vert: LineVert,

      uniforms: {
        u_SymbolsTexture: (_context: regl.DefaultContext, props: REGLPadDrawProps) => props.symbols,
        u_SymbolsTextureDimensions: (_context: regl.DefaultContext, props: REGLPadDrawProps) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Transform: () => transform,
        u_InverseTransform: () => inverseTransform,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        u_Screen: () => [
          window.screen.width * window.devicePixelRatio,
          window.screen.height * window.devicePixelRatio
        ],
        u_PixelSize: () =>
          3.6 /
          Math.pow(
            window.screen.width *
            window.devicePixelRatio *
            window.screen.height *
            window.devicePixelRatio,
            0.5
          ),
        u_OutlineMode: () => OUTLINE_MODE,
        u_Color: REGL.prop<REGLPadDrawProps, 'color'>('color'),
        ...Object.entries(STANDARD_SYMBOLS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }),
          {}
        ),
        ...Object.entries(SYMBOL_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }),
          {}
        )
      },

      attributes: {

        a_Vertex_Position: () => [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, -1],
          [+1, -1]
        ],

        a_Index: {
          buffer: (_context: regl.DefaultContext, props: REGLLineDrawProps) => props.records,
          stride: LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 0 * FLOAT_SIZE,
          divisor: 1
        },

        a_Start_Location: {
          buffer: (_context: regl.DefaultContext, props: REGLLineDrawProps) => props.records,
          stride: LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 1 * FLOAT_SIZE,
          divisor: 1
        },

        a_End_Location: {
          buffer: (_context: regl.DefaultContext, props: REGLLineDrawProps) => props.records,
          stride: LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 3 * FLOAT_SIZE,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: regl.DefaultContext, props: REGLLineDrawProps) => props.records,
          stride: LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 5 * FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: regl.DefaultContext, props: REGLLineDrawProps) => props.records,
          stride: LINE_RECORD_PARAMETERS.length * FLOAT_SIZE,
          offset: 6 * FLOAT_SIZE,
          divisor: 1
        },
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: N_LINES
    })

    // const tick = REGL.frame(function () {
    //   REGL.clear({
    //     color: [0, 0, 0, 1]
    //   })

    function redraw(force = false): void {
      if (!dirty && !force) return
      dirty = false
      drawFeaturesDefault(() => {
        REGL.clear({
          // color: [0, 0, 0, 1],
          depth: 1
        })
        drawStandardPads({
          symbols: SYMBOLS_TEXTURE,
          records: PAD_RECORDS_BUFFER,
          color: COLOR1
        })
        drawLines({
          symbols: SYMBOLS_TEXTURE,
          records: LINE_RECORDS_BUFFER,
          color: COLOR1
        })
        REGL.clear({
          depth: 1,
        })
        drawLines({
          symbols: SYMBOLS_TEXTURE,
          records: LINE_RECORDS_BUFFER2,
          color: COLOR2
        })
      })
      // REGL.clear({
      //   depth: 1,
      // })
      setTimeout(() => (dirty = true), FPSMS)
    }
    drawFeaturesDefault(() => {
      REGL.clear({
        // color: [0, 0, 0, 1],
        depth: 1
      })
      scaleAtPoint(0, 0, scale)
      drawStandardPads({
        symbols: SYMBOLS_TEXTURE,
        records: PAD_RECORDS_BUFFER,
        color: COLOR1
      })
      drawLines({
        symbols: SYMBOLS_TEXTURE,
        records: LINE_RECORDS_BUFFER,
        color: COLOR1
      })
      REGL.clear({
        depth: 1,
      })
      drawLines({
        symbols: SYMBOLS_TEXTURE,
        records: LINE_RECORDS_BUFFER2,
        color: COLOR2
      })
    })

    function toss(): void {
      if (velocity[0] === 0 && velocity[1] === 0) return
      if (dragging) return
      vec2.add(postion, postion, velocity)
      vec2.scale(velocity, velocity, 0.95)
      updateTransform(postion[0], postion[1])
      redraw(true)
      if (Math.abs(velocity[0]) < 0.05 && Math.abs(velocity[1]) < 0.05) {
        velocity[0] = 0
        velocity[1] = 0
      } else {
        setTimeout(toss, FPSMS)
      }
    }

    reglRef.current.onwheel = (e): void => {
      scaleAtPoint(e.clientX, e.clientY, e.deltaY)
      redraw()
    }

    reglRef.current.onmousedown = (_e): void => {
      dragging = true
    }

    reglRef.current.onmouseup = (_e): void => {
      dragging = false
      toss()
    }

    reglRef.current.onmousemove = (e): void => {
      if (!dragging) return
      velocity = [e.movementX, e.movementY]
      vec2.add(postion, postion, velocity)
      updateTransform(postion[0], postion[1])
      redraw()
    }

    const resize = (): void => {
      REGL.poll()
      updateTransform(postion[0], postion[1])
      redraw(true)
    }

    new ResizeObserver(resize).observe(reglRef.current)

    // When we are done, we can unsubscribe by calling cancel on the callback
    return () => {
      // tick.cancel()
      REGL.destroy()
      reglRef.current.onwheel = null
      reglRef.current.onmousedown = null
      reglRef.current.onmouseup = null
      reglRef.current.onmousemove = null
      reglRef.current.onresize = null
    }
  }, [])

  return (
    <div
      ref={reglRef}
      id="regl-element"
      style={{
        width: '100%',
        height: '100%'
      }}
    ></div>
  )
}

export default REGLApp
