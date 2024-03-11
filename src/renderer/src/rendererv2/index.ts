import { mat3, vec2 } from 'gl-matrix'
import LayerRenderer, { LayerRendererProps } from './layer'
import * as Comlink from 'comlink'
import EngineWorker from './engine?worker'
import type { RenderEngineBackend } from './engine'


export interface WorldContext {
  settings: RenderSettings
  transform: RenderTransform
  resolution: vec2
}

export interface RenderEngineFrontendConfig {
  container: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

export interface RenderEngineBackendConfig {
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
        this.backend.then(engine => {
          engine.settings[name] = value
          engine.render(true)
        })
        return true
      },
      get: (target, prop, reciever): any => {
        // return this.backend.settings[prop]
        this.backend.then(engine => {
          return engine.settings[prop]
        })
      }
    }
  )
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvas: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.canvas = this.createCanvas()
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    // this.backend = new RenderEngineBackend({ offscreenCanvas, attributes })
    // const transfer = Comlink.transfer(offscreenCanvas, [offscreenCanvas])
    const Worker = Comlink.wrap<typeof RenderEngineBackend>(new EngineWorker())
    this.backend = new Worker(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), { attributes, width: this.canvas.width, height: this.canvas.height })
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
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
    this.backend.then(engine => {
      engine.resize(width, height)
    })
  }

  public async getWorldPositionFromMouse(e: MouseEvent): Promise<[number, number]> {
    const backend = await this.backend
    const { x: offsetX, y: offsetY, width, height } = this.CONTAINER.getBoundingClientRect()
    const mouse_element_pos = [e.clientX - offsetX, e.clientY - offsetY]
    const mouse_normalize_pos = [
      mouse_element_pos[0] / width,
      (height - mouse_element_pos[1]) / height
    ]
    // console.log(mouse_normalize_pos)
    return await backend.getWorldPosition(mouse_normalize_pos[0], mouse_normalize_pos[1])
  }

  // public async getWorldPosition(x: number, y: number): Promise<[number, number]> {
  //   const mouse_viewbox_pos: vec2 = [x * 2 - 1, y * 2 - 1]
  //   const backend = await this.backend
  //   const transform = await backend.transform
  //   // const transform = await backend.getTransorm()
  //   const mouse = vec2.transformMat3(
  //     vec2.create(),
  //     mouse_viewbox_pos,
  //     transform.matrixInverse
  //   )
  //   return [mouse[0], mouse[1]]
  // }

  private async addControls(): Promise<void> {
    const backend = await this.backend
    const sendPointerEvent = async (
      mouse: MouseEvent,
      event_type: (typeof PointerEvents)[keyof typeof PointerEvents]
    ): Promise<void> => {
      const [x, y] = await this.getWorldPositionFromMouse(mouse)
      // console.log(x, y)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>(event_type, {
          detail: { x, y }
        })
      )
    }
    this.CONTAINER.onwheel = async (e): Promise<void> => {
      const settings = await backend.settings
      const { x: offsetX, y: offsetY, width, height } = this.CONTAINER.getBoundingClientRect()
      if (settings.ZOOM_TO_CURSOR) {
        backend.zoomAtPoint(e.x - offsetX, e.y - offsetY, e.deltaY)
      } else {
        backend.zoomAtPoint(width / 2, height / 2, e.deltaY)
      }
    }
    this.CONTAINER.onmousedown = async (e): Promise<void> => {
      // const transform = await backend.transform
      // const transform = await backend.getTransorm()
      // transform.dragging = true
      await backend.grabViewport()
      const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
      const xpos = e.clientX - offsetX
      const ypos = height - (e.clientY - offsetY)
      backend.sample(xpos * window.devicePixelRatio, ypos * window.devicePixelRatio)

      // sendPointerEvent(e, PointerEvents.POINTER_DOWN)
    }
    this.CONTAINER.onmouseup = async (e): Promise<void> => {
      // const transform = await backend.transform
      // const transform = await backend.getTransorm()
      // transform.dragging = false
      // backend.toss()
      await backend.releaseViewport()

      // sendPointerEvent(e, PointerEvents.POINTER_UP)
    }
    this.CONTAINER.onmousemove = async (e): Promise<void> => {
      // const transform = await backend.transform
      // const transform = await backend.getTransorm()
      // console.log(`transform.dragging ${transform.dragging}`)
      if (!await backend.isDragging()) {
        await sendPointerEvent(e, PointerEvents.POINTER_HOVER)
        return
      }
      // transform.velocity = [e.movementX, e.movementY]
      // vec2.add(
      //   transform.position,
      //   transform.position,
      //   transform.velocity
      // )
      // transform.update()
      await backend.moveViewport(e.movementX, e.movementY)

      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
    }
  }

  public async addLayer(params: Omit<LayerRendererProps, 'regl'>): Promise<void> {
    const { name, color, context, type, transform, image } = params
    const backend = await this.backend
    // Comlink.proxy({
    //   name,
    //   image,
    //   color,
    //   context,
    //   type,
    //   transform
    // })
    // const layer = backend.addLayer(Comlink.proxy({
    //   name,
    //   image,
    //   color,
    //   context,
    //   type,
    //   transform
    // }))
    // console.log('addLayer')
    backend.addLayer({
      name,
      image,
      color,
      context,
      type,
      transform
    })
    // return layer
  }

  // public async SUPERTEST(): Promise<void> {
  //   console.log('SUPERTEST')
  //   const a = {a: 1}
  //   const b = {b: 2}
  //   const ref = {a, b, c: a, d: b}
  //   console.log(ref)
  //   const backend = await this.backend
  //   backend.SUPERTEST(ref)
  // }

  public async render(force = false): Promise<void> {
    const backend = await this.backend
    backend.render(force)
  }

  public async destroy(): Promise<void> {
    const backend = await this.backend
    backend.destroy()
    this.backend[Comlink.releaseProxy]()
    this.CONTAINER.innerHTML = ''
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
  }
}
