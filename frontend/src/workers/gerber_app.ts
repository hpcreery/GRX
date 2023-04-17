import * as Comlink from 'comlink'
import { PixiGerberApplication } from '../renderer'
import type * as PIXI from '@pixi/webworker'

export class PixiGerberApplicationWorker extends PixiGerberApplication {
  constructor(canvas: OffscreenCanvas, options?: Partial<PIXI.IApplicationOptions>) {
    super({ ...options, view: canvas })
  }
}

Comlink.expose(PixiGerberApplicationWorker)
