import type { ImageTree, SizeEnvelope } from '@hpcreery/tracespace-plotter'

// import { renderTreeGraphicsContainer } from './render'
import { renderTreeGraphicsContainer } from './render_chroma_key'

import * as PIXI from 'pixi.js'
import { IApplicationOptions } from 'pixi.js'

import { Viewport, IViewportOptions } from 'pixi-viewport'
import { Cull } from '@pixi-essentials/cull'
export { renderGraphic } from './render'


class CustomRootBoundary extends PIXI.EventBoundary {
  constructor() {
    super()
  }
  all(e: PIXI.FederatedEvent<UIEvent>, type?: string | undefined, target?: PIXI.FederatedEventTarget | undefined): void {
    return
  }
}

export class CustomPixiApplication extends PIXI.Application<PIXI.ICanvas> {
  reactRef: React.RefObject<HTMLDivElement>
  viewport: Viewport
  cull: Cull
  constructor(ref: React.RefObject<HTMLDivElement>, options?: Partial<IApplicationOptions>) {
    super(options)
    this.reactRef = ref
    this.viewport = new Viewport({
      worldWidth: 100,
      worldHeight: 100,
      screenWidth: options?.width,
      screenHeight: options?.height,
      events: this.renderer.events,
      stopPropagation: true,
      threshold: 1,
      // ticker: this.ticker,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
      // .decelerate()

    // @ts-ignore
    this.renderer.events.rootBoundary = new CustomRootBoundary()

    


    this.stage.addChild(this.viewport)
    this.cull = new Cull()

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

    let cullDirty = false
    this.viewport.on('frame-end', () => {
      if (this.viewport.dirty || cullDirty) {
        this.cull.cull(this.renderer.screen)

        this.viewport.dirty = false
        cullDirty = false
      }
    })
  }

  async renderImageTree(image: ImageTree) {
    const mainContainer = new PIXI.Container()
    mainContainer.filters = [new PIXI.AlphaFilter(0.5)]
    mainContainer.scale = { x: 1, y: -1 }
    mainContainer.position.y = this.renderer.height / this.renderer.resolution
    mainContainer.interactiveChildren = false
    mainContainer.addChild(renderTreeGraphicsContainer(image))
    mainContainer.cacheAsBitmap = true
    this.viewport.addChild(mainContainer)
    this.cull.addAll(mainContainer.children)
    // @ts-ignore
    window.mainContainer = mainContainer
  }
}
