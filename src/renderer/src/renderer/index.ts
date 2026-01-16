import * as Comlink from "comlink"
import EngineWorker from "./engine/engine?worker"
import type { QuerySelection, Engine } from "./engine/engine"
import { PointerMode } from "./engine/types"
import cozetteFont from "./data/shape/text/cozette/CozetteVector.ttf?url"
import { fontInfo as cozetteFontInfo } from "./data/shape/text/cozette/font"
import { UID } from "./engine/utils"
import type { DataInterface } from "./data/interface"

export interface RenderEngineFrontendConfig {
  container?: HTMLElement
  attributes?: WebGLContextAttributes | undefined
}

interface PointerCoordinates {
  x: number
  y: number
}

export interface PointerSettings {
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

export class Renderer {
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
              // this.settings.SHOW_DATUMS = true
              this.engine.interface.set_engine_settings({ SHOW_DATUMS: true })
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

  public canvasGL: HTMLCanvasElement
  public managedViews: HTMLElement[] = []
  public readonly CONTAINER: HTMLElement

  public pointer: EventTarget = new EventTarget()
  private pointerCache: globalThis.PointerEvent[] = []

  private engineWorker: Worker
  public engine: Comlink.Remote<typeof Engine>
  public interface: Comlink.Remote<typeof DataInterface>

  constructor({ container, attributes }: RenderEngineFrontendConfig) {
    if (container == null) {
      container = this.createContainer()
    }
    this.CONTAINER = container

    this.canvasGL = this.createCanvas()

    const offscreenCanvasGL = this.canvasGL.transferControlToOffscreen()

    this.engineWorker = new EngineWorker()
    this.engine = Comlink.wrap<typeof Engine>(this.engineWorker)
    this.engine.init(Comlink.transfer(offscreenCanvasGL, [offscreenCanvasGL]), {
      attributes,
      container: this.CONTAINER.getBoundingClientRect(),
      // dpr: this.canvasSettings.dpr,
    }).then(() => {
      this.resize()
    })
    this.interface = this.engine.interface

    this.sendFontData()
    new ResizeObserver(() => this.resize()).observe(this.CONTAINER)
    this.engine.render()
    this.pollViews()
  }

  public addManagedView(view: HTMLElement, attributes: { project: string; step: string }): string {
    const { project, step } = attributes
    let id = UID()
    if (view.id == null || view.id === "") {
      view.id = id
    } else {
      id = view.id
    }
    this.managedViews.push(view)
    this.engine.interface.create_view(id, project, step, view.getBoundingClientRect())
    this.addControls(view)
    return id
  }

  private createContainer(): HTMLElement {
    const container = document.createElement("div")
    container.style.cursor = "auto"
    container.style.top = "0px"
    container.style.left = "0px"
    container.style.width = "100vw"
    container.style.height = "100vh"
    container.style.pointerEvents = "none"
    container.style.position = "absolute"
    document.body.append(container)
    return container
  }

  public removeManagedView(view: HTMLElement): void {
    this.managedViews.splice(this.managedViews.indexOf(view), 1)
  }

  public async onLoad(callback: () => void): Promise<void> {
    await this.engine.onLoad()
    callback()
  }

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
    this.engine.interface.update_engine_bounding_box(this.CONTAINER.getBoundingClientRect())
    this.managedViews.forEach((node) => {
      this.engine.interface.update_view_box_from_dom_rect(node.id, node.getBoundingClientRect())
    })
  }

  public async pollViews(): Promise<void> {
    this.resize()
    requestAnimationFrame(() => this.pollViews())
  }

  private async addControls(element: HTMLElement): Promise<void> {
    if (!element.id) {
      throw new Error("Element must have a 'id' attribute")
    }
    const engine = this.engine
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

    function getMouseCanvasCoordinates(e: MouseEvent): [number, number] {
      // Get the mouse position relative to the canvas
      const { x, y, height } = element.getBoundingClientRect()
      return [e.clientX - x, height - (e.clientY - y)]
    }

    const getMouseWorldCoordinates = async (element: HTMLElement, e: MouseEvent): Promise<[number, number]> => {
      if (!element.id) {
        throw new Error("Element must have a 'id' attribute")
      }

      // console.log(offsetX, offsetY, width, height)

      // really these functions are nested here as we should not have to deal with the coordinates of the canvas,
      // but rather the coordinates of the world
      // return this.engine.interface.read_world_position_from_dom_position(element.id, e.clientX, e.clientY)
      return this.engine.interface.read_world_position_from_canvas_position(element.id, ...getMouseCanvasCoordinates(e), 0)
      // return getMouseCanvasCoordinates(e)
    }

    const removePointerCache = (ev: globalThis.PointerEvent): void => {
      // Remove this event from the target's cache
      const index = this.pointerCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId)
      this.pointerCache.splice(index, 1)
    }

    await engine.interface.update_view_box_from_dom_rect(element.id, element.getBoundingClientRect())

    element.style.cursor = "grab"

    element.onwheel = async (e): Promise<void> => {
      const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
      const settings = await engine.interface.read_engine_settings()
      const moveScale = this.canvasSettings.dpr

      if (settings.ZOOM_TO_CURSOR) {
        // const [x, y] = await getMouseWorldCoordinates(element, e)
        // engine.interface.zoom_at_point(element.id, x, y, e.deltaY * moveScale)
        engine.interface.zoom_at_point(element.id, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, e.deltaY * moveScale)
      } else {
        engine.interface.zoom_at_point(element.id, width / 2, height / 2, e.deltaY * moveScale)
      }
    }
    element.onpointerdown = async (e): Promise<void> => {
      if (e.button == 2) return // ignore
      // console.log(e.button)
      if (e.button == 1 ) {
        // middle mouse button pressed
        const pointerModeBackup = this.pointerSettings.mode
        const cursorStyleBackup = element.style.cursor
        this.pointerSettings.mode = PointerMode.MOVE
        element.style.cursor = "grabbing"
        await engine.interface.view_pointer_grab(element.id)
        const onPointerUp = async (ev: PointerEvent): Promise<void> => {
          if (ev.detail.x === e.clientX && ev.detail.y === e.clientY) {
            element.style.cursor = "grab"
            await engine.interface.view_pointer_release(element.id)
            this.pointerSettings.mode = pointerModeBackup
            element.style.cursor = cursorStyleBackup
            element.removeEventListener("pointerup", onPointerUp as EventListener)
          }
        }
        element.addEventListener("pointerup", onPointerUp as EventListener)
        // this.pointerSettings.mode = pointerModeBackup
        // element.style.cursor = cursorStyleBackup
        return
      }
      sendPointerEvent(element, e, PointerEvents.POINTER_DOWN)
      // const [x, y] = await getMouseWorldCoordinates(element, e)
      const [xcanvas, ycanvas] = getMouseCanvasCoordinates(e)
      this.pointerCache.push(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grabbing"
        await engine.interface.view_pointer_grab(element.id)
      } else if (this.pointerSettings.mode === PointerMode.SELECT) {
        element.style.cursor = "wait"
        const features = await engine.interface.read_view_select(element.id, [xcanvas, ycanvas])
        // console.log("features", features)
        this.pointer.dispatchEvent(
          new CustomEvent<QuerySelection[]>(PointerEvents.POINTER_SELECT, {
            detail: features,
          }),
        )
        element.style.cursor = "crosshair"
      } else if (this.pointerSettings.mode === PointerMode.MEASURE) {
        element.style.cursor = "crosshair"
        const [x1, y1] = await getMouseWorldCoordinates(element, e)
        const currentMeasurement = await engine.interface.read_view_current_measurement(element.id)
        if (currentMeasurement != null) {
          engine.interface.finish_view_measurement(element.id, [x1, y1])
        } else {
          engine.interface.create_view_measurement(element.id, [x1, y1])
        }
      }
    }
    element.onpointerup = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      // const [x, y] = await this.getMouseWorldCoordinates(e)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        element.style.cursor = "grab"
        await engine.interface.view_pointer_release(element.id)
      }
      removePointerCache(e)
    }
    element.onpointercancel = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await engine.interface.view_pointer_release(element.id)
      }
      removePointerCache(e)
    }
    element.onpointerleave = async (e): Promise<void> => {
      sendPointerEvent(element, e, PointerEvents.POINTER_UP)
      if (this.pointerSettings.mode === PointerMode.MOVE) {
        await engine.interface.view_pointer_release(element.id)
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
        engine.interface.update_view_measurement(element.id, [x, y])
      }

      if (!(await engine.interface.read_pointer_grab(element.id))) {
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
          const settings = await engine.interface.read_engine_settings()
          const { x: offsetX, y: offsetY, width, height } = element.getBoundingClientRect()
          if (settings.ZOOM_TO_CURSOR) {
            engine.interface.zoom_at_point(element.id, (e.x - offsetX) * moveScale, (e.y - offsetY) * moveScale, zoomFactor * moveScale)
          } else {
            engine.interface.zoom_at_point(element.id, width / 2, height / 2, zoomFactor)
          }
          engine.interface.view_move(element.id, e.movementX / this.pointerCache.length, e.movementY / this.pointerCache.length)
        } else {
          if (e.buttons == 4) {
            await engine.interface.view_rotate(element.id, e.movementY * moveScale, e.movementX * moveScale)
          } else {
            await engine.interface.view_move(element.id, e.movementX * moveScale, e.movementY * moveScale)
          }
        }
      }
    }
    element.onkeydown = async (e): Promise<void> => {
      // if (e.key === 'Escape') {
      //   await engine.cancelMeasurement()
      //   this.pointerSettings.mode = 'move'
      //   element.style.cursor = 'grab'
      // }
      console.log(e.key)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isDragging = await engine.interface.read_pointer_grab(element.id)
        if (isDragging) return
        // this.engine.then((engine) => {
        // })
        engine.interface.view_pointer_grab(element.id)
        switch (e.key) {
          case "ArrowUp":
            engine.interface.view_move(element.id, 0, 10)
            break
          case "ArrowDown":
            engine.interface.view_move(element.id, 0, -10)
            break
          case "ArrowLeft":
            engine.interface.view_move(element.id, 10, 0)
            break
          case "ArrowRight":
            engine.interface.view_move(element.id, -10, 0)
            break
        }
        engine.interface.view_pointer_release(element.id)
      }
    }
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
      this.engine.initializeFontRenderer(imageData.data)

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

  // public async getStats(): Promise<Stats> {
  //   return this.engine.getStats()
  // }

  public async destroy(): Promise<void> {
    this.engine.destroy()
    this.engine[Comlink.releaseProxy]()
    this.engineWorker.terminate()

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
