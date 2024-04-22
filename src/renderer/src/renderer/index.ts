import { LayerRendererProps, NestedFeature } from './layer'
import * as Comlink from 'comlink'
import EngineWorker from './engine?worker'
import type { GridRenderProps, RenderEngineBackend, RenderSettings } from './engine'
import { Shape } from './shapes'

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
      ZOOM_TO_CURSOR: true,
    },
    {
      set: (target, name, value): boolean => {
        this.backend.then(engine => {
          engine.settings[name] = value
          engine.render(true)
        })
        target[name] = value
        return true
      }
    }
  )
  public grid: GridRenderProps = new Proxy({
    enabled: true,
    color: [0.2, 0.2, 0.2, 0.5],
    spacing_x: 1,
    spacing_y: 1,
    offset_x: 0,
    offset_y: 0,
    _type: 0,
    type: 'dots'
  }, {
    set: (target, name, value): boolean => {
      this.backend.then(engine => {
        engine.grid[name] = value
        engine.render(true)
      })
      target[name] = value
      return true
    },
  })
  public pointerSettings: PointerSettings = new Proxy({
    mode: 'move'
  }, {
    set: (target, name, value): boolean => {
      if (name === 'mode') {
        if (value === 'move') this.CONTAINER.style.cursor = 'grab'
        if (value === 'select') this.CONTAINER.style.cursor = 'crosshair'
      }
      target[name] = value
      return true
    }
  })
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvas: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.CONTAINER.style.cursor = 'grab'
    this.canvas = this.createCanvas()
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    this.backend = new ComWorker(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), { attributes, width: this.canvas.width, height: this.canvas.height })
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

  public getMouseCanvasCoordinates(e: MouseEvent): [number, number] {
    // Get the mouse position relative to the canvas
    const { x: offsetX, y: offsetY, height } = this.CONTAINER.getBoundingClientRect()
    return [e.clientX - offsetX, height - (e.clientY - offsetY)]
  }

  public async getMouseNormalizedWorldCoordinates(e: MouseEvent): Promise<[number, number]> {
    const { width, height } = this.CONTAINER.getBoundingClientRect()
    const mouse_element_pos = this.getMouseCanvasCoordinates(e)

    // Normalize the mouse position to the canvas
    const mouse_normalize_pos = [
      mouse_element_pos[0] / width,
      mouse_element_pos[1] / height
    ] as [number, number]
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
      if (this.pointerSettings.mode === 'move') {
        this.CONTAINER.style.cursor = 'grabbing'
        await backend.grabViewport()
        sendPointerEvent(e, PointerEvents.POINTER_DOWN)
      } else if (this.pointerSettings.mode === 'select') {
        const [x, y] = this.getMouseCanvasCoordinates(e)
        const features = await backend.query([x, y])
        console.log('features', features)
        if (features.length > 0) {
          this.pointer.dispatchEvent(
            new CustomEvent<(Shape | NestedFeature)[]>(PointerEvents.POINTER_SELECT, {
              detail: features
            })
          )
        }
      }
    }
    this.CONTAINER.onpointerup = async (e): Promise<void> => {
      if (this.pointerSettings.mode === 'move') {
        this.CONTAINER.style.cursor = 'grab'
        await backend.releaseViewport()
        sendPointerEvent(e, PointerEvents.POINTER_UP)
      }
    }
    this.CONTAINER.onpointercancel = async (e): Promise<void> => {
      if (this.pointerSettings.mode === 'move') {
        await backend.releaseViewport()
        sendPointerEvent(e, PointerEvents.POINTER_UP)
      }
    }
    this.CONTAINER.onpointerleave = async (e): Promise<void> => {
      if (this.pointerSettings.mode === 'move') {
        await backend.releaseViewport()
        sendPointerEvent(e, PointerEvents.POINTER_UP)
      }
    }
    this.CONTAINER.onpointermove = async (e): Promise<void> => {
      if (this.pointerSettings.mode === 'move') {
        if (!await backend.isDragging()) {
          await sendPointerEvent(e, PointerEvents.POINTER_HOVER)
          return
        }
        await backend.moveViewport(e.movementX, e.movementY)
        sendPointerEvent(e, PointerEvents.POINTER_MOVE)
      }
    }
  }

  public async addLayer(params: Omit<LayerRendererProps, 'regl'>): Promise<void> {
    const backend = await this.backend
    backend.addLayer(params)
  }

  public async addFile(params: { file: string, format: string, props: Partial<Omit<LayerRendererProps, 'regl' | 'image'>> }): Promise<void> {
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
