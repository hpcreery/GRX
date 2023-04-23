import { Viewport as VirtualViewport } from '@hpcreery/pixi-viewport'
import * as PIXI from 'pixi.js'

import '@pixi/unsafe-eval'

import * as Comlink from 'comlink'
import gerberRendererWorker from '../workers/gerber_app?worker'
import type { PixiGerberApplicationWorker } from '../workers/gerber_app'
import { PixiGerberApplication } from '.'

export interface ScreenGerberApplicationProps extends OffscreenGerberPixiProps {
  element: HTMLElement
}

interface OffscreenGerberPixiProps {
  antialias?: boolean
  backgroundColor?: PIXI.ColorSource
}

interface PointerCoordinates {
  x: number
  y: number
}

export type PointerEvent = CustomEvent<PointerCoordinates>

export default class VirtualGerberApplication {
  private element: HTMLElement
  private canvas: HTMLCanvasElement
  private resizeObserver: ResizeObserver
  private origin?: { x: number; y: number }
  public virtualApplication: PIXI.Application
  public virtualViewport: VirtualViewport
  public renderer: Promise<Comlink.Remote<PixiGerberApplication>> // | Promise<PixiGerberApplication>
  public pointer: EventTarget
  constructor(optionsMeta: ScreenGerberApplicationProps) {
    // super()
    const { element, ...options } = optionsMeta
    Object.assign(options, {
      width: element.clientWidth,
      height: element.clientHeight
    })
    this.element = element
    this.canvas = document.createElement('canvas')
    this.element.appendChild(this.canvas)

    // Create virtual PIXI application
    this.virtualApplication = new PIXI.Application({
      width: element.clientWidth,
      height: element.clientHeight,
      autoDensity: false
    })

    // Create virtual viewport and add to virtual PIXI application
    // The purpose of the virtual viewport is to provide a viewport that is attached not to the DOM but to the virtual PIXI application
    // events are then passed to the real viewport
    this.virtualViewport = new VirtualViewport({
      worldWidth: 1000,
      worldHeight: 1000,
      screenWidth: element.clientWidth,
      screenHeight: element.clientHeight,
      canvasElement: this.canvas
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      .decelerate()

    this.virtualApplication.stage.addChild(this.virtualViewport)

    // if (true) {
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    const worker = Comlink.wrap<typeof PixiGerberApplicationWorker>(new gerberRendererWorker())
    this.renderer = new worker(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), options)
    // } else {
    //   this.renderer = new Promise<PixiGerberApplication>((resolve) =>
    //     resolve(new OnscreenPixiGerberApplicationWrapper(this.canvas, options))
    //   )
    // }

    this.renderer.then(async (renderer) => {
      this.origin = await renderer.getOrigin()
    })

    // Adapt viewport to div size
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      this.virtualViewport.resize(width, height)
      this.virtualApplication.renderer.resize(width, height)
      // this.worker.resizeViewport(width, height)
      this.renderer.then((renderer) => {
        renderer.resizeViewport(width, height)
      })
    })
    this.resizeObserver.observe(element as HTMLElement)

    this.pointer = new EventTarget()

    // Listen to viewport events and pass them to the real viewport
    this.virtualViewport.on('moved', () => {
      this.moveViewport()
    })

    this.virtualViewport.on('clicked', async (e) => {
      const renderer = await this.renderer
      const intersected = await renderer.featuresAtPosition(e.screen.x, e.screen.y)
      if (
        e.event instanceof MouseEvent ||
        e.event instanceof TouchEvent ||
        e.event instanceof PointerEvent
      ) {
        const { x, y } = this.getPosition(e.event)
        this.pointer.dispatchEvent(
          new CustomEvent<PointerCoordinates>('pointerdown', { detail: { x, y } })
        )
      }
      console.log(intersected)
    })

    this.virtualViewport.on('pointermove', async (e) => {
      if (!this.origin) return
      const { x, y } = this.getPosition(e)
      this.pointer.dispatchEvent(
        new CustomEvent<PointerCoordinates>('pointermove', { detail: { x, y } })
      )
    })

    // this.virtualViewport.addEventListener('contextmenu', (e) => {
    //   console.log('contextmenu')
    //   if (e instanceof MouseEvent) {
    //     console.log(e.clientX, e.clientY)
    //     this.renderer.featuresAtPosition(e.clientX, e.clientY)
    //   }
    // })
  }

  private getPosition(e: MouseEvent | TouchEvent | PointerEvent | PIXI.FederatedPointerEvent): {
    x: number
    y: number
  } {
    let px: number
    let py: number
    if (
      e instanceof MouseEvent ||
      e instanceof PointerEvent ||
      e instanceof PIXI.FederatedPointerEvent
    ) {
      px = e.clientX
      py = e.clientY
    } else if (e instanceof TouchEvent) {
      px = e.touches[0].clientX
      py = e.touches[0].clientY
      // e.preventDefault()
    } else {
      throw new Error('Unknown event type')
    }
    if (!this.origin) return { x: 0, y: 0 }
    const scale = this.virtualViewport.scale.x
    const xOffset = this.virtualViewport.x
    const yOffset = this.virtualViewport.y
    const x = ((px - xOffset) / scale - this.origin.x) * 10
    const y = -((py - yOffset) / scale - this.origin.y) * 10
    // console.log(x, y)
    return { x, y }
  }

  public async moveViewport(): Promise<void> {
    const x = this.virtualViewport.x
    const y = this.virtualViewport.y
    const scale = this.virtualViewport.scale.x
    const renderer = await this.renderer
    await renderer.moveViewport(x, y, scale)
    // this.emit('moved', { x, y, scale })
  }

  public async zoomHome(): Promise<void> {
    const renderer = await this.renderer
    await renderer.uncull()
    const rendererBounds = await renderer.getRendererBounds()
    const bounds = await renderer.getViewportBounds()
    if (bounds.width === 0 || bounds.height === 0) {
      return
    }
    const scale = Math.min(
      rendererBounds.width / bounds.width,
      rendererBounds.height / bounds.height
    )
    this.virtualViewport.scale = { x: scale, y: scale }
    this.virtualViewport.position = {
      x: rendererBounds.width / 2 - (bounds.x + bounds.width / 2) * scale,
      y: rendererBounds.height / 2 - (bounds.y + bounds.height / 2) * scale
    }
    await this.moveViewport()
  }

  public async zoom(pixels: number): Promise<void> {
    this.virtualViewport.zoom(pixels, true)
    await this.moveViewport()
  }

  public async destroy(): Promise<void> {
    this.resizeObserver.disconnect()
    this.element.removeChild(this.canvas)
    this.virtualApplication.destroy(true)
    this.virtualViewport.removeAllListeners()
    this.virtualViewport.destroy()
    const renderer = await this.renderer
    renderer.destroy(true)
    renderer[Comlink.releaseProxy]()
  }
}

// class OnscreenPixiGerberApplicationWrapper extends PixiGerberApplication {
//   constructor(canvas: HTMLCanvasElement, options?: Partial<PIXI.IApplicationOptions>) {
//     super({ ...options, view: canvas })
//   }
// }
