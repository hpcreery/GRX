import * as Comlink from "comlink"
import EngineWorker from "./engine?worker"
import type { GridRenderProps, QueryFeature, RenderEngineBackend, RenderSettings, RenderProps } from "./engine"
import { AddLayerProps } from "./plugins"

// import font from "./text/glyph/font.png?arraybuffer"
// import { fontInfo } from "./text/glyph/font"

import cozetteFont from "./text/cozette/CozetteVector.ttf?url"
import { fontInfo as cozetteFontInfo } from "./text/cozette/font"

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

export interface PointerSettings {
  mode: "move" | "select" | "measure"
}

export const PointerEvents = {
  POINTER_DOWN: "pointerdown",
  POINTER_UP: "pointerup",
  POINTER_MOVE: "pointermove",
  POINTER_HOVER: "pointerhover",
  POINTER_SELECT: "pointerselect",
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
      SKELETON_MODE: true,
      COLOR_BLEND: "Contrast",
      BACKGROUND_COLOR: [0, 0, 0, 0],
      MAX_ZOOM: 1000,
      MIN_ZOOM: 0.001,
      ZOOM_TO_CURSOR: true,
      SHOW_DATUMS: false,
    },
    {
      set: (target, name, value): boolean => {
        this.backend.then((engine) => {
          engine.settings[name] = value
          engine.render({
            force: true,
          })
        })
        target[name] = value
        return true
      },
    },
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
      type: "dots",
    },
    {
      set: (target, name, value): boolean => {
        this.backend.then((engine) => {
          engine.grid[name] = value
          engine.render({
            force: true,
          })
        })
        target[name] = value
        return true
      },
    },
  )
  public pointerSettings: PointerSettings = new Proxy(
    {
      mode: "move",
    },
    {
      set: (target, name, value): boolean => {
        if (name === "mode") {
          if (value === "move") this.CONTAINER.style.cursor = "grab"
          if (value === "select") this.CONTAINER.style.cursor = "crosshair"
          if (value === "measure") {
            this.CONTAINER.style.cursor = "crosshair"
            this.settings.SHOW_DATUMS = true
          }
        }
        target[name] = value
        return true
      },
    },
  )
  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  private pointerCache: globalThis.PointerEvent[] = []
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvasGL: HTMLCanvasElement
  public canvas2D: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    this.CONTAINER = container
    this.CONTAINER.style.cursor = "grab"
    this.canvasGL = this.createCanvas()
    this.canvas2D = this.createCanvas()
    const offscreenCanvasGL = this.canvasGL.transferControlToOffscreen()
    const offscreenCanvas2D = this.canvas2D.transferControlToOffscreen()
    this.backend = new ComWorker(Comlink.transfer(offscreenCanvasGL, [offscreenCanvasGL]), Comlink.transfer(offscreenCanvas2D, [offscreenCanvas2D]), {
      attributes,
      width: this.canvasGL.width,
      height: this.canvasGL.height,
    })
    this.sendFontData()
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    this.addControls()
    this.render({
      force: true,
    })
  }

  public async onLoad(cb: () => void): Promise<void> {
    await this.backend
    cb()
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = this.CONTAINER.clientWidth
    canvas.height = this.CONTAINER.clientHeight
    // canvas.style.width = String(this.CONTAINER.clientWidth)
    // canvas.style.height = String(this.CONTAINER.clientHeight)
    canvas.style.position = "absolute"
    this.CONTAINER.appendChild(canvas)
    return canvas
  }

  private resize(): void {
    const { clientWidth: width, clientHeight: height } = this.CONTAINER
    // this.canvas2D.style.width = String(width)
    // this.canvas2D.style.height = String(height)
    // this.canvasGL.style.width = String(width)
    // this.canvasGL.style.height = String(height)
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
    const mouse_normalize_pos = [mouse_element_pos[0] / width, mouse_element_pos[1] / height] as [number, number]
    // mouse_normalize_pos[0] = x value from 0 to 1 ( left to right ) of the canvas
    // mouse_normalize_pos[1] = y value from 0 to 1 ( bottom to top ) of the canvas

    return mouse_normalize_pos
  }

  public async getMouseWorldCoordinates(e: MouseEvent): Promise<[number, number]> {
    const backend = await this.backend
    return backend.getWorldPosition(...(await this.getMouseNormalizedWorldCoordinates(e)))
  }

  public async zoomFit(): Promise<void> {
    const backend = await this.backend
    backend.zoomFit()
  }

  private async addControls(): Promise<void> {
    const backend = await this.backend
    const sendPointerEvent = async (mouse: MouseEvent, event_type: (typeof PointerEvents)[keyof typeof PointerEvents]): Promise<void> => {
      const [x, y] = await this.getMouseWorldCoordinates(mouse)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>(event_type, {
          detail: { x, y },
        }),
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
      if (this.pointerSettings.mode === "move") {
        this.CONTAINER.style.cursor = "grabbing"
        await backend.grabViewport()
      } else if (this.pointerSettings.mode === "select") {
        this.CONTAINER.style.cursor = "wait"
        const [x, y] = this.getMouseCanvasCoordinates(e)
        const features = await backend.select([x, y])
        console.log("features", features)
        this.pointer.dispatchEvent(
          new CustomEvent<QueryFeature[]>(PointerEvents.POINTER_SELECT, {
            detail: features,
          }),
        )
        this.CONTAINER.style.cursor = "crosshair"
      } else if (this.pointerSettings.mode === "measure") {
        this.CONTAINER.style.cursor = "crosshair"
        const [x1, y1] = await this.getMouseWorldCoordinates(e)
        backend.addMeasurement([x1, y1])
      }
    }
    this.CONTAINER.onpointerup = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === "move") {
        this.CONTAINER.style.cursor = "grab"
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointercancel = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === "move") {
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointerleave = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === "move") {
        await backend.releaseViewport()
      }
      removePointerCache(e)
    }
    this.CONTAINER.onpointermove = async (e): Promise<void> => {
      sendPointerEvent(e, PointerEvents.POINTER_MOVE)
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId)
      this.pointerCache[index] = e

      if (this.pointerSettings.mode === "measure") {
        this.CONTAINER.style.cursor = "crosshair"
        const [x1, y1] = await this.getMouseWorldCoordinates(e)
        backend.updateMeasurement([x1, y1])

        // THIS IS TEMOPORARY
      } else if (this.pointerSettings.mode === "select") {
        this.CONTAINER.style.cursor = "default"
        const [x, y] = this.getMouseCanvasCoordinates(e)
        const features = await backend.select([x, y])
      }

      if (!(await backend.isDragging())) {
        await sendPointerEvent(e, PointerEvents.POINTER_HOVER)
        return
      }

      if (this.pointerSettings.mode === "move") {
        // If more than 2 pointers are down, check for pinch gestures
        if (this.pointerCache.length >= 2) {
          const p1 = this.pointerCache[0]
          const p2 = this.pointerCache[1]
          const startDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)
          const endDistance = Math.hypot(
            p1.clientX + p1.movementX - (p2.clientX + p2.movementX),
            p1.clientY + p1.movementY - (p2.clientY + p2.movementY),
          )
          const zoomFactor = (startDistance - endDistance) / this.pointerCache.length
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
    this.CONTAINER.onkeydown = async (e): Promise<void> => {
      // if (e.key === 'Escape') {
      //   await backend.cancelMeasurement()
      //   this.pointerSettings.mode = 'move'
      //   this.CONTAINER.style.cursor = 'grab'
      // }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isDragging = await backend.isDragging()
        if (isDragging) return
        this.backend.then((engine) => {
          engine.grabViewport()
          switch (e.key) {
            case "ArrowUp":
              engine.moveViewport(0, 10)
              break
            case "ArrowDown":
              engine.moveViewport(0, -10)
              break
            case "ArrowLeft":
              engine.moveViewport(10, 0)
              break
            case "ArrowRight":
              engine.moveViewport(-10, 0)
              break
          }
          engine.releaseViewport()
        })
      }
    }
  }

  public async addLayer(params: AddLayerProps): Promise<void> {
    const backend = await this.backend
    backend.addLayer(params)
  }

  public async addFile(params: { buffer: ArrayBuffer; format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    const backend = await this.backend
    backend.addFile(params)
  }

  public async render(props: RenderProps): Promise<void> {
    const backend = await this.backend
    backend.render(props)
  }

  private sendFontData(): void {
    const f = new FontFace("cozette", `url(${cozetteFont})`)
    f.load().then((font) => {
      document.fonts.add(font)
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Could not get 2d context")
      canvas.width = cozetteFontInfo.textureSize[0]
      canvas.height = cozetteFontInfo.textureSize[1]
      context.font = `${cozetteFontInfo.fontSize[1]}px cozette`
      context.fillStyle = "white"
      context.textBaseline = "top"
      context.lineWidth = 3
      context.strokeStyle = "black"
      const characters = Object.keys(cozetteFontInfo.characterLocation)
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i]
        context.strokeText(char, cozetteFontInfo.characterLocation[char].x, cozetteFontInfo.characterLocation[char].y)
        context.fillText(char, cozetteFontInfo.characterLocation[char].x, cozetteFontInfo.characterLocation[char].y)
      }

      const imageData = context.getImageData(0, 0, cozetteFontInfo.textureSize[0], cozetteFontInfo.textureSize[1])
      this.backend.then((engine) => {
        engine.initializeFontRenderer(imageData.data)
      })

      // download font image sample
      // const canvasUrl = canvas.toDataURL("image/png", 1);
      // const createEl = document.createElement('a');
      // createEl.href = canvasUrl;
      // createEl.download = "font.png";
      // createEl.click();
      // createEl.remove();
    })
  }

  public downloadImage(): void {
    const canvasUrl = this.canvasGL.toDataURL("image/png", 1)
    const createEl = document.createElement("a")
    createEl.href = canvasUrl
    createEl.download = "grx-screenshot.png"
    createEl.click()
    createEl.remove()
  }

  public async destroy(): Promise<void> {
    const backend = await this.backend
    backend.destroy()
    ComWorker[Comlink.releaseProxy]()
    Worker.terminate()

    this.CONTAINER.innerHTML = ""
    this.CONTAINER.onwheel = null
    this.CONTAINER.onmousedown = null
    this.CONTAINER.onmouseup = null
    this.CONTAINER.onmousemove = null
    this.CONTAINER.onresize = null
    this.CONTAINER.onpointerdown = null
    this.CONTAINER.onpointerup = null
    this.CONTAINER.onpointermove = null
    this.CONTAINER.onpointercancel = null
    this.CONTAINER.onpointerleave = null
  }
}
