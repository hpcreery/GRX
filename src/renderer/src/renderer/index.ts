import { LayerRendererProps } from './layer'
import * as Comlink from 'comlink'
import EngineWorker from './engine?worker'
import type { GridRenderProps, QueryFeature, RenderEngineBackend, RenderSettings } from './engine'

const Worker = new EngineWorker()
export const ComWorker = Comlink.wrap<typeof RenderEngineBackend>(Worker)

export interface RenderEngineFrontendConfig {
  container: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

interface PointerCoordinates {
  x: number
  y: number
}

interface PointerSettings {
  mode: 'move' | 'select'
}

export const PointerEvents = {
  POINTER_DOWN: 'pointerdown',
  POINTER_UP: 'pointerup',
  POINTER_MOVE: 'pointermove',
  POINTER_HOVER: 'pointerhover',
  POINTER_SELECT: 'pointerselect'
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
        this.backend.then((engine) => {
          engine.settings[name] = value
          engine.render(true)
        })
        target[name] = value
        return true
      }
    }
  )
  public grid: GridRenderProps = new Proxy(
    {
      enabled: true,
      color: [0.2, 0.2, 0.2, 0.5],
      spacing_x: 1,
      spacing_y: 1,
      offset_x: 0,
      offset_y: 0,
      _type: 0,
      type: 'dots'
    },
    {
      set: (target, name, value): boolean => {
        this.backend.then((engine) => {
          engine.grid[name] = value
          engine.render(true)
        })
        target[name] = value
        return true
      }
    }
  )
  public pointerSettings: PointerSettings = new Proxy(
    {
      mode: 'move'
    },
    {
      set: (target, name, value): boolean => {
        if (name === 'mode') {
          if (value === 'move') this.CONTAINER.style.cursor = 'grab'
          if (value === 'select') this.CONTAINER.style.cursor = 'crosshair'
        }
        target[name] = value
        return true
      }
    }
  )
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  private pointerCache: globalThis.PointerEvent[] = []
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvas: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.CONTAINER.style.cursor = 'grab'
    this.canvas = this.createCanvas()
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    this.backend = new ComWorker(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), {
      attributes,
      width: this.canvas.width,
      height: this.canvas.height
    })
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
    this.backend.then((engine) => {
      engine.resize(width, height)
    })
  }

  public getMouseCanvasCoordinates(e: MouseEvent): [number, number] {
    // Get the mouse position relative to the canvas
    const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
    return [e.clientX - offsetX, height - (e.clientY - offsetY)]
  }

  public async getMouseNormalizedWorldCoordinates(e: MouseEvent): Promise<[number, number]> {
    const { width, height } = this.CONTAINER.getBoundingClientRect()
    const mouse_element_pos = this.getMouseCanvasCoordinates(e)

    // Normalize the mouse position to the canvas
    const mouse_normalize_pos = [mouse_element_pos[0] / width, mouse_element_pos[1] / height] as [
      number,
      number
    ]
    // mouse_normalize_pos[0] = x value from 0 to 1 ( left to right ) of the canvas
    // mouse_normalize_pos[1] = y value from 0 to 1 ( bottom to top ) of the canvas

    return mouse_normalize_pos
  }

  public async getMouseWorldCoordinates(e: MouseEvent): Promise<[number, number]> {
    const backend = await this.backend
    return backend.getWorldPosition(...(await this.getMouseNormalizedWorldCoordinates(e)))
  }

  private async addControls(): Promise<void> {
    const backend = await this.backend
    const sendPointerEvent = async (
      mouse: MouseEvent,
      event_type: (typeof PointerEvents)[keyof typeof PointerEvents]
    ): Promise<void> => {
      const [x, y] = await this.getMouseWorldCoordinates(mouse)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>(event_type, {
          detail: { x, y }
        })
      )
    }

    const removePointerCache = (ev: globalThis.PointerEvent): void => {
      // Remove this event from the target's cache
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId)
      this.pointerCache.splice(index, 1)
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
    this.CONTAINER.onpointerdown = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_DOWN)
      this.pointerCache.push(e)
      if (this.pointerSettings.mode === 'move') {
        this.CONTAINER.style.cursor = 'grabbing'
        await backend.grabViewport()
      } else if (this.pointerSettings.mode === 'select') {
        this.CONTAINER.style.cursor = 'wait'
        const [x, y] = this.getMouseCanvasCoordinates(e)
        const features = await backend.query([x, y])
        console.log('features', features)
        this.pointer.dispatchEvent(
          new CustomEvent<QueryFeature[]>(PointerEvents.POINTER_SELECT, {
            detail: features
          })
        )
        this.CONTAINER.style.cursor = 'crosshair'
      }
    }
    this.CONTAINER.onpointerup = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === 'move') {
        this.CONTAINER.style.cursor = 'grab'
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointercancel = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === 'move') {
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointerleave = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === 'move') {
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointermove = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId)
      this.pointerCache[index] = e

      if (!(await backend.isDragging())) {
        await sendPointerEvent(e, PointerEvents.POINTER_HOVER)
        return
      }
      if (this.pointerSettings.mode === 'move') {
        // If more than 2 pointers are down, check for pinch gestures
        if (this.pointerCache.length >= 2) {
          const p1 = this.pointerCache[0]
          const p2 = this.pointerCache[1]
          const startDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
          const endDistance = Math.hypot((p1.clientX + p1.movementX) - (p2.clientX + p2.movementX), (p1.clientY + p1.movementY) - (p2.clientY + p2.movementY));
          const zoomFactor = (startDistance - endDistance) / this.pointerCache.length;
          const settings = await backend.settings
          const { x: offsetX, y: offsetY, width, height } = this.CONTAINER.getBoundingClientRect()
          if (settings.ZOOM_TO_CURSOR) {
            backend.zoomAtPoint(e.x - offsetX, e.y - offsetY, zoomFactor)
          } else {
            backend.zoomAtPoint(width / 2, height / 2, zoomFactor)
          }
          backend.moveViewport(e.movementX / this.pointerCache.length, e.movementY / this.pointerCache.length)
        } else {
          await backend.moveViewport(e.movementX, e.movementY)
        }
      }
    }
  }

  public async addLayer(params: Omit<LayerRendererProps, 'regl'>): Promise<void> {
    const backend = await this.backend
    backend.addLayer(params)
  }

  public async addFile(params: {
    file: string
    format: string
    props: Partial<Omit<LayerRendererProps, 'regl' | 'image'>>
  }): Promise<void> {
    const backend = await this.backend
    backend.addFile(params)
  }

  public async render(force = false): Promise<void> {
    const backend = await this.backend
    backend.render(force)
  }

  public async destroy(): Promise<void> {
    const backend = await this.backend
    backend.destroy()
    ComWorker[Comlink.releaseProxy]()
    Worker.terminate()

    this.CONTAINER.innerHTML = ''
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
  }
}
