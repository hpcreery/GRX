import type { ImageTree, SizeEnvelope } from '@hpcreery/tracespace-plotter'
import { BoundingBox } from '@hpcreery/tracespace-plotter'

import { renderTreeGraphicsContainer } from './render'

import * as PIXI from 'pixi.js'
import { DisplayObject, IApplicationOptions } from 'pixi.js'

import { IViewportOptions, Viewport } from 'pixi-viewport'
export { renderGraphic } from './render'

export class CustomPixiApplication extends PIXI.Application<PIXI.ICanvas> {
  reactRef: React.RefObject<HTMLDivElement>
  viewport: Viewport
  constructor(ref: React.RefObject<HTMLDivElement>, options?: Partial<IApplicationOptions>) {
    super(options)
    this.reactRef = ref
    this.viewport = new Viewport({
      worldWidth: 1000,
      worldHeight: 1000,
      screenWidth: options?.width,
      screenHeight: options?.height,
      // @ts-ignore
      // divWheel: this.view,
      events: this.renderer.events,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      .decelerate()
    this.stage.addChild(this.viewport)
    // this.ticker.start()
  }

  async renderImageTree(image: ImageTree) {
    this.viewport.addChild(renderTreeGraphicsContainer(image))
  }
}
