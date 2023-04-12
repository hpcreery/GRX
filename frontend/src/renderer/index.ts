import { GerberGraphics, renderGraphics } from './graphics'
import geometry from './geometry_math'

import { parse, GerberTree } from '@hpcreery/tracespace-parser'
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import * as PIXI from '@pixi/webworker'

import { Cull } from '@pixi-essentials/cull'
import { Layers } from './types'
// import EventEmitter from 'events'

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
  // events: EventEmitter

  constructor(options?: Partial<PIXI.IApplicationOptions>) {
    console.log('PixiGerberApplication', options)
    super(options)
    // this.events = new EventEmitter()

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

  public featuresAtPosition(clientX: number, clientY: number): any[] {
    return []
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

  public cullViewport(force: boolean = false) {
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

  public uncull(): void {
    this.cull.uncull()
  }

  public moveViewport(x: number, y: number, scale: number): void {
    this.viewport.position.set(x, y)
    this.viewport.scale.set(scale)
    this.cullViewport()
  }

  public resizeViewport(width: number, height: number) {
    this.renderer.resize(width, height)
    this.cullViewport()
  }

  public async addGerber(name: string, gerber: string): Promise<void> {
    const image = await this.parseGerber(gerber)
    await this.addLayer(name, image)
  }

  public tintLayer(name: string, color: PIXI.ColorSource) {
    const layer = this.viewport.getChildByName(name, false) as GerberGraphics
    if (layer && layer instanceof GerberGraphics) {
      layer.tint = color
    }
  }

  public getLayerTintColor(name: string): PIXI.ColorSource {
    const layer = this.viewport.getChildByName(name, true) as GerberGraphics
    if (layer) {
      return layer.tint
    }
    return 0xffffff
  }

  async parseGerber(gerber: string): Promise<ImageTree> {
    const syntaxTree = parse(gerber)
    console.log('Syntax Tree:', syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log('Image Tree:', imagetree)
    return imagetree
  }

  public getViewportBounds(): PIXI.Rectangle {
    return this.viewport.getLocalBounds()
  }

  public getRendererBounds(): PIXI.Rectangle {
    return this.renderer.screen
  }

  public get layers(): Layers[] {
    let gerberLayers: Layers[] = []
    this.viewport.children.forEach((child) => {
      if (child instanceof LayerContainer) {
        const name = child.name
        if (child.children[0] instanceof GerberGraphics) {
          gerberLayers.push({
            uid: child.children[0].uid,
            name,
            color: child.children[0].tint || 0xffffff,
            visible: child.children[0].visible,
            zIndex: child.children[0].zIndex,
          })
        }
      }
    })
    return gerberLayers
  }

  public async addLayer(name: string, image: ImageTree): Promise<void> {
    const layerContainer = new LayerContainer({ name })
    // const tint = new PIXI.ColorMatrixFilter()
    // tint.tint(0x00ff00, false)
    layerContainer.filters = [new PIXI.AlphaFilter(0.5)]
    layerContainer.scale = { x: 1, y: -1 }
    layerContainer.position = this.origin
    layerContainer.interactiveChildren = false
    // layerContainer.eventMode = 'none'
    // const child = renderGraphics(image)
    // child.name = name
    layerContainer.addChild(renderGraphics(image))
    // layerContainer.cacheAsBitmapMultisample = PIXI.MSAA_QUALITY.LOW
    layerContainer.cacheAsBitmapResolution = 1
    layerContainer.cacheAsBitmap = this.cachedGerberGraphics
    this.viewport.addChild(layerContainer)
    this.cull.addAll(layerContainer.children)
  }

  addViewportListener(event: keyof PIXI.DisplayObjectEvents, listener: () => void): void {
    function runCallback() {
      listener()
    }
    this.viewport.on(event, runCallback)
  }

  // render(): void {
  //   super.render()
  // }

  public destroy(
    removeView?: boolean | undefined,
    stageOptions?: boolean | PIXI.IDestroyOptions | undefined
  ): void {
    // this.events.removeAllListeners()
    this.viewport.removeAllListeners()
    super.destroy(removeView, stageOptions)
  }
}

class LayerContainer extends PIXI.Container {
  name: string
  constructor(props: { name: string }) {
    super()
    this.name = props.name
  }
}
