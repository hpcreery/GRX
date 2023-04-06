import { Viewport as VirtualViewport } from '@hpcreery/pixi-viewport'
import * as PIXI from 'pixi.js'

import * as Comlink from 'comlink'
/* eslint-disable import/no-webpack-loader-syntax */
import gerberRendererWorker from 'worker-loader!../workers/workers'
import type { WorkerMethods as GerberRendererWorker } from '../workers/workers'
import type { PixiGerberApplication } from '.'

export default class OffscreenGerberApplication {
  private element: HTMLElement
  private canvas: HTMLCanvasElement
  private virtualAppliction: PIXI.Application
  private virtualViewport: VirtualViewport
  private resizeObserver: ResizeObserver
  public worker: Comlink.Remote<GerberRendererWorker>
  public renderer: Promise<PixiGerberApplication>
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
    this.virtualViewport = new VirtualViewport({
      worldWidth: 1000,
      worldHeight: 1000,
      screenWidth: options?.width,
      screenHeight: options?.height,
      canvasElement: this.canvas,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()

    this.virtualAppliction.stage.addChild(this.virtualViewport)

    this.worker = Comlink.wrap<GerberRendererWorker>(new gerberRendererWorker())
    //await
    this.worker.initRenderer(Comlink.transfer(offscreenCanvas, [offscreenCanvas]), options)
    this.renderer = this.worker.renderer

    // Adapt viewport to div size
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      this.virtualViewport.resize(width, height)
      this.virtualAppliction.renderer.resize(width, height)
      // this.worker.resizeViewport(width, height)
      this.renderer.then((renderer) => {
        renderer.resizeViewport(width, height)
      })
    })
    this.resizeObserver.observe(element as HTMLElement)

    // Listen to viewport events and pass them to the real viewport
    this.virtualViewport.on('moved', (e) => {
      this.moveViewport()
    })

    this.virtualViewport.on('clicked', async (e) => {
      let intersected = await this.worker.featuresAtPosition(e.screen.x, e.screen.y)
      console.log(intersected)
    })

    // this.virtualViewport.addEventListener('contextmenu', (e) => {
    //   console.log('contextmenu')
    //   if (e instanceof MouseEvent) {
    //     console.log(e.clientX, e.clientY)
    //     this.renderer.featuresAtPosition(e.clientX, e.clientY)
    //   }
    // })
  }

  private async moveViewport(): Promise<void> {
    let x = this.virtualViewport.x
    let y = this.virtualViewport.y
    let scale = this.virtualViewport.scale.x
    await this.worker.moveViewport(x, y, scale)
  }

  public async addGerber(gerber: string): Promise<void> {
    const thread = Comlink.wrap<GerberRendererWorker>(new gerberRendererWorker())
    const image = await thread.parserGerber(gerber)
    thread[Comlink.releaseProxy]()
    await this.worker.addLayer(image)
  }

  public destroy(): void {
    this.resizeObserver.disconnect()
    this.element.removeChild(this.canvas)
    this.virtualAppliction.destroy(true)
    this.virtualViewport.removeAllListeners()
    this.virtualViewport.destroy()
    this.worker.destroy(true)
    this.worker[Comlink.releaseProxy]()
  }
}
