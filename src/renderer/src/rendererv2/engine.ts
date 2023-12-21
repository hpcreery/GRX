import REGL from 'regl'
import { mat3, vec2 } from 'gl-matrix'
import LayerRenderer, { LayerRendererProps } from './layer'

interface WorldProps {}

interface WorldUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_Screen: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
}

interface WorldAttributes {
  a_Vertex_Position: vec2[]
}

export interface WorldContext {
  settings: RenderSettings
  transform: RenderTransform
  resolution: vec2
}

interface ScreenRenderProps {
  frameBuffer: REGL.Framebuffer
}

interface ScreenRenderUniforms {
  render_tex: REGL.Framebuffer
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

interface RenderTransform {
  zoom: number
  position: vec2
  velocity: vec2
  dragging: boolean
  matrix: mat3
  matrixInverse: mat3
  update: () => void
}

export class RenderEngine {
  public settings: RenderSettings = new Proxy(
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

  private transform: RenderTransform = {
    zoom: 1,
    position: [0, 0],
    velocity: [0, 0],
    dragging: false,
    matrix: mat3.create(),
    matrixInverse: mat3.create(),
    update: (): void => {
      this.updateTransform()
    }
  }

  private dirty = true

  // public stats: Stats = {
  //   renderDuration: 0,
  //   fps: 0,
  //   lastRenderTime: 0
  // }

  // make layers a proxy so that we can call render when a property is updated
  public layers: LayerRenderer[] = new Proxy([], {
    set: (target, name, value): boolean => {
      target[name] = value
      this.render(true)
      return true
    }
  })

  regl: REGL.Regl
  world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>

  renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps>


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
      depth: 0
    })

    this.world = this.regl<WorldUniforms, WorldAttributes, WorldProps, WorldContext>({
      context: {
        settings: this.settings,
        transform: this.transform,
        resolution: [this.CONTAINER.clientWidth, this.CONTAINER.clientHeight]
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        // u_Resolution: () => [this.CONTAINER.clientWidth, this.CONTAINER.clientHeight],
        u_Screen: () => [
          window.screen.width * window.devicePixelRatio,
          window.screen.height * window.devicePixelRatio
        ],
        u_PixelSize: () => .0023 * window.devicePixelRatio / this.transform.zoom,
        u_OutlineMode: () => this.settings.OUTLINE_MODE,
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

      cull: {
        enable: true,
        face: 'back'
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0
    })

    this.renderToScreen = this.regl<ScreenRenderUniforms, Record<string, never>, ScreenRenderProps>(
      {
        vert: `
        precision mediump float;
        attribute vec2 a_Vertex_Position;
        varying vec2 v_UV;
        void main () {
          v_UV = a_Vertex_Position;
          gl_Position = vec4(a_Vertex_Position, 1, 1);
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
          mask: false,
          func: 'greater',
          range: [0, 1]
        },

        uniforms: {
          render_tex: (_context: REGL.DefaultContext, props: ScreenRenderProps) => props.frameBuffer
        }
      }
    )

    this.zoomAtPoint(0, 0, this.transform.zoom)
    this.addControls()
    this.render()
    // this.regl.frame(() => this.render())
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    // new ResizeObserver(this.resize.bind(this)).observe(this.CONTAINER)

  }

  private resize(): void {
    this.regl.poll()
    this.updateTransform()
  }

  private toss(): void {
    const { dragging } = this.transform
    if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    vec2.scale(this.transform.velocity, this.transform.velocity, 0.95)
    this.transform.update()
    if (
      Math.abs(this.transform.velocity[0]) < 0.05 &&
      Math.abs(this.transform.velocity[1]) < 0.05
    ) {
      this.transform.velocity[0] = 0
      this.transform.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), this.settings.MSPFRAME)
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
    const mouse_viewbox_pos: vec2 = [x * 2 - 1, y * 2 - 1]
    const mouse = vec2.transformMat3(vec2.create(), mouse_viewbox_pos, this.transform.matrixInverse)
    return mouse
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
      if (this.settings.ZOOM_TO_CURSOR) {
        this.zoomAtPoint(e.x - offsetX, e.y - offsetY, e.deltaY)
      } else {
        this.zoomAtPoint(width / 2, height / 2, e.deltaY)
      }
    }
    this.CONTAINER.onmousedown = (e): void => {
      this.transform.dragging = true
      const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
      const xpos = e.clientX - offsetX
      const ypos = height - (e.clientY - offsetY)
      // console.log(xpos * window.devicePixelRatio, ypos * window.devicePixelRatio)
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
      this.transform.dragging = false
      this.toss()

      sendPointerEvent(e, PointerEvents.POINTER_UP)
    }
    this.CONTAINER.onmousemove = (e): void => {
      if (!this.transform.dragging) return
      this.transform.velocity = [e.movementX, e.movementY]
      vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
      this.transform.update()

      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
    }
  }

  public addLayer({
    name,
    color,
    context,
    type,
    transform,
    image
  }: Omit<LayerRendererProps, 'regl'>): LayerRenderer {
    const layer = new LayerRenderer({
      name,
      image,
      color,
      context,
      type,
      transform,
      regl: this.regl
    })
    this.layers.push(layer)
    return layer
  }

  public updateTransform(): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this.transform
    // const { width, height } = this.CONTAINER.getBoundingClientRect()
    const width = this.CONTAINER.clientWidth
    const height = this.CONTAINER.clientHeight
    mat3.projection(this.transform.matrix, width, height)
    mat3.translate(this.transform.matrix, this.transform.matrix, position)
    mat3.scale(this.transform.matrix, this.transform.matrix, [zoom, zoom])
    mat3.scale(this.transform.matrix, this.transform.matrix, [height / width, 1])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [1, width / height])
    mat3.translate(this.transform.matrix, this.transform.matrix, [width / 2, height / 2])
    mat3.scale(this.transform.matrix, this.transform.matrix, [width / 2, -height / 2])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [height / width / 2, width / height / 2])

    mat3.invert(this.transform.matrixInverse, this.transform.matrix)

    // logMatrix(this.transform)

    // console.log(s)
    this.render()
  }

  public zoomAtPoint(x: number, y: number, s: number): void {
    const { zoom } = this.transform
    let newZoom = zoom - s / (1000 / zoom / 2)
    let zoomBy = newZoom / zoom
    if (newZoom < this.settings.MIN_ZOOM) {
      newZoom = this.settings.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else if (newZoom > this.settings.MAX_ZOOM) {
      newZoom = this.settings.MAX_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else {
      this.transform.zoom = newZoom
    }
    this.transform.position[0] = x - (x - this.transform.position[0]) * zoomBy
    this.transform.position[1] = y - (y - this.transform.position[1]) * zoomBy
    this.transform.update()
  }

  public render(force = false): void {
    if (!this.dirty && !force) return
    this.dirty = false
    this.regl.clear({
      color: this.settings.BACKGROUND_COLOR,
      depth: 0
    })
    setTimeout(() => (this.dirty = true), this.settings.MSPFRAME)
    this.world((context) => {
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

export function logMatrix(matrix: mat3): void {
  console.log(
    `${Math.round(matrix[0] * 100) / 100}, ${Math.round(matrix[1] * 100) / 100}, ${
      Math.round(matrix[2] * 100) / 100
    },\n` +
      `${Math.round(matrix[3] * 100) / 100}, ${Math.round(matrix[4] * 100) / 100}, ${
        Math.round(matrix[5] * 100) / 100
      },\n` +
      `${Math.round(matrix[6] * 100) / 100}, ${Math.round(matrix[7] * 100) / 100}, ${
        Math.round(matrix[8] * 100) / 100
      }`
  )
}
