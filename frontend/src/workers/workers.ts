import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'
import geometry from '../renderer/geometry_math'

import * as PIXI from '@pixi/webworker'
import { PixiGerberApplication } from '../renderer'

let renderer: PixiGerberApplication

const workerMethods: WorkerMethods = {
  parserGerber(gerber: string): ImageTree {
    const syntaxTree = parse(gerber)
    console.log('syntaxTree', syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log('imagetree', imagetree)
    return imagetree
  },
  // Canvas must be transfered as an OffscreenCanvas 
  initRenderer(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>): void {
    renderer = new PixiGerberApplication({...options, view: canvas})
  },
  addGerber(name: string, gerber: string): void {
    renderer.addGerber(name, gerber)
  },
  addLayer(name: string, image: ImageTree): void {
    renderer.addLayer(name, image)
  },
  destroy(removeView?: boolean | undefined, stageOptions?: boolean | PIXI.IDestroyOptions | undefined): void {
    renderer.destroy(removeView, stageOptions)
  },
  moveViewport(x: number, y: number, scale: number): void {
    renderer.viewport.position.set(x, y)
    renderer.viewport.scale.set(scale)
    renderer.cullViewport()
  },
  getViewportBounds(): PIXI.Rectangle {
    return renderer.getViewportBounds()
  },
  getRendererBounds(): PIXI.Rectangle {
    return renderer.getRendererBounds()
  },
  cullViewport(force: boolean = false): void {
    renderer.cullViewport(force)
  },
  uncull(): void {
    renderer.cull.uncull()
  },
  resizeViewport(width: number, height: number): void {
    renderer.resizeViewport(width, height)
    renderer.cullViewport()
  },
  featuresAtPosition(x: number, y: number): any[] {
    return renderer.featuresAtPosition(x, y)
  },
  get rendererAvailable(): boolean{
    return renderer ? true : false
  },
  get renderer(): PixiGerberApplication {
    return Comlink.proxy(renderer)
  }
}

Object.assign(workerMethods, geometry)

Comlink.expose(workerMethods)

export interface WorkerMethods {
  initRenderer(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>): void
  addGerber(name: string, gerber: string): void
  addLayer(name: string, image: ImageTree): void
  parserGerber(gerber: string): ImageTree
  destroy(removeView?: boolean | undefined, stageOptions?: boolean | PIXI.IDestroyOptions | undefined): void
  moveViewport(x: number, y: number, scale: number): void
  getViewportBounds(): PIXI.Rectangle
  getRendererBounds(): PIXI.Rectangle
  cullViewport(force: boolean): void
  uncull(): void
  resizeViewport(width: number, height: number): void
  featuresAtPosition(x: number, y: number): any[]
  rendererAvailable: boolean
  renderer: PixiGerberApplication
}
