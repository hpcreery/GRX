import * as Comlink from "comlink"
import EngineWorker from "./engine/engine?worker"
import type { QuerySelection, RenderEngineBackend, Stats } from "./engine/engine"
import { AddLayerProps } from "./engine/plugins"
import { PointerMode, SnapMode } from "./engine/types"

import type { GridSettings, RenderSettings } from "./engine/settings"
import cozetteFont from "./engine/step/layer/shape/text/cozette/CozetteVector.ttf?url"
import { fontInfo as cozetteFontInfo } from "./engine/step/layer/shape/text/cozette/font"
import { UID } from './engine/utils'

const Worker = new EngineWorker()
export const ComWorker = Comlink.wrap<typeof RenderEngineBackend>(Worker)

export interface RenderEngineFrontendConfig {
  container?: HTMLElement
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
  public grid: GridSettings = new Proxy(
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
          this.managedViews.forEach((viewElement) => {
            if (value === PointerMode.MOVE) viewElement.style.cursor = "grab"
            if (value === PointerMode.SELECT) viewElement.style.cursor = "crosshair"
            if (value === PointerMode.MEASURE) {
              viewElement.style.cursor = "crosshair"
              this.settings.SHOW_DATUMS = true
            }
          })
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
          this.resize()
        }
        target[name] = value
        return true
      },
    },
  )

  public managedViews: HTMLElement[] = []

  public readonly CONTAINER: HTMLElement
  public pointer: EventTarget = new EventTarget()
  private pointerCache: globalThis.PointerEvent[] = []
  public backend: Promise<Comlink.Remote<RenderEngineBackend>>
  public canvasGL: HTMLCanvasElement
  // public canvas2D: HTMLCanvasElement
  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    if (container == null) {
      container = document.createElement("div")
      container.style.cursor = "auto"
      // container.style.zIndex = "100"
      container.style.top = "0px"
      container.style.left = "0px"
      container.style.width = "100vw"
      container.style.height = "100vh"
      container.style.pointerEvents = "none"
      container.style.position = "absolute"
      // document.append(container)
      document.body.append(container)
    }
    this.CONTAINER = container

    this.canvasGL = this.createCanvas()
    // this.canvas2D = this.createCanvas()

    const offscreenCanvasGL = this.canvasGL.transferControlToOffscreen()
    // const offscreenCanvas2D = this.canvas2D.transferControlToOffscreen()

    this.backend = new ComWorker(Comlink.transfer(offscreenCanvasGL, [offscreenCanvasGL]), {
      attributes,
      container: this.CONTAINER.getBoundingClientRect(),
      // dpr: this.canvasSettings.dpr,
    })

    this.pollEmbeddedViews()
    this.sendFontData()
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    this.render()
    this.pollViews()
  }

  private pollEmbeddedViews(): void {
    this.backend.then((backend) => {
      const views = this.getEmbeddedViews()
      views.forEach(async (viewElement) => {
        const viewName = viewElement.getAttribute("view")
        if (viewName == null) {
          return
        }
        if (viewElement.id == undefined || viewElement.id === "") {
          viewElement.id = UID()
        }
        const viewExists = this.managedViews.find((view) => view.id === viewElement.id)
        if (viewExists) return
        await backend.addView(viewElement.id, viewName, viewElement.getBoundingClientRect())
        await this.addControls(viewElement)
        this.managedViews.push(viewElement)
      })
    })
  }

  public addManagedView(view: HTMLElement, name: string, id: string = UID()): void {
    view.setAttribute("view", name)
    if (view.id == null || view.id === "") {
      view.id = id
    } else {
      id = view.id
    }
    this.managedViews.push(view)
    this.backend.then(async (backend) => {
      await backend.addView(id, name, view.getBoundingClientRect())
      await this.addControls(view)
    })
  }

  public removeManagedView(view: HTMLElement): void {
    this.managedViews.splice(this.managedViews.indexOf(view), 1)
  }

  public getEmbeddedViews(): HTMLElement[] {
    const views = this.CONTAINER.querySelectorAll("[view]")
    const HTMLViews: HTMLElement[] = []
    views.forEach((viewElement) => {
      if (!(viewElement instanceof HTMLElement)) return
      const viewName = viewElement.getAttribute("view")
      if (viewName == null) return
      HTMLViews.push(viewElement)
    })
    return HTMLViews
  }

  public async onLoad(cb: () => void): Promise<void> {
    await this.backend
    cb()
  }

  // private updateViewboxes() {
  //   // const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
  //   const { x: containerOffsetX, y: containerOffsetY, width: _containerWidth, height: containerHeight } = this.CONTAINER.getBoundingClientRect()
  //   const viewbox = element.getBoundingClientRect()
  //   viewbox.y = containerHeight - viewbox.bottom + containerOffsetY
  //   viewbox.x = viewbox.x - containerOffsetX
  //   await backend.updateViewBox(view, viewbox)
  // }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = this.CONTAINER.clientWidth
    canvas.height = this.CONTAINER.clientHeight

    canvas.style.width = String(this.CONTAINER.clientWidth) + "px"
    canvas.style.height = String(this.CONTAINER.clientHeight) + "px"
    canvas.style.position = "absolute"
    // canvas.style.border = "1px solid white"
    canvas.style.top = "0px"
    canvas.style.left = "0px"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "100"
    this.CONTAINER.appendChild(canvas)
    return canvas
  }

  private resize(): void {
    const { width, height } = this.CONTAINER.getBoundingClientRect()

    this.canvasGL.style.width = String(width) + "px"
    this.canvasGL.style.height = String(height) + "px"
    // this.canvasGL.style.zIndex = "1"
    // console.log("resize", JSON.stringify(this.canvas2D.style.width))

    this.backend.then((engine) => {
      engine.updateBoundingBox(this.CONTAINER.getBoundingClientRect())
    })

    this.backend.then((backend) => {
      this.managedViews.forEach(async (node) => {
        await backend.updateViewBox(node.id, node.getBoundingClientRect())
      })
    })
  }

  // public async zoomFit(view: string): Promise<void> {
  //   const backend = await this.backend
  //   backend.zoomFit(view)
  // }

  public async pollViews(): Promise<void> {
    // const views = this.getViews()
    // setTimeout
    this.resize()
    requestAnimationFrame(() => this.pollViews())
  }

  private async addControls(element: HTMLElement): Promise<void> {
    if (!element.id) {
      throw new Error("Element must have a 'id' attribute")
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
      if (!element.id) {
        throw new Error("Element must have a 'id' attribute")
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
      return backend.getWorldPosition(element.id, ...getMouseNormalizedWorldCoordinates(e))
    }

    const removePointerCache = (ev: globalThis.PointerEvent): void => {
      // Remove this event from the target's cache
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId)
      this.pointerCache.splice(index, 1)
    }

    await backend.updateViewBox(element.id, element.getBoundingClientRect())

    element.style.cursor = "grab"

    element.onwheel = async (e): Promise<void> => {
      const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
      const settings = await backend.getSettings()
      const moveScale = this.canvasSettings.dpr

      if (settings.ZOOM_TO_CURSOR) {
        backend.zoomAtPoint(element.id, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, e.deltaY * moveScale)
      } else {
        backend.zoomAtPoint(element.id, width / 2 + offsetX, height / 2 + offsetY, e.deltaY * moveScale)
      }
    }
    element.onpointerdown = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_DOWN)
      const [x, y] = await getMouseWorldCoordinates(element, e)
      this.pointerCache.push(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grabbing"
        await backend.grabViewport(element.id)
      } else if (this.pointerSettings.mode === PointerMode.SELECT) {
        element.style.cursor = "wait"
        const features = await backend.select(element.id, [x, y])
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
        const currentMeasurement = await backend.getCurrentMeasurement(element.id)
        if (currentMeasurement != null) {
          backend.finishMeasurement(element.id, [x1, y1])
        } else {
          backend.addMeasurement(element.id, [x1, y1])
        }
      }
    }
    element.onpointerup = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      // const [x, y] = await this.getMouseWorldCoordinates(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grab"
        await backend.releaseViewport(element.id)
      }
      removePointerCache(e)
    }
    element.onpointercancel = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await backend.releaseViewport(element.id)
      }
      removePointerCache(e)
    }
    element.onpointerleave = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await backend.releaseViewport(element.id)
      }
      removePointerCache(e)
    }
    element.onpointerenter = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_HOVER)
    }
    element.onpointermove = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_MOVE)
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId)
      this.pointerCache[index] = e
      const moveScale = this.canvasSettings.dpr

      if (this.pointerSettings.mode === PointerMode.MEASURE) {
        element.style.cursor = "crosshair"
        const [x, y] = await getMouseWorldCoordinates(element, e)
        backend.updateMeasurement(element.id, [x, y])
      }

      if (!(await backend.isDragging(element.id))) {
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
            backend.zoomAtPoint(element.id, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, zoomFactor * moveScale)
          } else {
            backend.zoomAtPoint(element.id, width / 2, height / 2, zoomFactor)
          }
          backend.moveViewport(element.id, e.movementX / this.pointerCache.length, e.movementY / this.pointerCache.length)
        } else {
          await backend.moveViewport(element.id, e.movementX * moveScale, e.movementY * moveScale)
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
        const isDragging = await backend.isDragging(element.id)
        if (isDragging) return
        this.backend.then((engine) => {
          engine.grabViewport(element.id)
          switch (e.key) {
            case "ArrowUp":
              engine.moveViewport(element.id, 0, 10)
              break
            case "ArrowDown":
              engine.moveViewport(element.id, 0, -10)
              break
            case "ArrowLeft":
              engine.moveViewport(element.id, 10, 0)
              break
            case "ArrowRight":
              engine.moveViewport(element.id, -10, 0)
              break
          }
          engine.releaseViewport(element.id)
        })
      }
    }
  }

  /**
   * @deprecated will move to backend datamodel
   */
  public async addLayer(view: string, params: AddLayerProps): Promise<void> {
    const backend = await this.backend
    backend.addLayer(view, params)
  }

  /**
   * @deprecated will move to backend datamodel
   */
  public async addFile(view: string, params: { buffer: ArrayBuffer; format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    const backend = await this.backend
    backend.addFile(view, params)
  }

  public async render(): Promise<void> {
    const backend = await this.backend
    backend.render()
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

  /**
   * TODO: Make download image only download a certain view
   */
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
