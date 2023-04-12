import * as Comlink from 'comlink'
import { parse } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'
import geometry from '../renderer/geometry_math'

import * as PIXI from '@pixi/webworker'
import { PixiGerberApplication } from '../renderer'

export class PixiGerberApplicationWorker extends PixiGerberApplication {
  constructor(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>) {
    super({ ...options, view: canvas })
  }
}

const workerMethods: WorkerMethods = {
  parseGerber(gerber: string): ImageTree {
    const syntaxTree = parse(gerber)
    console.log('syntaxTree', syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log('imagetree', imagetree)
    return imagetree
  },
  PixiGerberApplicationWorker: PixiGerberApplicationWorker,
}

Object.assign(workerMethods, geometry)

Comlink.expose(workerMethods)

export interface WorkerMethods {
  parseGerber(gerber: string): ImageTree
  PixiGerberApplicationWorker: typeof PixiGerberApplicationWorker
}