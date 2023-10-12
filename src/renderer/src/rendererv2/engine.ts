import PadFrag from '../shaders/Pad.frag'
import PadVert from '../shaders/Pad.vert'
import LineFrag from '../shaders/Line.frag'
import LineVert from '../shaders/Line.vert'
import ArcFrag from '../shaders/Arc.frag'
import ArcVert from '../shaders/Arc.vert'
import REGL from 'regl'
import { mat3, vec2, vec3 } from 'gl-matrix'
import * as Records from './records'
import * as Symbols from './symbols'
import Layer from './layer'
import { glFloatSize } from './constants'
// import createStatsWidget from 'regl-stats-widget'

const { LINE_RECORD_PARAMETERS, PAD_RECORD_PARAMETERS, ARC_RECORD_PARAMETERS } = Records
const { SYMBOL_PARAMETERS, STANDARD_SYMBOLS_MAP, SYMBOL_PARAMETERS_MAP } = Symbols

interface FeaturesProps {}

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer:
    | REGL.Buffer
    | undefined
    | null
    | false
    | ((context: REGL.DefaultContext, props: Layer) => REGL.Buffer)
    | REGL.DynamicVariable<REGL.Buffer>
}

interface FeaturesUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_Screen: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
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

interface FeaturesAttributes {
  a_Vertex_Position: vec2[]
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

export interface RenderEngineConfig {
  container: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

// export interface Stats {
//   renderDuration: number,
//   fps: number,
//   lastRenderTime: number
// }

export class RenderEngine {
  private _FPS = 60
  private _FPSMS = 1000 / 60
  public set FPS(value: number) {
    this._FPS = value
    this._FPSMS = 1000 / value
  }
  public get FPS(): number {
    return this._FPS
  }
  public OUTLINE_MODE = false
  public readonly CONTAINER: HTMLElement
  public MAX_ZOOM = 100
  public MIN_ZOOM = 0.01

  private zoom = 1
  private position: vec2 = [-500, 400]
  private velocity: vec2 = [0, 0]
  private dragging = false
  private transform = mat3.create()
  private inverseTransform = mat3.create()

  private dirty = true

  // public stats: Stats = {
  //   renderDuration: 0,
  //   fps: 0,
  //   lastRenderTime: 0
  // }

  // public layers: Layer[] = []
  // make layers a proxy so that we can call render when a property is updated
  public layers: Layer[] = new Proxy([], {
    set: (target, name, value): boolean => {
      target[name] = value
      this.render(true)
      return true
    }
  })

  regl: REGL.Regl
  drawFeatures: REGL.DrawCommand<REGL.DefaultContext, FeaturesProps>
  drawPads: REGL.DrawCommand<REGL.DefaultContext, Layer>
  drawLines: REGL.DrawCommand<REGL.DefaultContext, Layer>
  drawArcs: REGL.DrawCommand<REGL.DefaultContext, Layer>

  constructor({ container, attributes }: RenderEngineConfig) {
    this.CONTAINER = container

    this.regl = REGL({
      container,
      extensions: ['angle_instanced_arrays', 'OES_texture_float', 'EXT_blend_minmax', 'EXT_disjoint_timer_query'],
      attributes
    })

    this.regl.clear({
      depth: 1
    })

    this.drawFeatures = this.regl<FeaturesUniforms, FeaturesAttributes, FeaturesProps>({
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
        u_InverseTransform: () => this.inverseTransform,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        // u_Resolution: () => [this.CONTAINER.clientWidth, this.CONTAINER.clientHeight],
        u_Screen: () => [
          window.screen.width * window.devicePixelRatio,
          window.screen.height * window.devicePixelRatio
        ],
        u_PixelSize: () =>
          3.7 /
          Math.pow(
            window.screen.width *
              window.devicePixelRatio *
              window.screen.height *
              window.devicePixelRatio,
            0.5
          ),
        u_OutlineMode: () => this.OUTLINE_MODE,
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
        ]
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0
    })

    this.drawLines = this.regl<LineUniforms, LineAttributes, Layer>({
      frag: LineFrag,

      vert: LineVert,

      uniforms: {
        u_SymbolsTexture: (_context: REGL.DefaultContext, props: Layer) => props.symbols,
        u_SymbolsTextureDimensions: (_context: REGL.DefaultContext, props: Layer) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Color: this.regl.prop<Layer, 'color'>('color')
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: 0 * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: 1 * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: 3 * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: 5 * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.lines,
          stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: 6 * glFloatSize,
          divisor: 1
        }
      },

      instances: (_context: REGL.DefaultContext, props: Layer) => props.qtyLines
    })

    this.drawPads = this.regl<PadUniforms, PadAttributes, Layer>({
      frag: PadFrag,

      vert: PadVert,

      uniforms: {
        u_SymbolsTexture: (_context: REGL.DefaultContext, props: Layer) => props.symbols,
        u_SymbolsTextureDimensions: (_context: REGL.DefaultContext, props: Layer) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Color: this.regl.prop<Layer, 'color'>('color')
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 0 * glFloatSize,
          divisor: 1
        },

        a_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 1 * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 3 * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 4 * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 5 * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 6 * glFloatSize,
          divisor: 1
        },

        a_Mirror: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.pads,
          stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
          offset: 7 * glFloatSize,
          divisor: 1
        }
      },

      instances: (_context: REGL.DefaultContext, props: Layer) => props.qtyPads
    })

    this.drawArcs = this.regl<ArcUniforms, ArcAttributes, Layer>({
      frag: ArcFrag,

      vert: ArcVert,

      uniforms: {
        u_SymbolsTexture: (_context: REGL.DefaultContext, props: Layer) => props.symbols,
        u_SymbolsTextureDimensions: (_context: REGL.DefaultContext, props: Layer) => [
          props.symbols.width,
          props.symbols.height
        ],
        u_Color: this.regl.prop<Layer, 'color'>('color')
      },

      attributes: {
        a_Index: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 0 * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 1 * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 3 * glFloatSize,
          divisor: 1
        },

        a_Center_Location: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 5 * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 7 * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 8 * glFloatSize,
          divisor: 1
        },

        a_Clockwise: {
          buffer: (_context: REGL.DefaultContext, props: Layer) => props.arcs,
          stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: 9 * glFloatSize,
          divisor: 1
        }
      },

      instances: (_context: REGL.DefaultContext, props: Layer) => props.qtyArcs
    })

    // this.stats = createStatsWidget([
    //   // [this.drawFeatures, 'drawFeatures'],
    //   [this.drawPads, 'drawPads'],
    //   [this.drawLines, 'drawLines'],
    //   [this.drawArcs, 'drawArcs']
    // ])

    mat3.identity(this.transform)
    mat3.identity(this.inverseTransform)
    this.zoomAtPoint(0, 0, this.zoom)
    this.addControls()
    this.render()
    // this.regl.frame(() => this.render())
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    // new ResizeObserver(this.resize.bind(this)).observe(this.CONTAINER)

    // this.renderTick()

    // PROPERTY UPDATES TO CALL RENDER
    return new Proxy(this, {
      set(target, name, value): boolean {
        const setables = ['OUTLINE_MODE']
        if (setables.includes(String(name))) {
          target[name] = value
          target.render(true)
        }
        return true
      }
    })
  }

  private resize(): void {
    this.regl.poll()
    this.updateTransform()
  }

  private toss(): void {
    const { dragging, _FPSMS } = this
    if (this.velocity[0] === 0 && this.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.position, this.position, this.velocity)
    vec2.scale(this.velocity, this.velocity, 0.95)
    this.updateTransform()
    if (Math.abs(this.velocity[0]) < 0.05 && Math.abs(this.velocity[1]) < 0.05) {
      this.velocity[0] = 0
      this.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), _FPSMS)
      // setTimeout(this.toss.bind(this), _FPSMS)
    }
  }

  private addControls(): void {
    this.CONTAINER.onwheel = (e): void => {
      const { x: offsetX, y: offsetY } = this.CONTAINER.getBoundingClientRect()
      this.zoomAtPoint(e.clientX - offsetX, e.clientY - offsetY, e.deltaY)
    }
    this.CONTAINER.onmousedown = (_e): void => {
      this.dragging = true
    }
    this.CONTAINER.onmouseup = (_e): void => {
      this.dragging = false
      this.toss()
    }
    this.CONTAINER.onmousemove = (e): void => {
      if (!this.dragging) return
      this.velocity = [e.movementX, e.movementY]
      vec2.add(this.position, this.position, this.velocity)
      this.updateTransform()
    }
  }

  public addLayer({
    pads,
    lines,
    arcs,
    symbols
  }: {
    pads?: REGL.BufferData
    lines?: REGL.BufferData
    arcs?: REGL.BufferData
    symbols?: REGL.BufferData
  }): void {
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
    this.layers.push(
      new Layer({
        pads: padBuffer,
        qtyPads: (pads ?? []).length,
        lines: lineBuffer,
        qtyLines: (lines ?? []).length,
        arcs: arcBuffer,
        qtyArcs: (arcs ?? []).length,
        symbols: symbolTexture
      })
    )
  }

  public updateTransform(): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this
    // const { width, height } = this.CONTAINER.getBoundingClientRect()
    const width = this.CONTAINER.clientWidth
    const height = this.CONTAINER.clientHeight
    mat3.projection(this.transform, width, height)
    mat3.translate(this.transform, this.transform, position)
    mat3.scale(this.transform, this.transform, [zoom, zoom])
    mat3.translate(this.transform, this.transform, [width / 2, height / 2])
    mat3.scale(this.transform, this.transform, [width / 2, -height / 2])
    mat3.invert(this.inverseTransform, this.transform)

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

    // console.log(
    //   'this.inverseTransform \n' +
    //     `${Math.round(this.inverseTransform[0] * 100) / 100}, ${
    //       Math.round(this.inverseTransform[1] * 100) / 100
    //     }, ${Math.round(this.inverseTransform[2] * 100) / 100},\n` +
    //     `${Math.round(this.inverseTransform[3] * 100) / 100}, ${
    //       Math.round(this.inverseTransform[4] * 100) / 100
    //     }, ${Math.round(this.inverseTransform[5] * 100) / 100},\n` +
    //     `${Math.round(this.inverseTransform[6] * 100) / 100}, ${
    //       Math.round(this.inverseTransform[7] * 100) / 100
    //     }, ${Math.round(this.inverseTransform[8] * 100) / 100}`
    // )

    // console.log(s)
    this.render()
  }

  public zoomAtPoint(x: number, y: number, s: number): void {
    const { zoom } = this
    let newZoom = zoom - s / (1000 / zoom / 2)
    let zoomBy = newZoom / zoom
    if (newZoom < this.MIN_ZOOM) {
      newZoom = this.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.zoom = newZoom
    } else if (newZoom > this.MAX_ZOOM) {
      newZoom = this.MAX_ZOOM
      zoomBy = newZoom / zoom
      this.zoom = newZoom
    } else {
      this.zoom = newZoom
    }
    this.position[0] = x - (x - this.position[0]) * zoomBy
    this.position[1] = y - (y - this.position[1]) * zoomBy
    this.updateTransform()
  }

  public render(force = false): void {
    // return
    if (!this.dirty && !force) return
    this.dirty = false
    setTimeout(() => (this.dirty = true), this._FPSMS)
    this.drawFeatures(() => {
      this.regl.clear({
        depth: 1
      })
      for (const layer of this.layers) {
        if (!layer.visible) continue
        this.regl.clear({
          depth: 1
        })
        if (layer.qtyPads > 0) this.drawPads(layer)
        if (layer.qtyLines > 0) this.drawLines(layer)
        if (layer.qtyArcs > 0) this.drawArcs(layer)
      }
    })
  }

  public destroy(): void {
    this.regl.destroy()
    // this.CONTAINER.innerHTML = ''
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
  }
}
