import { renderTreeGraphicsContainer, GerberGraphics } from './render_chroma_key'

import { parse, GerberTree } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import * as PIXI from 'pixi.js'
import * as PIXI_Viewport from 'pixi-viewport'

import { Cull } from '@pixi-essentials/cull'

import * as Comlink from 'comlink'

/* eslint-disable import/no-webpack-loader-syntax */
import gerberParserWorker from 'worker-loader!../workers/gerberparser'
import { WorkerMethods as GerberParserWorker } from '../workers/gerberparser'
import { DisplayObject } from 'pixi.js'

export { renderGraphic } from './render_mask'

class CustomRootBoundary extends PIXI.EventBoundary {
  constructor() {
    super()
  }
  all(
    e: PIXI.FederatedEvent<UIEvent>,
    type?: string | undefined,
    target?: PIXI.FederatedEventTarget | undefined
  ): void {
    return
  }
}

export class PixiGerberApplication extends PIXI.Application<PIXI.ICanvas> {
  reactRef: React.RefObject<HTMLDivElement>
  viewport: PIXI_Viewport.Viewport
  cull: Cull
  containerObserver: ResizeObserver
  constructor(ref: React.RefObject<HTMLDivElement>, options?: Partial<PIXI.IApplicationOptions>) {
    super(options)
    this.reactRef = ref

    // Add viewport
    this.viewport = new PIXI_Viewport.Viewport({
      worldWidth: 100,
      worldHeight: 100,
      screenWidth: options?.width,
      screenHeight: options?.height,
      events: this.renderer.events,
      stopPropagation: true,
      threshold: 1,
    })
      .drag()
      .pinch({ percent: 2 })
      .wheel()
    // .decelerate()
    this.stage.addChild(this.viewport)

    // Adapt viewport to container size
    this.containerObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      this.renderer.resize(width, height)
      this.viewport.resize(width, height)
    })
    this.containerObserver.observe(this.reactRef.current as HTMLDivElement)

    // Hack to prevent viewport from propagating events to the stage for speed
    // @ts-ignore
    this.renderer.events.rootBoundary = new CustomRootBoundary()

    // Culling
    this.cull = new Cull()
    this._setupCulling()

    this.stage.onrightclick = (e) => {
      const checkintersect = (obj: DisplayObject) => {
        if (obj instanceof GerberGraphics) {
          obj.children.forEach((child) => {
            checkintersect(child)
          })
          if (obj.containsPoint(new PIXI.Point(e.clientX, e.clientY)) && !obj.isMask) {
            // console.log('hit')
            console.log(obj)
          }
        }
        if (obj instanceof PIXI.Container) {
          obj.children.forEach((child) => {
            checkintersect(child)
          })
        }
      }
      checkintersect(this.stage)
    }
  }

  private _setupCulling(): void {
    // console.log('setting up culling')

    let cachedState = true
    let cullDisabled = true
    this.viewport.on('moved', async (e) => {
      // console.log(e.viewport.transform.scale)
      if (e.viewport.transform.scale.x < 2) {
        if (!cachedState) {
          // console.log('caching')
          cullDisabled = true
          cachedState = true
          this.cull.uncull()
          this.viewport.children.forEach(async (child) => {
            child.cacheAsBitmap = true
          })
        }
      } else {
        if (cachedState) {
          // console.log('uncaching')
          cullDisabled = false
          cachedState = false
          this.viewport.children.forEach(async (child) => {
            child.cacheAsBitmap = false
          })
        }
      }
    })

    let cullDirty = false

    this.viewport.on('frame-end', () => {
      if (cullDisabled === true) {
        // console.log('culling disabled')
      } else if (this.viewport.dirty || cullDirty) {
        // console.log('culling')
        this.cull.cull(this.renderer.screen)
        this.viewport.dirty = false
        cullDirty = false
      }
    })
  }

  async addGerber(gerber: string): Promise<PIXI.Container> {
    const worker = new gerberParserWorker()
    const thread = Comlink.wrap<GerberParserWorker>(worker)
    const image = await thread.parserGerber(gerber)
    const layer = await this.addLayer(image)
    return layer
  }

  async parserGerber(gerber: string): Promise<ImageTree> {
    const syntaxTree = parse(gerber)
    console.log('Syntax Tree:', syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log('Image Tree:', imagetree)
    return imagetree
  }

  async addLayer(image: ImageTree) {
    const mainContainer = new PIXI.Container()
    mainContainer.filters = [new PIXI.AlphaFilter(0.5)]
    mainContainer.scale = { x: 1, y: -1 }
    mainContainer.position.y = this.renderer.height / this.renderer.resolution
    mainContainer.interactiveChildren = false

    // TODO: How to use worker with pixi?
    // const worker = new gerberParserWorker()
    // const thread = Comlink.wrap<GerberParserWorker>(worker)
    // mainContainer.addChild(await thread.renderTreeGraphicsContainer(image))

    mainContainer.addChild(renderTreeGraphicsContainer(image))
    mainContainer.cacheAsBitmapResolution = 5
    mainContainer.cacheAsBitmap = true
    this.viewport.addChild(mainContainer)
    this.cull.addAll(mainContainer.children)
    // @ts-ignore
    // window.mainContainer = mainContainer
    return mainContainer
  }

  destroy(
    removeView?: boolean | undefined,
    stageOptions?: boolean | PIXI.IDestroyOptions | undefined
  ): void {
    this.containerObserver.unobserve(this.reactRef.current as HTMLDivElement)
    this.viewport.removeAllListeners()
    super.destroy(removeView, stageOptions)
  }
}
