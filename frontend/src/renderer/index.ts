import { renderTreeGraphicsContainer } from './chroma_key_render'

import { parse, GerberTree } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import * as PIXI from '@pixi/webworker'

import { Cull } from '@pixi-essentials/cull'

export class PixiGerberApplication extends PIXI.Application<PIXI.ICanvas> {
  viewport: PIXI.Container
  cull: Cull
  origin: PIXI.ObservablePoint
  cachedGerberGraphics: boolean = true

  constructor(options?: Partial<PIXI.IApplicationOptions>) {
    console.log('PixiGerberApplication', options)
    super(options)

    if (this.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
      console.log('Using WebGL')
    } else {
      console.log('Using Canvas')
    }

    this.viewport = new PIXI.Container()
    this.stage.addChild(this.viewport)

    // Culling
    this.cull = new Cull({
      recursive: true,
      toggle: "visible"
    })

    this.viewport.onrightclick = (e) => {
      const checkintersect = (obj: PIXI.DisplayObject) => {
        if (obj instanceof PIXI.DisplayObject && obj.children) {
          obj.children.forEach((child) => {
            checkintersect(child as PIXI.DisplayObject)
          })
          // if (obj.containsPoint(new PIXI.Point(e.clientX, e.clientY)) && !obj.isMask) {
          //   // console.log('hit')
          //   console.log(obj)
          // }
        }
        if (obj instanceof PIXI.Container) {
          obj.children.forEach((child) => {
            checkintersect(child)
          })
        }
      }
      checkintersect(this.viewport)
    }

    // origin
    this.origin = new PIXI.ObservablePoint(
      () => {},
      this.viewport,
      0,
      this.renderer.height / this.renderer.resolution
    )
  }

  cullViewport() {
    if (this.viewport.transform.scale.x < 2) {
      if (!this.cachedGerberGraphics) {
        // console.log('caching')
        this.cachedGerberGraphics = true
        this.cull.uncull()
        this.viewport.children.forEach(async (child) => {
          child.cacheAsBitmap = true
        })
      }
    } else {
      if (this.cachedGerberGraphics) {
        // console.log('uncaching')
        this.cachedGerberGraphics = false
        this.viewport.children.forEach(async (child) => {
          child.cacheAsBitmap = false
        })
      }
    }
    if (this.cachedGerberGraphics !== true) {
      // console.log('culling')
      // this.cull.uncull()
      this.cull.cull(this.renderer.screen as PIXI.Rectangle)
    } else {
      // console.log('culling disabled')
    }
  }

  resizeViewport(width: number, height: number) {
    this.renderer.resize(width, height)
  }

  async addGerber(gerber: string): Promise<PIXI.Container> {
    const image = await this.parseGerber(gerber)
    const layer = await this.addLayer(image)
    return layer
  }

  async parseGerber(gerber: string): Promise<ImageTree> {
    const syntaxTree = parse(gerber)
    console.log('Syntax Tree:', syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log('Image Tree:', imagetree)
    return imagetree
  }

  async addLayer(image: ImageTree) {
    const layerContainer = new PIXI.Container()
    layerContainer.filters = [new PIXI.AlphaFilter(0.5)]
    layerContainer.scale = { x: 1, y: -1 }
    layerContainer.position = this.origin
    layerContainer.interactiveChildren = false
    // layerContainer.eventMode = 'none'

    layerContainer.addChild(renderTreeGraphicsContainer(image))
    layerContainer.cacheAsBitmapResolution = 5
    layerContainer.cacheAsBitmap = this.cachedGerberGraphics
    this.viewport.addChild(layerContainer)
    this.cull.addAll(layerContainer.children)
    return layerContainer
  }

  // render(): void {
  //   super.render()
  // }

  destroy(
    removeView?: boolean | undefined,
    stageOptions?: boolean | PIXI.IDestroyOptions | undefined
  ): void {
    this.viewport.removeAllListeners()
    super.destroy(removeView, stageOptions)
  }
}
