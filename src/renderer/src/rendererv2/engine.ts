import PadFrag from '../shaders/Pad.frag'
import PadVert from '../shaders/Pad.vert'
import LineFrag from '../shaders/Line.frag'
import LineVert from '../shaders/Line.vert'
import regl, { Regl } from 'regl'
import { mat2d, mat3, vec2, vec3 } from 'gl-matrix'
import * as Records from './records'
const { LINE_RECORD_PARAMETERS } = Records
import * as Symbols from './symbols'

interface REGLDefaultAttributes {}

interface REGLDefaultUniforms {}

interface REGLDefaultProps {}

type CustomAttributeConfig = Omit<regl.AttributeConfig, 'buffer'> & {
  buffer:
    | regl.Buffer
    | undefined
    | null
    | false
    | ((context: regl.DefaultContext, props: Layer) => regl.Buffer)
    | regl.DynamicVariable<regl.Buffer>
}

interface REGLDefaultUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_Screen: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
}

interface REGLPadUniforms {
  u_SymbolsTexture: regl.Texture2D
  u_SymbolsTextureDimensions: vec2
  u_Color: vec3
}

interface REGLDefaultAttributes {}

interface REGLPadAttributes {
  a_Vertex_Position: vec2[]
  a_SymNum: CustomAttributeConfig
  a_Location: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror: CustomAttributeConfig
}

interface REGLLineUniforms {
  u_SymbolsTexture: regl.Texture2D
  u_SymbolsTextureDimensions: vec2
  u_Color: vec3
}

interface REGLLineAttributes {
  a_Vertex_Position: vec2[]
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
}

export interface RenderEngineConfig {
  container: HTMLElement
  antialias?: boolean
}

export class Layer {
  public visible = true
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public pads: regl.Buffer
  public qtyPads: number
  public lines: regl.Buffer
  public qtyLines: number
  public arcs: regl.Buffer
  public qtyArcs: number
  public symbols: regl.Texture2D
  constructor(
    props: Pick<Layer, 'pads' | 'lines' | 'arcs' | 'symbols' | 'qtyPads' | 'qtyLines' | 'qtyArcs'>
  ) {
    this.pads = props.pads
    this.qtyPads = props.qtyPads
    this.lines = props.lines
    this.qtyLines = props.qtyLines
    this.arcs = props.arcs
    this.qtyArcs = props.qtyArcs
    this.symbols = props.symbols
  }
}

export class RenderEngine {
  public OUTLINE_MODE = false
  public FPS = 60
  public FPSMS = 1000 / this.FPS
  public FLOAT_SIZE = 4
  public ELEMENT: HTMLElement

  public transform = mat3.create()
  public inverseTransform = mat3.create()

  private dirty = true
  private scale = 1
  private postion: vec2 = [0, 0]
  private velocity: vec2 = [0, 0]
  private dragging = false

  public layers: Layer[] = []

  REGL: regl.Regl
  drawFeaturesDefault: regl.DrawCommand<regl.DefaultContext, REGLDefaultProps>
  drawPads: regl.DrawCommand<regl.DefaultContext, Layer>
  drawLines: regl.DrawCommand<regl.DefaultContext, Layer>

  constructor({ container, antialias }: RenderEngineConfig) {
    this.ELEMENT = container

    this.REGL = regl({
      container,
      extensions: ['angle_instanced_arrays', 'OES_texture_float', 'EXT_blend_minmax'],
      attributes: { antialias }
    })

    this.REGL.clear({
      depth: 1
      // color: [1, 0, 0, 1]
    })

    this.drawFeaturesDefault = this.REGL<
      REGLDefaultUniforms,
      REGLDefaultAttributes,
      REGLDefaultProps
    >({
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
        color: [0.5, 0.5, 0.5, 0]
      },
      uniforms: {
        u_Transform: () => this.transform,
        // u_Transform: this.REGL.this<this, 'transform'>('transform'),
        u_InverseTransform: () => this.inverseTransform,
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
        u_OutlineMode: () => this.OUTLINE_MODE,
        ...Object.entries(Symbols.STANDARD_SYMBOLS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }),
          {}
        ),
        ...Object.entries(Symbols.SYMBOL_PARAMETERS_MAP).reduce(
          (acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }),
          {}
        )
      }
    })

    this.drawLines = this.REGL<REGLLineUniforms, REGLLineAttributes, Layer>({
      frag: LineFrag,

      vert: LineVert,

      uniforms: {
        u_SymbolsTexture: (_context: regl.DefaultContext, props: Layer) => props.symbols,
        u_SymbolsTextureDimensions: (_context: regl.DefaultContext, props: Layer) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Color: this.REGL.prop<Layer, 'color'>('color')
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
          buffer: (_context: regl.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 0 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Start_Location: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 1 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_End_Location: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 3 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 5 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 6 * this.FLOAT_SIZE,
          divisor: 1
        }
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: (_context: regl.DefaultContext, props: Layer) => props.qtyLines
    })

    this.drawPads = this.REGL<REGLPadUniforms, REGLPadAttributes, Layer>({
      frag: PadFrag,

      vert: PadVert,

      uniforms: {
        u_SymbolsTexture: (_context: regl.DefaultContext, props: Layer) => props.symbols,
        u_SymbolsTextureDimensions: (_context: regl.DefaultContext, props: Layer) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Color: this.REGL.prop<Layer, 'color'>('color')
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
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 0 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Location: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 1 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 3 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 4 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 5 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Rotation: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 6 * this.FLOAT_SIZE,
          divisor: 1
        },

        a_Mirror: {
          buffer: (_context: regl.DefaultContext, props: Layer) => props.pads,
          stride: Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
          offset: 7 * this.FLOAT_SIZE,
          divisor: 1
        }
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: (_context: regl.DefaultContext, props: Layer) => props.qtyPads
    })

    mat3.identity(this.transform)
    mat3.identity(this.inverseTransform)
    this.scaleAtPoint(0, 0, this.scale)
    this.addMouseListeners()
    this.render()
    new ResizeObserver(() => this.resize()).observe(this.ELEMENT)
  }

  private resize(): void {
    this.REGL.poll()
    this.updateTransform(this.postion[0], this.postion[1])
    this.render(true)
  }

  private toss(): void {
    const { velocity, postion, dragging, FPSMS } = this
    if (velocity[0] === 0 && velocity[1] === 0) return
    if (dragging) return
    vec2.add(postion, postion, velocity)
    vec2.scale(velocity, velocity, 0.95)
    this.updateTransform(postion[0], postion[1])
    this.render(true)
    if (Math.abs(velocity[0]) < 0.05 && Math.abs(velocity[1]) < 0.05) {
      velocity[0] = 0
      velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), FPSMS)
    }
  }

  public addMouseListeners(): void {
    this.ELEMENT.onwheel = (e): void => {
      this.scaleAtPoint(e.clientX, e.clientY, e.deltaY)
      this.render()
    }
    this.ELEMENT.onmousedown = (_e): void => {
      this.dragging = true
    }

    this.ELEMENT.onmouseup = (_e): void => {
      this.dragging = false
      this.toss()
    }

    this.ELEMENT.onmousemove = (e): void => {
      if (!this.dragging) return
      this.velocity = [e.movementX, e.movementY]
      vec2.add(this.postion, this.postion, this.velocity)
      this.updateTransform(this.postion[0], this.postion[1])
      this.render()
    }
  }

  public addLayer({
    pads,
    lines,
    arcs,
    symbols
  }: {
    pads: number[][]
    lines: number[][]
    arcs: number[][]
    symbols: number[][]
  }): void {
    // this.layers.push(new Layer({ pads, lines, arcs, symbols }))
    const symbolTexture = this.REGL.texture({
      width: Symbols.SYMBOL_PARAMETERS.length,
      height: Object.keys(Symbols.STANDARD_SYMBOLS_MAP).length,
      type: 'float',
      format: 'luminance',
      data: symbols
    })
    const padBuffer = this.REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: pads.length * Records.PAD_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
      data: pads
    })
    const lineBuffer = this.REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: lines.length * Records.LINE_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
      data: lines
    })
    const arcBuffer = this.REGL.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: arcs.length * Records.ARC_RECORD_PARAMETERS.length * this.FLOAT_SIZE,
      data: arcs
    })
    this.layers.push(
      new Layer({
        pads: padBuffer,
        qtyPads: pads.length,
        lines: lineBuffer,
        qtyLines: lines.length,
        arcs: arcBuffer,
        qtyArcs: arcs.length,
        symbols: symbolTexture
      })
    )
  }

  public render(force = false): void {
    if (!this.dirty && !force) return
    this.dirty = false
    setTimeout(() => (this.dirty = true), this.FPSMS)
    this.drawFeaturesDefault(() => {
      this.REGL.clear({
        depth: 1
      })
      for (const layer of this.layers) {
        if (!layer.visible) continue
        if (layer.qtyPads > 0) this.drawPads(layer)
        if (layer.qtyLines > 0) this.drawLines(layer)
      }

      // drawStandardPads({
      //   symbols: SYMBOLS_TEXTURE,
      //   records: PAD_RECORDS_BUFFER,
      //   color: COLOR1
      // })
      // drawLines({
      //   symbols: SYMBOLS_TEXTURE,
      //   records: LINE_RECORDS_BUFFER,
      //   color: COLOR1
      // })
      // this.REGL.clear({
      //   depth: 1
      // })
      // drawLines({
      //   symbols: SYMBOLS_TEXTURE,
      //   records: LINE_RECORDS_BUFFER2,
      //   color: COLOR2
      // })
    })
  }

  public updateTransform(x: number, y: number): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { scale } = this
    const { width, height } = this.ELEMENT.getBoundingClientRect()
    const s = scale
    mat3.projection(this.transform, width, height)
    mat3.translate(this.transform, this.transform, [x, y])
    mat3.scale(this.transform, this.transform, [s, s])
    mat3.translate(this.transform, this.transform, [width / 2, height / 2])
    mat3.scale(this.transform, this.transform, [width / 2, -height / 2])
    // console.log(
    //   'transform \n' +
    //     `${Math.round(this.transform[0] * 100) / 100}, ${
    //       Math.round(this.transform[1] * 100) / 100
    //     }, ${Math.round(this.transform[2] * 100) / 100},\n` +
    //     `${Math.round(this.transform[3] * 100) / 100}, ${
    //       Math.round(this.transform[4] * 100) / 100
    //     }, ${Math.round(this.transform[5] * 100) / 100},\n` +
    //     `${Math.round(this.transform[6] * 100) / 100}, ${
    //       Math.round(this.transform[7] * 100) / 100
    //     }, ${Math.round(this.transform[8] * 100) / 100}`
    // )

    mat3.invert(this.inverseTransform, this.transform)
    // console.log(
    //   'inverseTransform \n' +
    //   `${Math.round(inverseTransform[0] * 100) / 100}, ${Math.round(inverseTransform[1] * 100) / 100}, ${Math.round(inverseTransform[2] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[3] * 100) / 100}, ${Math.round(inverseTransform[4] * 100) / 100}, ${Math.round(inverseTransform[5] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[6] * 100) / 100}, ${Math.round(inverseTransform[7] * 100) / 100}, ${Math.round(inverseTransform[8] * 100) / 100
    //   }`
    // )

    // console.log(s)
  }

  public scaleAtPoint(x: number, y: number, s: number): void {
    const { postion, scale } = this
    let newscale = scale - s / (1000 / scale / 2)
    let scaleby = newscale / scale
    if (newscale < 0.01) {
      newscale = 0.01
      scaleby = newscale / scale
      this.scale = newscale
    } else if (newscale > 10) {
      newscale = 10
      scaleby = newscale / scale
      this.scale = newscale
    } else {
      this.scale = newscale
    }
    postion[0] = x - (x - postion[0]) * scaleby
    postion[1] = y - (y - postion[1]) * scaleby
    this.updateTransform(postion[0], postion[1])
  }

  public destroy(): void {
    this.REGL.destroy()
    // this.ELEMENT.innerHTML = ''
    this.ELEMENT.onwheel = null
    this.ELEMENT.onmousedown = null
    this.ELEMENT.onmouseup = null
    this.ELEMENT.onmousemove = null
    this.ELEMENT.onresize = null
  }
}
