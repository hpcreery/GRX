import { GerberGraphics } from './graphics'

import type { ImageTree } from '@hpcreery/tracespace-plotter'

import * as PIXI from '@pixi/webworker'

import { Cull } from '@pixi-essentials/cull'
import { RendererLayer } from './types'

import * as Comlink from 'comlink'
/* eslint-disable import/no-webpack-loader-syntax */
import gerberParserWorker from '../workers/gerber_parser?worker'
import type { WorkerMethods as GerberParserMethods } from '../workers/gerber_parser'

PIXI.BatchRenderer.canUploadSameBuffer = true
// PIXI.Graphics.curves.adaptive = false
// PIXI.Graphics.curves.maxLength = 1
// PIXI.Graphics.curves.minSegments = 200
// PIXI.Graphics.curves.maxSegments = 2048
// PIXI.Graphics.curves.epsilon = 0.0001

export class PixiGerberApplication extends PIXI.Application<PIXI.ICanvas> {
  viewport: GerberViewport
  cull: Cull
  origin: PIXI.ObservablePoint
  cachedGerberGraphics: boolean = true
  cullDirty: boolean = true

  constructor(options?: Partial<PIXI.IApplicationOptions>) {
    console.log('PixiGerberApplication', options)
    super(options)

    if (this.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
      console.log('Gerber Renderer is using WebGL Canvas')
    } else {
      console.log('Gerber Renderer is using HTML Canvas')
    }

    this.viewport = new GerberViewport()
    this.stage.addChild(this.viewport)

    // Culling
    this.cull = new Cull({
      recursive: true,
      toggle: 'renderable'
    })

    // origin
    this.origin = new PIXI.ObservablePoint(
      () => {},
      this.viewport,
      0,
      this.renderer.height / this.renderer.resolution
    )
  }

  public getOrigin(): { x: number; y: number } {
    return { x: this.origin.x, y: this.origin.y }
  }

  public featuresAtPosition(clientX: number, clientY: number): any[] {
    console.log('featuresAtPosition', clientX, clientY)
    return []
    // const checkintersect = (obj: PIXI.DisplayObject): GerberGraphics[] => {
    //   let intersected: GerberGraphics[] = []
    //   if (obj instanceof GerberGraphics) {
    //     obj.tint = 0xffffff
    //     obj.children.forEach((child) => {
    //       intersected = intersected.concat(checkintersect(child))
    //     })
    //     if (obj.containsPoint(new PIXI.Point(clientX, clientY)) && !obj.isMask) {
    //       intersected.push(obj)
    //     }
    //     if (obj.line.width != 0) {
    //       let point = obj.worldTransform.applyInverse(new PIXI.Point(clientX, clientY))
    //       let intersect = geometry.pointInsidePolygon(point.x, point.y, obj.geometry.points)
    //       if (intersect) {
    //         intersected.push(obj)
    //       }
    //     }
    //   }
    //   if (obj instanceof PIXI.Container) {
    //     obj.children.forEach((child) => {
    //       intersected = intersected.concat(checkintersect(child))
    //     })
    //   }
    //   return intersected
    // }
    // let intersected = []
    // intersected = checkintersect(this.viewport).map((obj) => {
    //   console.log(obj)
    //   obj.tint = 0x00ff00
    //   return { bounds: { ...obj._bounds } }
    // })
    // console.log(intersected)
    // return intersected
  }

  // Culling methods
  // ---------------

  public cullViewport(force: boolean = false) {
    if (this.viewport.transform.scale.x < 1) {
      if (!this.cachedGerberGraphics) {
        this.cullDirty = true
        this.cacheViewport()
      }
    } else {
      if (this.cachedGerberGraphics) {
        this.cullDirty = true
        this.uncacheViewport()
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

  private cacheViewport() {
    this.cull.uncull()
    this.cachedGerberGraphics = true
    this.viewport.children.forEach(async (child) => {
      child.cacheAsBitmap = true
    })
  }

  private uncacheViewport() {
    this.cachedGerberGraphics = false
    this.viewport.children.forEach(async (child) => {
      child.cacheAsBitmap = false
    })
  }

  public uncull(): void {
    this.cull.uncull()
  }

  // Viewport methods
  // ----------------

  public moveViewport(x: number, y: number, scale: number): void {
    this.viewport.position.set(x, y)
    this.viewport.scale.set(scale)
    this.cullViewport()
  }

  public resizeViewport(width: number, height: number) {
    this.renderer.resize(width, height)
    this.cullViewport()
  }

  public getViewportBounds(): PIXI.Rectangle {
    return this.viewport.getLocalBounds()
  }

  public getRendererBounds(): PIXI.Rectangle {
    return this.renderer.screen
  }

  // Layer methods
  // -------------

  public tintLayer(uid: string, color: PIXI.ColorSource) {
    this.uncacheViewport()
    const layer = this.viewport.getChildByUID(uid)
    if (layer) {
      layer.tint = color
    }
    this.cullViewport()
  }

  public getLayerTintColor(uid: string): PIXI.ColorSource {
    const layer = this.viewport.getChildByUID(uid)
    if (layer) {
      return layer.tint
    }
    return 0xffffff
  }

  public showLayer(uid: string) {
    this.uncacheViewport()
    const layer = this.viewport.getChildByUID(uid)
    if (layer) {
      layer.visible = true
    }
    this.cullViewport()
  }

  public hideLayer(uid: string) {
    this.uncacheViewport()
    const layer = this.viewport.getChildByUID(uid)
    if (layer) {
      layer.visible = false
    }
    this.cullViewport()
  }

  public get layers(): RendererLayer[] {
    let gerberLayers: RendererLayer[] = []
    this.viewport.children.forEach((child) => {
      if (child instanceof LayerContainer) {
        gerberLayers.push({
          uid: child.uid,
          name: child.name,
          color: child.tint,
          visible: child.visible,
          zIndex: child.zIndex
        })
      }
    })
    return gerberLayers
  }

  public addLayer(name: string, image: ImageTree, uid?: string): void {
    const layerContainer = new LayerContainer({ name, uid })
    layerContainer.filters = [new PIXI.AlphaFilter(0.5)]
    layerContainer.scale = { x: 1, y: -1 }
    layerContainer.position = this.origin
    layerContainer.interactiveChildren = false
    // layerContainer.eventMode = 'none'
    layerContainer.addChild(new GerberGraphics(image))
    layerContainer.cacheAsBitmapResolution = 1
    layerContainer.cacheAsBitmap = this.cachedGerberGraphics
    this.viewport.addChild(layerContainer)
    this.cull.addAll(layerContainer.children)
  }

  public async removeLayer(uid: string): Promise<void> {
    const layerContainer = this.viewport.getChildByUID(uid)
    if (layerContainer) {
      this.viewport.removeChild(layerContainer)
      this.cull.removeAll(layerContainer.children)
    }
  }

  // Gerber methods
  // --------------

  public async addGerber(name: string, gerber: string, uid?: string): Promise<void> {
    const thread = Comlink.wrap<GerberParserMethods>(new gerberParserWorker())
    const image = await thread.parseGerber(gerber)
    thread[Comlink.releaseProxy]()
    this.addLayer(name, image, uid)
  }

  // Event methods
  // -------------

  addViewportListener(event: keyof PIXI.DisplayObjectEvents, listener: () => void): void {
    function runCallback() {
      listener()
    }
    this.viewport.on(event, runCallback)
  }

  // removeViewportListener(event: keyof PIXI.DisplayObjectEvents, listener: () => void): void {
  //   function runCallback() {
  //     listener()
  //   }
  //   this.viewport.off(event, runCallback)
  // }

  public destroy(
    removeView?: boolean | undefined,
    stageOptions?: boolean | PIXI.IDestroyOptions | undefined
  ): void {
    this.viewport.removeAllListeners()
    super.destroy(removeView, stageOptions)
  }
}

class LayerContainer extends PIXI.Container {
  public name: string
  public uid: string
  constructor(props: { name: string; uid?: string }) {
    super()
    this.name = props.name
    this.uid = props.uid ?? this.generateUid()
  }
  private generateUid(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  get tint(): PIXI.ColorSource {
    const child = this.children[0] as GerberGraphics
    return child.tint
  }

  set tint(color: PIXI.ColorSource) {
    const child = this.children[0] as GerberGraphics
    child.tint = color
  }
}

class GerberViewport extends PIXI.Container {
  constructor() {
    super()
  }
  public getChildByUID(uid: string): LayerContainer | undefined {
    let found: LayerContainer | undefined
    this.children.forEach((child) => {
      if (child instanceof LayerContainer) {
        if (child.uid === uid) {
          found = child
        }
      }
    })
    return found
  }
}
