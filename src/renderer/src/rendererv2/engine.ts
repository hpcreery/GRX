import REGL from 'regl'
import { mat3, vec2 } from 'gl-matrix'
import LayerRenderer, { LayerRendererProps } from './layer'
import { initializeRenderers } from './collections'

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
  u_RenderTexture: REGL.Framebuffer
}

export interface RenderEngineFrontendConfig {
  container: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

export interface RenderEngineBackendConfig {
  // gl: WebGLRenderingContext
  offscreenCanvas: OffscreenCanvas
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

export const PointerEvents = {
  POINTER_DOWN: 'pointerdown',
  POINTER_UP: 'pointerup',
  POINTER_MOVE: 'pointermove',
  POINTER_HOVER: 'pointerhover'
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

// export class RenderEngine {

// }

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
        this.backend.settings[name] = value
        this.backend.render(true)
        return true
      },
      get: (target, prop, reciever): any => {
        return this.backend.settings[prop]
      }
    }
  )
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  public backend: RenderEngineBackend
  public canvas: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.canvas = this.createCanvas()
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    this.backend = new RenderEngineBackend({ offscreenCanvas, attributes })
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    this.resize()
    this.addControls()
    this.render(true)
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.CONTAINER.clientWidth
    canvas.height = this.CONTAINER.clientHeight
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    this.CONTAINER.appendChild(canvas)
    return canvas
  }

  private resize(): void {
    const { clientWidth: width, clientHeight: height } = this.CONTAINER
    this.backend.viewBox = {
      width,
      height
    }
    this.backend.resize()
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
    const mouse = vec2.transformMat3(
      vec2.create(),
      mouse_viewbox_pos,
      this.backend.transform.matrixInverse
    )
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
      if (this.backend.settings.ZOOM_TO_CURSOR) {
        this.backend.zoomAtPoint(e.x - offsetX, e.y - offsetY, e.deltaY)
      } else {
        this.backend.zoomAtPoint(width / 2, height / 2, e.deltaY)
      }
    }
    this.CONTAINER.onmousedown = (e): void => {
      this.backend.transform.dragging = true
      const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
      const xpos = e.clientX - offsetX
      const ypos = height - (e.clientY - offsetY)
      this.backend.sample(xpos * window.devicePixelRatio, ypos * window.devicePixelRatio)

      sendPointerEvent(e, PointerEvents.POINTER_DOWN)
    }
    this.CONTAINER.onmouseup = (e): void => {
      this.backend.transform.dragging = false
      this.backend.toss()

      sendPointerEvent(e, PointerEvents.POINTER_UP)
    }
    this.CONTAINER.onmousemove = (e): void => {
      if (!this.backend.transform.dragging) {
        sendPointerEvent(e, PointerEvents.POINTER_HOVER)
        return
      }
      this.backend.transform.velocity = [e.movementX, e.movementY]
      vec2.add(
        this.backend.transform.position,
        this.backend.transform.position,
        this.backend.transform.velocity
      )
      this.backend.transform.update()

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
    const layer = this.backend.addLayer({
      name,
      image,
      color,
      context,
      type,
      transform
    })
    return layer
  }

  public render(force = false): void {
    this.backend.render(force)
  }

  public destroy(): void {
    this.backend.destroy()
    this.CONTAINER.innerHTML = ''
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
  }
}

export class RenderEngineBackend {
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

  public offscreenCanvas: OffscreenCanvas
  public viewBox: {
    width: number
    height: number
  }

  public transform: RenderTransform = {
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

  constructor({ offscreenCanvas, attributes }: RenderEngineBackendConfig) {
    this.offscreenCanvas = offscreenCanvas
    this.viewBox = {
      width: 0,
      height: 0
    }

    const gl = offscreenCanvas.getContext('webgl', attributes)!

    this.regl = REGL({
      gl,
      extensions: [
        'angle_instanced_arrays',
        'OES_texture_float',
        'webgl_depth_texture',
        'EXT_frag_depth'
      ],
      attributes,
      profile: true
    })
    console.log('WEBGL LIMITS', this.regl.limits)

    initializeRenderers(this.regl)

    this.regl.clear({
      depth: 0
    })

    this.world = this.regl<WorldUniforms, WorldAttributes, WorldProps, WorldContext>({
      context: {
        settings: this.settings,
        transform: this.transform,
        resolution: () => [this.viewBox.width, this.viewBox.height]
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        // u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        u_Resolution: () => [this.viewBox.width, this.viewBox.height],
        u_Screen: () => [
          window.screen.width * window.devicePixelRatio,
          window.screen.height * window.devicePixelRatio
        ],
        u_PixelSize: () => 0.0023 / (this.transform.zoom * window.devicePixelRatio),
        u_OutlineMode: () => this.settings.OUTLINE_MODE
      },

      attributes: {
        a_Vertex_Position: [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, +1],
          [+1, -1]
        ]
      },

      cull: {
        enable: false,
        face: 'front'
      },

      primitive: 'triangles',
      count: 6,
      offset: 0
    })

    this.renderToScreen = this.regl<ScreenRenderUniforms, Record<string, never>, ScreenRenderProps>(
      {
        vert: `
        precision highp float;
        attribute vec2 a_Vertex_Position;
        varying vec2 v_UV;
        void main () {
          v_UV = a_Vertex_Position;
          gl_Position = vec4(a_Vertex_Position, 1, 1);
        }
      `,
        frag: `
        precision highp float;
        uniform sampler2D u_RenderTexture;
        varying vec2 v_UV;
        void main () {
          gl_FragColor = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
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
          u_RenderTexture: (_context: REGL.DefaultContext, props: ScreenRenderProps) =>
            props.frameBuffer
        }
      }
    )

    this.zoomAtPoint(0, 0, this.transform.zoom)
    this.render()
  }

  public resize(): void {
    this.offscreenCanvas.width = this.viewBox.width
    this.offscreenCanvas.height = this.viewBox.height
    this.regl.poll()
    this.updateTransform()
  }

  public toss(): void {
    const { dragging } = this.transform
    if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    if (dragging) return
    // const vel_rounded = this.transform.velocity.map((v) => Math.round(v)) as vec2
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

  public updateTransform(): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this.transform
    const { width, height } = this.viewBox
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

  public sample(x: number, y: number): void {
    for (const layer of this.layers) {
      if (!layer.visible) continue
      const data = this.regl.read({
        framebuffer: layer.framebuffer,
        x,
        y,
        width: 1,
        height: 1
      })
      if (data.reduce((acc, val) => acc + val, 0) < 1) continue
      console.log(layer.name)
    }
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
