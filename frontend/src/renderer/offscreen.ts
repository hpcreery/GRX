import { Viewport as VirtualViewport } from '@hpcreery/pixi-viewport'
import * as PIXI from 'pixi.js'

import * as Comlink from 'comlink'
/* eslint-disable import/no-webpack-loader-syntax */
import gerberRendererWorker from 'worker-loader!../workers/workers'
import type { WorkerMethods as GerberRendererWorker } from '../workers/workers'
import type { PixiGerberApplication } from '.'

export interface OffscreenGerberApplicationProps {
  element: HTMLElement
  antialias?: boolean
  backgroundColor?: PIXI.ColorSource
}

export default class OffscreenGerberApplication {
  private element: HTMLElement
  private canvas: HTMLCanvasElement
  private resizeObserver: ResizeObserver
  public virtualAppliction: PIXI.Application
  public virtualViewport: VirtualViewport
  public worker: Comlink.Remote<GerberRendererWorker>
  public renderer: Promise<PixiGerberApplication>
  constructor(optionsMeta: OffscreenGerberApplicationProps) {
    let { element, ...options } = optionsMeta
    Object.assign(options, {
      width: element.clientWidth,
      height: element.clientHeight,
    })
    this.element = element
    this.canvas = document.createElement('canvas')
    this.element.appendChild(this.canvas)
    const offscreenCanvas = this.canvas.transferControlToOffscreen()

    // Create virtual PIXI application
    this.virtualAppliction = new PIXI.Application({
      width: element.clientWidth,
      height: element.clientHeight,
      autoDensity: false,
    })

    // Create virtual viewport and add to virtual PIXI application
    // The purpose of the virtual viewport is to provide a viewport that is attached not to the DOM but to the virtual PIXI application
    // events are then passed to the real viewport
    this.virtualViewport = new VirtualViewport({
      worldWidth: 1000,
      worldHeight: 1000,
      screenWidth: element.clientWidth,
      screenHeight: element.clientHeight,
      canvasElement: this.canvas,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      .decelerate()

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

  public async moveViewport(): Promise<void> {
    let x = this.virtualViewport.x
    let y = this.virtualViewport.y
    let scale = this.virtualViewport.scale.x
    await this.worker.moveViewport(x, y, scale)
  }

  public async zoomHome() {
    this.worker.uncull()
    const rendererBounds = await this.worker.getRendererBounds()
    const bounds = await this.worker.getViewportBounds()
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
      y: rendererBounds.height / 2 - (bounds.y + bounds.height / 2) * scale,
    }
    await this.moveViewport()
  }

  public async zoom(pixels: number): Promise<void> {
    this.virtualViewport.zoom(pixels, true)
    await this.moveViewport()
  }

  public async addGerber(name: string, gerber: string): Promise<void> {
    const thread = Comlink.wrap<GerberRendererWorker>(new gerberRendererWorker())
    const image = await thread.parserGerber(gerber)
    thread[Comlink.releaseProxy]()
    await this.worker.addLayer(name, image)
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
