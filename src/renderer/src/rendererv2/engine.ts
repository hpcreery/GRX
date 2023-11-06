import REGL from 'regl'
import { mat3, vec2 } from 'gl-matrix'
import * as Symbols from './symbols'
import * as Records from './records'
import Layer from './layer'
import { IPlotRecord } from './types'

const { STANDARD_SYMBOLS_MAP, SYMBOL_PARAMETERS_MAP } = Symbols

interface FeaturesProps {}

interface FeaturesUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_Screen: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
}

interface FeaturesAttributes {
  a_Vertex_Position: vec2[]
}

interface ScreenRenderProps {
  frameBuffer: REGL.Framebuffer
}

interface ScreenRenderUniforms {
  render_tex: REGL.Framebuffer
}

interface FrameBufferRenderProps {
  frameBuffer: REGL.Framebuffer
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

interface PointerCoordinates {
  x: number
  y: number
}

const PointerEvents = {
  POINTER_DOWN: 'pointerdown',
  POINTER_UP: 'pointerup',
  POINTER_MOVE: 'pointermove'
} as const

export type PointerEvent = CustomEvent<PointerCoordinates>

interface RenderSettings {
  FPS: number
  MSPFRAME: number
  OUTLINE_MODE: boolean
  BACKGROUND_COLOR: [number, number, number, number]
  MAX_ZOOM: number
  MIN_ZOOM: number
  ZOOM_TO_CURSOR: boolean
}

export class RenderEngine {
  public SETTINGS: RenderSettings = new Proxy(
    {
      MSPFRAME: 1000 / 60,
      get FPS(): number {
        return 1000 / this.MSPFRAME
      },
      set FPS(value: number) {
        this.MSPFRAME = 1000 / value
      },
      OUTLINE_MODE: false,
      BACKGROUND_COLOR: [0, 0, 0, 0],
      MAX_ZOOM: 100,
      MIN_ZOOM: 0.01,
      ZOOM_TO_CURSOR: true
    },
    {
      set: (target, name, value): boolean => {
        target[name] = value
        this.render(true)
        return true
      }
    }
  )

  public readonly CONTAINER: HTMLElement

  public pointer: EventTarget = new EventTarget()

  private zoom = 1
  private position: vec2 = [0, 0]
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

  renderToFrameBuffer: REGL.DrawCommand<REGL.DefaultContext, FrameBufferRenderProps>
  renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps>

  private layer_fbo: REGL.Framebuffer2D

  constructor({ container, attributes }: RenderEngineConfig) {
    this.CONTAINER = container

    this.regl = REGL({
      container,
      extensions: ['angle_instanced_arrays', 'OES_texture_float'],
      attributes,
      profile: true
    })
    console.log('WEBGL LIMITS', this.regl.limits)

    this.regl.clear({
      depth: 1
    })

    this.layer_fbo = this.regl.framebuffer()
    this.regl.clear({
      depth: 1,
      framebuffer: this.layer_fbo
    })

    this.drawFeatures = this.regl<FeaturesUniforms, FeaturesAttributes, FeaturesProps>({
      cull: {
        enable: true,
        face: 'front'
      },

      depth: {
        enable: true,
        mask: false,
        func: 'less',
        range: [0, 1]
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
        u_OutlineMode: () => this.SETTINGS.OUTLINE_MODE,
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

    this.renderToFrameBuffer = this.regl<
      Record<string, never>,
      Record<string, never>,
      FrameBufferRenderProps
    >({
      // Essentially Defaults
      // depth: {
      //   enable: true,
      //   mask: false,
      //   func: 'less',
      //   range: [0, 1]
      // },
      framebuffer: (_context: REGL.DefaultContext, props: FrameBufferRenderProps) =>
        props.frameBuffer
    })

    this.renderToScreen = this.regl<ScreenRenderUniforms, Record<string, never>, ScreenRenderProps>(
      {
        vert: `
        precision mediump float;
        attribute vec2 a_Vertex_Position;
        varying vec2 v_UV;
        void main () {
          v_UV = a_Vertex_Position;
          gl_Position = vec4(a_Vertex_Position, 0, 1);
        }
      `,
        frag: `
        precision mediump float;
        uniform sampler2D render_tex;
        varying vec2 v_UV;
        void main () {
          gl_FragColor = texture2D(render_tex, (v_UV * 0.5) + 0.5);
        }
      `,

        blend: {
          enable: true,

          func: {
            srcRGB: 'one minus dst color',
            srcAlpha: 'one',
            dstRGB: 'one minus src color',
            dstAlpha: 'one'
          },

          equation: {
            rgb: 'add',
            alpha: 'add'
          },
          color: [0, 0, 0, 0.1]
        },

        depth: {
          enable: false,
          mask: false
        },

        uniforms: {
          render_tex: (_context: REGL.DefaultContext, props: ScreenRenderProps) => props.frameBuffer
        }
      }
    )

    mat3.identity(this.transform)
    mat3.identity(this.inverseTransform)
    this.zoomAtPoint(0, 0, this.zoom)
    this.addControls()
    this.render()
    // this.regl.frame(() => this.render())
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    // new ResizeObserver(this.resize.bind(this)).observe(this.CONTAINER)

    // this.renderTick()
  }

  private resize(): void {
    this.regl.poll()
    this.updateTransform()
  }

  private toss(): void {
    const { dragging } = this
    if (this.velocity[0] === 0 && this.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.position, this.position, this.velocity)
    vec2.scale(this.velocity, this.velocity, 0.95)
    this.updateTransform()
    if (Math.abs(this.velocity[0]) < 0.05 && Math.abs(this.velocity[1]) < 0.05) {
      this.velocity[0] = 0
      this.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), this.SETTINGS.MSPFRAME)
      // setTimeout(this.toss.bind(this), this.SETTINGS.MSPFRAME)
    }
  }

  public getWorldPositionFromMouse(e: MouseEvent): vec2 {
    const { x: offsetX, y: offsetY, width, height } = this.CONTAINER.getBoundingClientRect()
    const mouse_element_pos = [e.clientX - offsetX, e.clientY - offsetY]
    const mouse_normalize_pos = [
      mouse_element_pos[0] / width,
      (height - mouse_element_pos[1]) / height
    ]
    return this.getWorldPosition(mouse_normalize_pos[0], mouse_normalize_pos[1])
  }

  public getWorldPosition(x: number, y: number): vec2 {
    const { width, height } = this.CONTAINER.getBoundingClientRect()
    const aspect = height / width
    const mouse_viewbox_pos: vec2 = [x * 2 - 1, y * 2 - 1]
    const mouse = vec2.transformMat3(vec2.create(), mouse_viewbox_pos, this.inverseTransform)
    const mouse_aspect = vec2.multiply(vec2.create(), mouse, [1 / aspect, 1])

    return mouse_aspect
  }

  private addControls(): void {
    const sendPointerEvent = (
      mouse: MouseEvent,
      event_type: (typeof PointerEvents)[keyof typeof PointerEvents]
    ): void => {
      const [x, y] = this.getWorldPositionFromMouse(mouse)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>(event_type, {
          detail: { x, y }
        })
      )
    }
    this.CONTAINER.onwheel = (e): void => {
      const { x: offsetX, y: offsetY, width, height } = this.CONTAINER.getBoundingClientRect()
      if (this.SETTINGS.ZOOM_TO_CURSOR) {
        this.zoomAtPoint(e.x - offsetX, e.y - offsetY, e.deltaY)
      } else {
        this.zoomAtPoint(width / 2, height / 2, e.deltaY)
      }
    }
    this.CONTAINER.onmousedown = (e): void => {
      this.dragging = true
      const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
      const xpos = e.clientX - offsetX
      const ypos = height - (e.clientY - offsetY)
      for (const layer of this.layers) {
        const data = this.regl.read({
          framebuffer: layer.framebuffer,
          x: xpos * window.devicePixelRatio,
          y: ypos * window.devicePixelRatio,
          width: 1,
          height: 1
        })
        if (data.reduce((acc, val) => acc + val, 0) == 0) continue
        console.log(layer.name)
      }

      sendPointerEvent(e, PointerEvents.POINTER_DOWN)
    }
    this.CONTAINER.onmouseup = (e): void => {
      this.dragging = false
      this.toss()

      sendPointerEvent(e, PointerEvents.POINTER_UP)
    }
    this.CONTAINER.onmousemove = (e): void => {
      if (!this.dragging) return
      this.velocity = [e.movementX, e.movementY]
      vec2.add(this.position, this.position, this.velocity)
      this.updateTransform()

      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
    }
  }

  public addLayer({
    name,
    data
  }: {
    name: string
    data: (Records.Input_Record | Symbols.Symbol)[]
  }): void {
    const layer = new Layer({
      name,
      regl: this.regl
    }).init(data)
    this.layers.push(layer)
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
    if (newZoom < this.SETTINGS.MIN_ZOOM) {
      newZoom = this.SETTINGS.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.zoom = newZoom
    } else if (newZoom > this.SETTINGS.MAX_ZOOM) {
      newZoom = this.SETTINGS.MAX_ZOOM
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
    if (!this.dirty && !force) return
    this.dirty = false
    this.regl.clear({
      color: this.SETTINGS.BACKGROUND_COLOR,
      depth: 1
    })
    setTimeout(() => (this.dirty = true), this.SETTINGS.MSPFRAME)
    this.drawFeatures((context) => {
      for (const layer of this.layers) {
        if (!layer.visible) continue
        layer.render(context)
        this.renderToScreen({ frameBuffer: layer.framebuffer })
      }
    })
  }

  public stats(): void {
    // console.log(this.regl.stats)
    // console.log('Texture Count: ' + this.regl.stats.textureCount)
    // console.log(
    //   'Texture Memory: ' + Math.round(this.regl.stats.getTotalTextureSize() / 1024 / 1024) + ' MB'
    // )
    // console.log('Render Buffer Count: ' + this.regl.stats.renderbufferCount)
    // console.log(
    //   'Render Buffer Memory: ' +
    //     Math.round(this.regl.stats.getTotalRenderbufferSize() / 1024 / 1024) +
    //     ' MB'
    // )
    // console.log('Buffer Count: ' + this.regl.stats.bufferCount)
    // console.log(
    //   'Buffer Memory: ' + Math.round(this.regl.stats.getTotalBufferSize() / 1024 / 1024) + ' MB'
    // )
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
