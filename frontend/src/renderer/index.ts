import { GerberGraphics, renderGraphics } from './graphics'
import geometry from './geometry_math'

import { parse, GerberTree } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import * as PIXI from '@pixi/webworker'

import { Cull } from '@pixi-essentials/cull'

PIXI.BatchRenderer.canUploadSameBuffer = true
// PIXI.Graphics.curves.adaptive = false
// PIXI.Graphics.curves.maxLength = 1
// PIXI.Graphics.curves.minSegments = 200
// PIXI.Graphics.curves.maxSegments = 2048
// PIXI.Graphics.curves.epsilon = 0.0001

export class PixiGerberApplication extends PIXI.Application<PIXI.ICanvas> {
  viewport: PIXI.Container
  cull: Cull
  origin: PIXI.ObservablePoint
  cachedGerberGraphics: boolean = true
  cullDirty: boolean = true

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
      toggle: 'renderable',
    })

    // origin
    this.origin = new PIXI.ObservablePoint(
      () => {},
      this.viewport,
      0,
      this.renderer.height / this.renderer.resolution
    )
  }

  featuresAtPosition(clientX: number, clientY: number): any[] {
    const checkintersect = (obj: PIXI.DisplayObject): GerberGraphics[] => {
      let intersected: GerberGraphics[] = []
      if (obj instanceof GerberGraphics) {
        obj.tint = 0xffffff
        obj.children.forEach((child) => {
          intersected = intersected.concat(checkintersect(child))
        })
        if (obj.containsPoint(new PIXI.Point(clientX, clientY)) && !obj.isMask) {
          intersected.push(obj)
        }
        if (obj.line.width != 0) {
          let point = obj.worldTransform.applyInverse(new PIXI.Point(clientX, clientY))
          let intersect = geometry.pointInsidePolygon(point.x, point.y, obj.geometry.points)
          if (intersect) {
            intersected.push(obj)
          }
        }
      }
      if (obj instanceof PIXI.Container) {
        obj.children.forEach((child) => {
          intersected = intersected.concat(checkintersect(child))
        })
      }
      return intersected
    }
    let intersected = []
    intersected = checkintersect(this.viewport).map((obj) => {
      console.log(obj)
      obj.tint = 0x00ff00
      return { bounds: { ...obj._bounds } }
    })
    console.log(intersected)
    return intersected
  }

  cullViewport(force: boolean = false) {
    if (this.viewport.transform.scale.x < 1) {
      if (!this.cachedGerberGraphics) {
        // console.log('caching')
        this.cachedGerberGraphics = true
        this.cull.uncull()
        this.cullDirty = true
        this.viewport.children.forEach(async (child) => {
          child.cacheAsBitmap = true
        })
      }
    } else {
      if (this.cachedGerberGraphics) {
        // console.log('uncaching')
        this.cachedGerberGraphics = false
        this.cullDirty = true
        this.viewport.children.forEach(async (child) => {
          child.cacheAsBitmap = false
        })
      }
    }
    if (this.cachedGerberGraphics !== true) {
      if (this.cullDirty === true || force === true) {
        this.cullDirty = false
        this.cull.cull(this.renderer.screen as PIXI.Rectangle)
        setTimeout(() => {
          this.cullDirty = true
        }, 40)
      }
    }
  }

  resizeViewport(width: number, height: number) {
    this.renderer.resize(width, height)
    this.cullViewport()
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

  getViewportBounds(): PIXI.Rectangle {
    return this.viewport.getLocalBounds()
  }

  getRendererBounds(): PIXI.Rectangle {
    return this.renderer.screen
  }

  async addLayer(image: ImageTree) {
    const layerContainer = new PIXI.Container()
    layerContainer.filters = [new PIXI.AlphaFilter(0.5)]
    layerContainer.scale = { x: 1, y: -1 }
    layerContainer.position = this.origin
    layerContainer.interactiveChildren = false
    // layerContainer.eventMode = 'none'

    layerContainer.addChild(renderGraphics(image))
    // layerContainer.cacheAsBitmapMultisample = PIXI.MSAA_QUALITY.LOW
    layerContainer.cacheAsBitmapResolution = 1
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
