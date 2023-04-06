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
    renderer.cullViewport()
  },
  cullViewport(force: boolean = false): void {
    renderer.cullViewport(force)
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
  addGerber(gerber: string): void
  addLayer(image: ImageTree): void
  parserGerber(gerber: string): ImageTree
  destroy(removeView?: boolean | undefined, stageOptions?: boolean | PIXI.IDestroyOptions | undefined): void
  moveViewport(x: number, y: number, scale: number): void
  cullViewport(force: boolean): void
  resizeViewport(width: number, height: number): void
  featuresAtPosition(x: number, y: number): any[]
  rendererAvailable: boolean
  renderer: PixiGerberApplication
}
