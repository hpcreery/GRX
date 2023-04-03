import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import * as PIXI from '@pixi/webworker'
import { PixiGerberApplication } from '../renderer'

let renderer: PixiGerberApplication

const workerMethods: WorkerMethods = {
  parserGerber(gerber: string): ImageTree {
    const syntaxTree = parse(gerber)
    const imagetree = plot(syntaxTree)
    return imagetree
  },
  // Canvas must be transfered as an OffscreenCanvas 
  initRenderer(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>): void {
    renderer = new PixiGerberApplication({...options, view: canvas})
  },
  addGerber(gerber: string): void {
    renderer.addGerber(gerber)
  },
  addLayer(image: ImageTree): void {
    renderer.addLayer(image)
  },
  destroy(removeView?: boolean | undefined, stageOptions?: boolean | PIXI.IDestroyOptions | undefined): void {
    renderer.destroy(removeView, stageOptions)
  },
  moveViewport(x: number, y: number, scale: number): void {
    renderer.viewport.position.set(x, y)
    renderer.viewport.scale.set(scale)
  },
  cullViewport(): void {
    renderer.cullViewport()
  },
  resizeViewport(width: number, height: number): void {
    renderer.resizeViewport(width, height)
  },
  get rendererAvailable(): boolean{
    return renderer ? true : false
  }
    
}

Comlink.expose(workerMethods)

export interface WorkerMethods {
  initRenderer(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>): void
  addGerber(gerber: string): void
  addLayer(image: ImageTree): void
  parserGerber(gerber: string): ImageTree
  destroy(removeView?: boolean | undefined, stageOptions?: boolean | PIXI.IDestroyOptions | undefined): void
  moveViewport(x: number, y: number, scale: number): void
  cullViewport(): void
  resizeViewport(width: number, height: number): void
  rendererAvailable: boolean
}
