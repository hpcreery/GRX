import * as PIXI_Viewport from '@hpcreery/pixi-viewport'
import * as PIXI from 'pixi.js'

import * as Comlink from 'comlink'
/* eslint-disable import/no-webpack-loader-syntax */
import gerberRendererWorker from 'worker-loader!../workers/workers'
import type { WorkerMethods as GerberRendererWorker } from '../workers/workers'

class VirtualViewport extends PIXI_Viewport.Viewport {
  public virtualDirty: boolean
  constructor(options: PIXI_Viewport.IViewportOptions) {
    super(options)
    this.virtualDirty = false
  }
}

export default class OffscreenGerberApplication {
  private element: HTMLElement
  private canvas: HTMLCanvasElement
  private virtualAppliction: PIXI.Application
  private virtualViewport: VirtualViewport
  private renderer: Comlink.Remote<GerberRendererWorker>
  private resizeObserver: ResizeObserver
  constructor(optionsMeta: Partial<PIXI.IApplicationOptions> & { element: HTMLElement }) {
    let { element, ...options } = optionsMeta
    this.element = element
    this.canvas = document.createElement('canvas')
    this.element.appendChild(this.canvas)
    const offscreenCanvas = this.canvas.transferControlToOffscreen()

    // Create virtual PIXI application
    this.virtualAppliction = new PIXI.Application({
      width: options?.width,
      height: options?.height,
      autoDensity: false,
      resolution: options?.resolution,
    })

    // Create virtual viewport and add to virtual PIXI application
    // The purpose of the virtual viewport is to provide a viewport that is attached not to the DOM but to the virtual PIXI application
    // events are then passed to the real viewport
    // @ts-ignore
    this.virtualViewport = new VirtualViewport({
      worldWidth: 100,
      worldHeight: 100,
      screenWidth: options?.width,
      screenHeight: options?.height,
      canvasElement: this.canvas,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()

    this.virtualAppliction.stage.addChild(this.virtualViewport)

    this.renderer = Comlink.wrap<GerberRendererWorker>(new gerberRendererWorker())
    //await
    this.renderer.initRenderer(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), options)

    // Adapt viewport to div size
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      this.virtualViewport.resize(width, height)
      this.virtualAppliction.renderer.resize(width, height)
      this.renderer.resizeViewport(width, height)
      this.cullViewport()
    })
    this.resizeObserver.observe(element as HTMLElement)

    // listen to viewport events and pass them to the real viewport
    this.virtualViewport.on('moved', (e) => {
      this.moveViewport()
      if (!this.virtualViewport.virtualDirty) {
        this.cullViewport()
      }
    })
  }

  async moveViewport(): Promise<void> {
    let x = this.virtualViewport.x
    let y = this.virtualViewport.y
    let scale = this.virtualViewport.scale.x
    await this.renderer.moveViewport(x, y, scale)
  }

  async cullViewport(): Promise<void> {
    this.virtualViewport.virtualDirty = true
    await this.renderer.cullViewport()
    setTimeout(() => {
      this.virtualViewport.virtualDirty = false
    }, 50)
  }

  async addGerber(gerber: string): Promise<void> {
    const thread = Comlink.wrap<GerberRendererWorker>(new gerberRendererWorker())
    const image = await thread.parserGerber(gerber)
    await this.renderer.addLayer(image)
  }

  destroy(): void {
    this.resizeObserver.disconnect()
    this.element.removeChild(this.canvas)
    this.virtualViewport.removeAllListeners()
    this.virtualAppliction.destroy(true)
    this.virtualViewport.destroy()
    this.renderer.destroy(true)
  }
}
