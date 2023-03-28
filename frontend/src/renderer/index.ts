import type { ImageTree, SizeEnvelope } from '@hpcreery/tracespace-plotter'

// import { renderTreeGraphicsContainer } from './render'
import { renderTreeGraphicsContainer } from './render_chroma_key'

import * as PIXI from 'pixi.js'
import { IApplicationOptions } from 'pixi.js'

import { Viewport } from 'pixi-viewport'
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
      events: this.renderer.events,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      .decelerate()
    this.stage.addChild(this.viewport)

    //   this.stage.onrightclick = (e) => {
    //     const checkintersect = (obj: DisplayObject) => {
    //       if (obj instanceof CustomGraphics) {
    //         obj.children.forEach((child) => {
    //           checkintersect(child)
    //         })
    //         if (obj.containsPoint(new PIXI.Point(e.clientX, e.clientY)) && !obj.isMask) {
    //           // console.log('hit')
    //           console.log(obj.shape)
    //         }
    //       }
    //       if (obj instanceof PIXI.Container) {
    //         obj.children.forEach((child) => {
    //           checkintersect(child)
    //         })
    //       }
    //     }
    //     checkintersect(this.stage)
    //   }
  }

  async renderImageTree(image: ImageTree) {
    const mainContainer = new PIXI.Container()
    mainContainer.filters = [new PIXI.AlphaFilter(0.5)]
    mainContainer.scale = { x: 1, y: -1 }
    mainContainer.position.y = this.renderer.height / this.renderer.resolution
    mainContainer.interactiveChildren = false
    mainContainer.addChild(renderTreeGraphicsContainer(image))
    this.viewport.addChild(mainContainer)
  }
}

