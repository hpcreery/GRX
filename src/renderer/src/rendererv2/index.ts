import { LayerRendererProps } from './layer'
import * as Comlink from 'comlink'
import EngineWorker from './engine?worker'
import type { RenderEngineBackend, RenderSettings } from './engine'

export const Worker = Comlink.wrap<typeof RenderEngineBackend>(new EngineWorker())

export interface RenderEngineFrontendConfig {
  container: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

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
        this.backend.then(engine => {
          return engine.settings[prop]
        })
      }
    }
  )
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  // private worker: Comlink.Remote<typeof RenderEngineBackend>
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvas: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.canvas = this.createCanvas()
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    // this.worker = Comlink.wrap<typeof RenderEngineBackend>(new EngineWorker())
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
    return await backend.getWorldPosition(mouse_normalize_pos[0], mouse_normalize_pos[1])
  }

  private async addControls(): Promise<void> {
    const backend = await this.backend
    const sendPointerEvent = async (
      mouse: MouseEvent,
      event_type: (typeof PointerEvents)[keyof typeof PointerEvents]
    ): Promise<void> => {
      const [x, y] = await this.getWorldPositionFromMouse(mouse)
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
      await backend.grabViewport()
      const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
      const xpos = e.clientX - offsetX
      const ypos = height - (e.clientY - offsetY)
      backend.sample(xpos * window.devicePixelRatio, ypos * window.devicePixelRatio)

      sendPointerEvent(e, PointerEvents.POINTER_DOWN)
    }
    this.CONTAINER.onmouseup = async (e): Promise<void> => {
      await backend.releaseViewport()

      sendPointerEvent(e, PointerEvents.POINTER_UP)
    }
    this.CONTAINER.onmousemove = async (e): Promise<void> => {
      if (!await backend.isDragging()) {
        await sendPointerEvent(e, PointerEvents.POINTER_HOVER)
        return
      }
      await backend.moveViewport(e.movementX, e.movementY)

      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
    }
  }

  public async addLayer(params: Omit<LayerRendererProps, 'regl'>): Promise<void> {
    const backend = await this.backend
    backend.addLayer(params)
  }

  public async render(force = false): Promise<void> {
    const backend = await this.backend
    backend.render(force)
  }

  public async destroy(): Promise<void> {
    const backend = await this.backend
    backend.destroy()
    // Worker[Comlink.releaseProxy]()
    // @ts-ignore - force garbage collection
    // this.worker = undefined
    this.CONTAINER.innerHTML = ''
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
  }
}
