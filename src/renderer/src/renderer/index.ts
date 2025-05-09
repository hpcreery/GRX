import * as Comlink from "comlink"
import EngineWorker from "./engine?worker"
import type { QuerySelection, RenderEngineBackend, RenderProps, Stats } from "./engine"
import { AddLayerProps } from "./plugins"
import { PointerMode, SnapMode } from "./types"

import type { GridRenderProps, RenderSettings } from "./settings"
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
  // mode: "move" | "select" | "measure"
  mode: PointerMode
}

export interface CanvasSettings {
  hidpi: boolean
  dpr: number
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
      SKELETON_MODE: false,
      SNAP_MODE: SnapMode.EDGE,
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
          // engine.settings[name] = value
          engine.setSettings({ [name]: value })
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
          // engine.grid[name] = value
          engine.setGrid({ [name]: value })
        })
        target[name] = value
        return true
      },
    },
  )
  public pointerSettings: PointerSettings = new Proxy(
    {
      mode: PointerMode.MOVE,
    },
    {
      set: (target, name, value): boolean => {
        if (name === "mode") {
          if (value === PointerMode.MOVE) this.CONTAINER.style.cursor = "grab"
          if (value === PointerMode.SELECT) this.CONTAINER.style.cursor = "crosshair"
          if (value === PointerMode.MEASURE) {
            this.CONTAINER.style.cursor = "crosshair"
            this.settings.SHOW_DATUMS = true
          }
        }
        target[name] = value
        return true
      },
    },
  )

  public canvasSettings: CanvasSettings = new Proxy(
    {
      hidpi: false,

      get dpr(): number {
        return this.hidpi ? window.devicePixelRatio : 1
      },
    },
    {
      set: (target, name, value): boolean => {
        if (name === "hidpi") {
          console.log("hidpi", value)
          this.resize()
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
      dpr: this.canvasSettings.dpr,
    })
    this.backend.then((backend) => {
      this.CONTAINER.childNodes.forEach(async (node) => {
        // change cursor style of each child node
        // node.style.cursor = "grab"
        if (node instanceof HTMLElement) {
          // node.style.cursor = "crosshair"
          const step = node.getAttribute("step")
          // console.log("Step", step)
          if (step) {
            await backend.addStep(step, node.getBoundingClientRect())
            await this.addControls(node)
          }
        }
      })
    })
    this.sendFontData()
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    // this.addControls(this.CONTAINER)
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

    canvas.style.width = String(this.CONTAINER.clientWidth) + "px"
    canvas.style.height = String(this.CONTAINER.clientHeight) + "px"
    canvas.style.position = "absolute"
    canvas.style.border = "1px solid white"
    canvas.style.position = "abolute"
    canvas.style.top = "0px"
    canvas.style.left = "0px"
    // console.log("createCanvas", JSON.stringify(canvas.style.width))
    this.CONTAINER.appendChild(canvas)
    // this.CONTAINER.prepend(canvas)
    return canvas
  }

  private resize(): void {
    const width = this.CONTAINER.clientWidth
    const height = this.CONTAINER.clientHeight

    this.canvas2D.style.width = String(width) + "px"
    this.canvas2D.style.height = String(height) + "px"
    this.canvasGL.style.width = String(width) + "px"
    this.canvasGL.style.height = String(height) + "px"
    // console.log("resize", JSON.stringify(this.canvas2D.style.width))

    this.backend.then((engine) => {
      engine.resize(width, height, this.canvasSettings.dpr)
    })
  }

  public async zoomFit(step: string): Promise<void> {
    const backend = await this.backend
    backend.zoomFit(step)
  }

  private async addControls(element: HTMLElement): Promise<void> {
    const step = element.getAttribute("step")
    if (!step) {
      throw new Error("Element must have a 'step' attribute")
    }
    const backend = await this.backend
    const sendPointerEvent = async (
      element: HTMLElement,
      mouse: MouseEvent,
      event_type: (typeof PointerEvents)[keyof typeof PointerEvents],
    ): Promise<void> => {
      const [x, y] = await getMouseWorldCoordinates(element, mouse)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>(event_type, {
          detail: { x, y },
        }),
      )
    }

    const getMouseWorldCoordinates = async (element: HTMLElement, e: MouseEvent): Promise<[number, number]> => {
      const step = element.getAttribute("step")
      if (!step) {
        throw new Error("Element must have a 'step' attribute")
      }
      const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()

      // console.log(offsetX, offsetY, width, height)

      // really these functions are nested here as we should not have to deal with the coordinates of the canvas,
      // but rather the coordinates of the world
      function getMouseCanvasCoordinates(e: MouseEvent): [number, number] {
        // Get the mouse position relative to the canvas
        return [e.clientX - offsetX, height - (e.clientY - offsetY)]
      }

      function getMouseNormalizedWorldCoordinates(e: MouseEvent): [number, number] {
        // const { width, height } = this.CONTAINER.getBoundingClientRect()
        const mouse_element_pos = getMouseCanvasCoordinates(e)
        // console.log(mouse_element_pos)

        // Normalize the mouse position to the canvas
        const mouse_normalize_pos = [mouse_element_pos[0] / width, mouse_element_pos[1] / height] as [number, number]
        // mouse_normalize_pos[0] = x value from 0 to 1 ( left to right ) of the canvas
        // mouse_normalize_pos[1] = y value from 0 to 1 ( bottom to top ) of the canvas

        return mouse_normalize_pos
      }

      const backend = await this.backend
      return backend.getWorldPosition(step, ...getMouseNormalizedWorldCoordinates(e))
    }

    const removePointerCache = (ev: globalThis.PointerEvent): void => {
      // Remove this event from the target's cache
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId)
      this.pointerCache.splice(index, 1)
    }
    const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
    const { x: containerOffsetX, y: containerOffsetY, width: _containerWidth, height: _containerHeight } = this.CONTAINER.getBoundingClientRect()
    const viewbox = element.getBoundingClientRect()
    viewbox.y = _containerHeight - viewbox.bottom + containerOffsetY
    viewbox.x = viewbox.x - containerOffsetX
    await backend.updateViewBox(step, viewbox)

    element.onwheel = async (e): Promise<void> => {
      const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
      const { x: containerOffsetX, y: containerOffsetY, width: _containerWidth, height: _containerHeight } = this.CONTAINER.getBoundingClientRect()

      // const viewbox = element.getBoundingClientRect()
      // viewbox.y = _containerHeight - viewbox.bottom + containerOffsetY
      // viewbox.x = viewbox.x - containerOffsetX
      // await backend.updateViewBox(step, viewbox)
      const settings = await backend.getSettings()
      const moveScale = this.canvasSettings.dpr

      if (settings.ZOOM_TO_CURSOR) {
        backend.zoomAtPoint(step, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, e.deltaY * moveScale)
      } else {
        backend.zoomAtPoint(step, width / 2 + offsetX, height / 2 + offsetY, e.deltaY * moveScale)
      }
    }
    element.onpointerdown = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_DOWN)
      const [x, y] = await getMouseWorldCoordinates(element, e)
      this.pointerCache.push(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grabbing"
        await backend.grabViewport(step)
      } else if (this.pointerSettings.mode === PointerMode.SELECT) {
        element.style.cursor = "wait"
        const features = await backend.select(step, [x, y])
        console.log("features", features)
        this.pointer.dispatchEvent(
          new CustomEvent<QuerySelection[]>(PointerEvents.POINTER_SELECT, {
            detail: features,
          }),
        )
        element.style.cursor = "crosshair"
      } else if (this.pointerSettings.mode === PointerMode.MEASURE) {
        element.style.cursor = "crosshair"
        const [x1, y1] = await getMouseWorldCoordinates(element, e)
        const currentMeasurement = await backend.getCurrentMeasurement(step)
        if (currentMeasurement != null) {
          backend.finishMeasurement(step, [x1, y1])
        } else {
          backend.addMeasurement(step, [x1, y1])
        }
      }
    }
    element.onpointerup = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      // const [x, y] = await this.getMouseWorldCoordinates(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grab"
        await backend.releaseViewport(step)
      }
      removePointerCache(e)
    }
    element.onpointercancel = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await backend.releaseViewport(step)
      }
      removePointerCache(e)
    }
    element.onpointerleave = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await backend.releaseViewport(step)
      }
      removePointerCache(e)
    }
    element.onpointermove = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_MOVE)
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId)
      this.pointerCache[index] = e
      const moveScale = this.canvasSettings.dpr

      if (this.pointerSettings.mode === PointerMode.MEASURE) {
        element.style.cursor = "crosshair"
        const [x, y] = await getMouseWorldCoordinates(element, e)
        backend.updateMeasurement(step, [x, y])
      }

      if (!(await backend.isDragging(step))) {
        await sendPointerEvent(element, e, PointerEvents.POINTER_HOVER)
        return
      }

      if (this.pointerSettings.mode === PointerMode.MOVE) {
        // If more than 2 pointers are down, check for pinch gestures
        if (this.pointerCache.length >= 2) {
          const p1 = this.pointerCache[0]
          const p2 = this.pointerCache[1]
          const startDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY)
          const endDistance = Math.hypot(
            p1.clientX + p1.movementX - (p2.clientX + p2.movementX),
            p1.clientY + p1.movementY - (p2.clientY + p2.movementY),
          )
          const zoomFactor = ((startDistance - endDistance) / this.pointerCache.length) * moveScale
          const settings = await backend.getSettings()
          const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
          if (settings.ZOOM_TO_CURSOR) {
            backend.zoomAtPoint(step, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, zoomFactor * moveScale)
          } else {
            backend.zoomAtPoint(step, width / 2, height / 2, zoomFactor)
          }
          backend.moveViewport(step, e.movementX / this.pointerCache.length, e.movementY / this.pointerCache.length)
        } else {
          await backend.moveViewport(step, e.movementX * moveScale, e.movementY * moveScale)
        }
      }
    }
    element.onkeydown = async (e): Promise<void> => {
      // if (e.key === 'Escape') {
      //   await backend.cancelMeasurement()
      //   this.pointerSettings.mode = 'move'
      //   element.style.cursor = 'grab'
      // }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isDragging = await backend.isDragging(step)
        if (isDragging) return
        this.backend.then((engine) => {
          engine.grabViewport(step)
          switch (e.key) {
            case "ArrowUp":
              engine.moveViewport(step, 0, 10)
              break
            case "ArrowDown":
              engine.moveViewport(step, 0, -10)
              break
            case "ArrowLeft":
              engine.moveViewport(step, 10, 0)
              break
            case "ArrowRight":
              engine.moveViewport(step, -10, 0)
              break
          }
          engine.releaseViewport(step)
        })
      }
    }
  }

  public async addLayer(step: string, params: AddLayerProps): Promise<void> {
    const backend = await this.backend
    backend.addLayer(step, params)
  }

  public async addFile(step: string, params: { buffer: ArrayBuffer; format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    const backend = await this.backend
    backend.addFile(step, params)
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

  public async getStats(): Promise<Stats> {
    const backend = await this.backend
    return backend.getStats()
  }

  public async destroy(): Promise<void> {
    const backend = await this.backend
    backend.destroy()
    ComWorker[Comlink.releaseProxy]()
    Worker.terminate()

    this.CONTAINER.childNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.onwheel = null
        node.onmousedown = null
        node.onmouseup = null
        node.onmousemove = null
        node.onresize = null
        node.onpointerdown = null
        node.onpointerup = null
        node.onpointermove = null
        node.onpointercancel = null
        node.onpointerleave = null
        node.remove()
      }
    })

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
