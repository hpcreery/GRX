import REGL from "regl"
import { mat3, vec2, vec3 } from "gl-matrix"
import LayerRenderer from "./layer"
import { ReglRenderers, TLoadedReglRenderers } from "./gl-commands"
import * as Shapes from "../../data/shape/shape"
import { type Units, type BoundingBox, FeatureTypeIdentifier, SNAP_MODES_MAP, SnapMode, ColorBlend, ViewBox } from "../types"
import Transform from "../transform"
import { UID, UpdateEventTarget } from "../utils"
import { SimpleMeasurement } from "./measurements"
import { ShapeDistance } from "./shape-renderer"
import type { RenderSettings } from "../settings"
import { settings, origin, gridSettings } from "../settings"
import ShapeTransform from "../transform"
import { Layer, Project, Step } from '@src/renderer/data/project'
import { DataInterface } from '@src/renderer/data/interface'

export interface WorldProps {}

interface WorldUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Resolution: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
  u_SkeletonMode: boolean
  u_SnapMode: number
  u_PointerPosition: vec2
  u_PointerDown: boolean
  u_QueryMode: boolean
  u_Time: number
}

interface WorldAttributes {
  a_Vertex_Position: vec2[]
}

export interface WorldContext {
  settings: RenderSettings
  transform: RenderTransform
  resolution: vec2
  transformMatrix: mat3
}

// interface ScreenRenderProps {
//   renderTexture: REGL.Framebuffer | REGL.Texture2D
// }

// interface ScreenRenderUniforms {
//   u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
// }

export interface ViewRendererConfig {
  id?: string
  stepData: Step
  projectData: Project
  viewBox: DOMRect
  // dpr: number
  regl: REGL.Regl
}

export interface RenderTransform {
  zoom: number
  position: vec2
  velocity: vec2
  timestamp: Date
  dragging: boolean
  matrix: mat3
  matrixInverse: mat3
  update: () => void
}

export interface LayerInfo {
  name: string
  id: string
  color: vec3
  units: Units
  visible: boolean
  transform: Transform
}

export interface EngineEventsMap {
  update: Event
}

export interface Pointer {
  x: number
  y: number
  down: boolean
}

export interface QuerySelection extends ShapeDistance {
  sourceLayer: string
  units: Units
}

export type ViewRendererProps = Partial<typeof ViewRenderer.defaultRenderProps>


export class ViewRenderer extends UpdateEventTarget {
  public id: string = UID()
  public stepData: Step
  public projectData: Project
  static defaultRenderProps = { force: false, updateLayers: true }

  public viewBox: ViewBox = {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  }

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }

  public transform: RenderTransform = {
    zoom: 1,
    position: [0, 0],
    velocity: [0, 0],
    timestamp: new Date(),
    dragging: false,
    matrix: mat3.create(),
    matrixInverse: mat3.create(),
    update: (): void => {
      this.updateTransform()
    },
  }

  public dirty = true

  public layers: LayerRenderer[] = []
  public selections: LayerRenderer[] = []
  public layersQueue: { name: string; id: string }[] = []

  public regl: REGL.Regl
  private world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>

  protected drawCollections: TLoadedReglRenderers

  // public loadingFrame: LoadingAnimation
  public measurements: SimpleMeasurement

  private utilitiesRenderer: UtilitiesRenderer

  private layersSubscriptionControler: AbortController

  constructor({ viewBox, regl, id, stepData, projectData }: ViewRendererConfig) {
    super()
    this.id = id || UID()
    this.stepData = stepData
    this.projectData = projectData

    this.viewBox = viewBox

    this.regl = regl

    this.utilitiesRenderer = new UtilitiesRenderer(regl)

    this.world = this.regl<WorldUniforms, WorldAttributes, WorldProps, WorldContext>({
      context: {
        settings: settings,
        transformMatrix: () => this.transform.matrix,
        transform: () => this.transform,
        resolution: () => [this.viewBox.width, this.viewBox.height],
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        u_Resolution: () => [this.viewBox.width, this.viewBox.height],
        // u_Resolution: (context: REGL.DefaultContext, props: WorldProps) => context.resolution,
        u_PixelSize: 2,
        u_OutlineMode: () => settings.OUTLINE_MODE,
        u_SkeletonMode: () => settings.SKELETON_MODE,
        u_SnapMode: () => SNAP_MODES_MAP[settings.SNAP_MODE],
        u_PointerPosition: (_context: REGL.DefaultContext) => [this.pointer.x, this.pointer.y],
        u_PointerDown: (_context: REGL.DefaultContext) => this.pointer.down,
        u_QueryMode: false,
        u_Time: (context: REGL.DefaultContext) => context.time,
      },

      attributes: {
        a_Vertex_Position: [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, +1],
          [+1, -1],
        ],
      },

      cull: {
        enable: false,
        face: "front",
      },

      depth: {
        enable: false,
        mask: true,
        func: "greater",
        range: [0, 1],
      },

      // stencil: {
      //   enable: true,
      //   mask: 0xff,
      //   func: {
      //     ref: 0xff,
      //     cmp: "always",
      //     mask: 0xff,
      //   },
      //   op: {
      //     fail: "keep",
      //     zfail: "keep",
      //     zpass: "keep",
      //   },
      // },

      scissor: {
        enable: true,
        box: () => this.viewBox,
      },

      viewport: () => this.viewBox,

      primitive: "triangles",
      count: 6,
      offset: 0,

      profile: true,
    })

    // this.loadingFrame = new LoadingAnimation(this.regl, this.world)
    // this.measurements = new SimpleMeasurement(this.regl, this.ctx)
    this.measurements = new SimpleMeasurement({
      regl: this.regl,
    })

    this.drawCollections = ReglRenderers as TLoadedReglRenderers

    this.layersSubscriptionControler = new AbortController();
    this.createLayers()

    this.zoomAtPoint(0, 0, this.transform.zoom)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public updateViewBox(newViewBox: DOMRect): void {
    let viewBoxChanged = false
    for (const key in this.viewBox) {
      if (newViewBox[key] !== this.viewBox[key]) {
        viewBoxChanged = true
        break
      }
    }
    this.viewBox = newViewBox
    if (viewBoxChanged) {
      this.updateTransform()
      this.dispatchTypedEvent("update", new Event("update"))
    }
  }

  public toss(): void {
    const { dragging } = this.transform
    if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    vec2.scale(this.transform.velocity, this.transform.velocity, 0.95)
    this.transform.update()
    if (Math.abs(this.transform.velocity[0]) < 0.05 && Math.abs(this.transform.velocity[1]) < 0.05) {
      this.transform.velocity[0] = 0
      this.transform.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), settings.MSPFRAME)
    }
  }

  public moveViewport(x: number, y: number): void {
    if (!this.transform.dragging) return
    this.transform.velocity = [x, y]
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    this.transform.update()
    this.transform.timestamp = new Date()
  }

  public grabViewport(): void {
    this.transform.velocity = [0, 0]
    this.transform.dragging = true
  }

  public releaseViewport(): void {
    this.transform.dragging = false
    const currentTimestamp = new Date()
    const timeDiff = currentTimestamp.getTime() - this.transform.timestamp.getTime()
    if (timeDiff > settings.MSPFRAME * 10) {
      this.transform.velocity = [0, 0]
    }
    this.toss()
  }

  public zoom(x: number, y: number, s: number): void {
    if (settings.ZOOM_TO_CURSOR) {
      this.zoomAtPoint(x, y, s)
    } else {
      this.zoomAtPoint(x, x, s)
    }
  }

  public isDragging(): boolean {
    return this.transform.dragging
  }

  public updateTransform(): void {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this.transform
    const { width, height } = this.viewBox
    mat3.projection(this.transform.matrix, width, height)
    mat3.translate(this.transform.matrix, this.transform.matrix, position)
    mat3.scale(this.transform.matrix, this.transform.matrix, [zoom, zoom])
    mat3.scale(this.transform.matrix, this.transform.matrix, [height / width, 1])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [1, width / height])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [width, height])
    mat3.translate(this.transform.matrix, this.transform.matrix, [width / 2, height / 2])
    mat3.scale(this.transform.matrix, this.transform.matrix, [width / 2, -height / 2])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [height / width / 2, width / height / 2])

    mat3.invert(this.transform.matrixInverse, this.transform.matrix)

    // logMatrix(this.transform.matrix)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public zoomAtPoint(x: number, y: number, s: number): void {
    const { zoom } = this.transform
    let newZoom = zoom - s / (1000 / zoom / 2)
    let zoomBy = newZoom / zoom
    if (newZoom < settings.MIN_ZOOM) {
      newZoom = settings.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else if (newZoom > settings.MAX_ZOOM) {
      newZoom = settings.MAX_ZOOM
      zoomBy = newZoom / zoom
      this.transform.zoom = newZoom
    } else {
      this.transform.zoom = newZoom
    }
    this.transform.position[0] = x - (x - this.transform.position[0]) * zoomBy
    this.transform.position[1] = y - (y - this.transform.position[1]) * zoomBy
    this.transform.update()
    // this.transform2.update(this.transform.matrix)
  }

  public getWorldPosition(x: number, y: number): [number, number] {
    const mousePosViewbox: vec2 = [x * 2 - 1, y * 2 - 1]
    const mousePos = vec2.transformMat3(vec2.create(), mousePosViewbox, this.transform.matrixInverse)
    return [mousePos[0], mousePos[1]]
  }


  private createLayers(): void {
    this.layersSubscriptionControler.abort()
    this.layersSubscriptionControler = new AbortController();
    DataInterface.subscribe_to_matrix(this.projectData, () => {
      this.updateLayers()
    }, { signal: this.layersSubscriptionControler.signal });
    this.updateLayers()
  }

  public updateLayers(): void {
    for (const layer of this.stepData.layers) {
      if (this.layers.find((l) => l.layerData === layer)) continue
      this.addLayer(layer)
    }
    for (const layer of this.layers) {
      if (this.stepData.layers.find((l) => l === layer.layerData)) continue
      this.deleteLayer(layer.layerData)
    }
  }

  private addLayer(layerData: Layer): void {
    const layerRenderer = new LayerRenderer({
      regl: this.regl,
      layerData: layerData,
      stepData: this.stepData,
      projectData: this.projectData,
      color: vec3.fromValues(Math.random(), Math.random(), Math.random()),
      visible: true,
      // image: artwork,
    })
    this.layers.push(layerRenderer)
    layerRenderer.onUpdate(() => {
      this.dispatchTypedEvent("update", new Event("update"))
    })
    // this.dispatchTypedEvent("update", new Event("update"))
  }

  private deleteLayer(layer: Layer): void {
    const index = this.layers.findIndex((l) => l.layerData === layer)
    if (index === -1) return
    const deleted = this.layers.splice(index, 1)
    for (const d of deleted) {
      d.destroy()
    }
    // this.dispatchTypedEvent("update", new Event("update"))
  }

  public getTransform(): Partial<RenderTransform> {
    return {
      zoom: this.transform.zoom,
      position: this.transform.position,
      velocity: this.transform.velocity,
      dragging: this.transform.dragging,
      matrix: this.transform.matrix,
      matrixInverse: this.transform.matrixInverse,
      // update: this.transform.update
    }
  }

  public setTransform(transform: Partial<RenderTransform>): void {
    if (transform.zoom) {
      if (transform.zoom < settings.MIN_ZOOM) {
        transform.zoom = settings.MIN_ZOOM
      } else if (transform.zoom > settings.MAX_ZOOM) {
        transform.zoom = settings.MAX_ZOOM
      }
    }
    Object.assign(this.transform, transform)
    this.updateTransform()
  }

  public setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.find((layer) => layer.layerData.name === name)
    if (!layer) return
    layer.visible = visible
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public setLayerColor(name: string, color: vec3): void {
    const layer = this.layers.find((layer) => layer.layerData.name === name)
    if (!layer) return
    layer.color = color
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public setLayerTransform(name: string, transform: Partial<Transform>): void {
    const layer = this.layers.find((layer) => layer.layerData.name === name)
    if (!layer) return
    Object.assign(layer.transform, transform)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public sample(x: number, y: number): void {
    for (const layer of this.layers) {
      if (!layer.visible) continue
      const data = this.regl.read({
        framebuffer: layer.framebuffer,
        x,
        y,
        width: 1,
        height: 1,
      })
      if (data.reduce((acc, val) => acc + val, 0) > 0) {
        console.log(layer.layerData.name)
      }
    }
  }

  public select(pointer: vec2): QuerySelection[] {
    const selection: QuerySelection[] = []
    this.selections.forEach((layer) => layer.destroy())
    this.selections.length = 0
    this.world((context) => {
      // this.clearMeasurements()
      // const scale = Math.sqrt(context.transformMatrix[0] ** 2 + context.transformMatrix[1] ** 2) * context.viewportWidth
      // const epsilons = 100 / scale
      for (const layer of this.layers) {
        if (!layer.visible) continue
        const distances = layer.queryDistance(pointer, context)
        // const layerSelection = distances.filter((shape) => shape.distance <= 0)
        for (const select of distances) {
          // if (select.distance >= epsilons) continue
          selection.push({
            sourceLayer: layer.id,
            ...select,
            units: layer.layerData.artworkUnits,
          })

          // THIS IS A VISUAL AIDS FOR THE SELECTION SNAP POINT
          // this.measurements.addMeasurement(pointer)
          // this.measurements.finishMeasurement(select.snapPoint || pointer)
        }
        const selectionLayer = new Layer(layer.layerData.name + "_selection")
        // we want to deep clone this object to avoid the layer renderer from mutating the properties
        selectionLayer.artwork.fromJSON(this.copySelectionToImage(distances))
        selectionLayer.artworkUnits = layer.layerData.artworkUnits

        const newSelectionLayer = new LayerRenderer({
          regl: this.regl,
          color: [0.5, 0.5, 0.5],
          alpha: 0.7,
          layerData: selectionLayer,
          stepData: this.stepData,
          projectData: this.projectData,
          id: layer.id,
          transform: layer.transform,
        })
        newSelectionLayer.onUpdate(() => {
          this.dispatchTypedEvent("update", new Event("update"))
        })
        this.selections.push(newSelectionLayer)
      }
    })
    console.log("Selection:", selection)
    this.dispatchTypedEvent("update", new Event("update"))
    return selection
  }

  public snap(pointer: vec2): vec2 {
    if (settings.SNAP_MODE == SnapMode.OFF) return pointer

    let closest: ShapeDistance | undefined = undefined
    this.world((context) => {
      for (const layer of this.layers) {
        if (!layer.visible) continue
        const layerSelection = layer.queryDistance(pointer, context)
        for (const select of layerSelection) {
          if (closest == undefined) {
            closest = select
            continue
          }
          if (closest.snapPoint == undefined) {
            closest = select
            continue
          }
          if (select.snapPoint == undefined) continue
          if (vec2.dist(pointer, select.snapPoint) < vec2.dist(pointer, closest.snapPoint)) {
            closest = select
          }
        }
      }
    })
    // console.log(closest)
    if (closest == undefined) return pointer
    if ((closest as ShapeDistance).snapPoint == undefined) return pointer
    return (closest as ShapeDistance).snapPoint!
  }

  private copySelectionToImage(selection: ShapeDistance[]): Shapes.Shape[] {
    const image: Shapes.Shape[] = []
    for (const select of selection) {
      // we want to deep clone this object to avoid the layer renderer from mutating the properties
      const shape = JSON.parse(JSON.stringify(select.shape)) as Shapes.Shape
      // if (select.children.length > 0) {
      //   if (shape.type == FeatureTypeIdentifier.STEP_AND_REPEAT) {
      //     shape.shapes = this.copySelectionToImage(select.children)
      //   }
      //   if (shape.type == FeatureTypeIdentifier.PAD && shape.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION) {
      //     shape.symbol.shapes = this.copySelectionToImage(select.children)
      //   }
      // }
      image.push(shape)
    }
    return image
  }

  public clearSelection(): void {
    this.selections.length = 0
  }

  public setPointer(mouse: Partial<Pointer>): void {
    Object.assign(this.pointer, mouse)
    if (this.pointer.down) {
      this.dispatchTypedEvent("update", new Event("update"))
    }
  }

  public async zoomFit(): Promise<void> {
    const boundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity),
    }
    this.transform.velocity = vec2.fromValues(0, 0)
    for (const layer of this.layers) {
      // TODO: make for loop parallel
      const layerBoundingBox = layer.getBoundingBox()
      boundingBox.min = vec2.min(boundingBox.min, boundingBox.min, layerBoundingBox.min)
      boundingBox.max = vec2.max(boundingBox.max, boundingBox.max, layerBoundingBox.max)
    }

    const screenWidthPx = this.viewBox.width
    const screenHeightPx = this.viewBox.height
    const screenAR = screenWidthPx / screenHeightPx
    const unitToPx = screenHeightPx / 2 / 1 // px per unit
    const bbWidthPx = (boundingBox.max[0] - boundingBox.min[0]) * unitToPx
    const bbHeightPx = (boundingBox.max[1] - boundingBox.min[1]) * unitToPx
    const bbAR = bbWidthPx / bbHeightPx
    // console.log('Screen Width, Height:', screenWidthPx, screenHeightPx)
    // console.log('Screen AR:', screenAR)
    // console.log('BB Width, Height:', bbWidthPx, bbHeightPx)
    // console.log('BB AR:', bbAR)
    // zooming zooms to canvas -1,-1
    const origin = vec2.fromValues(-1, 1)
    const originPx = vec2.scale(vec2.create(), origin, unitToPx)
    const bbTopLeft = vec2.fromValues(boundingBox.min[0] * unitToPx, boundingBox.max[1] * unitToPx)
    const bbTopLeftToOrigin = vec2.sub(vec2.create(), originPx, bbTopLeft)

    // boundingBox logic validation
    if (boundingBox.min[0] === Infinity || boundingBox.min[1] === Infinity || boundingBox.max[0] === -Infinity || boundingBox.max[1] === -Infinity)
      return
    if (boundingBox.min[0] > boundingBox.max[0] || boundingBox.min[1] > boundingBox.max[1]) return
    if (isNaN(boundingBox.min[0]) || isNaN(boundingBox.min[1]) || isNaN(boundingBox.max[0]) || isNaN(boundingBox.max[1])) return

    if (bbAR > screenAR) {
      const zoom = screenWidthPx / bbWidthPx
      const bbTopLeftToOriginScaled = vec2.scale(vec2.create(), bbTopLeftToOrigin, zoom)
      const offsetX = bbTopLeftToOriginScaled[0]
      const offsetY = -bbTopLeftToOriginScaled[1] + screenHeightPx / 2 - (bbHeightPx * zoom) / 2
      this.setTransform({ position: [offsetX, offsetY], zoom })
    } else {
      const zoom = screenHeightPx / bbHeightPx
      const bbTopLeftToOriginScaled = vec2.scale(vec2.create(), bbTopLeftToOrigin, zoom)
      const offsetX = bbTopLeftToOriginScaled[0] + screenWidthPx / 2 - (bbWidthPx * zoom) / 2
      const offsetY = -bbTopLeftToOriginScaled[1]
      this.setTransform({ position: [offsetX, offsetY], zoom })
    }
    this.dispatchTypedEvent("update", new Event("update"))
  }

  // public startLoading(): void {
  //   this.loadingFrame.start()
  // }

  // public stopLoading(): void {
  //   this.loadingFrame.stop()
  // }

  public addMeasurement(point: vec2): void {
    const pointSnap = this.snap(point)
    this.measurements.addMeasurement(pointSnap)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public updateMeasurement(point: vec2): void {
    this.measurements.updateMeasurement(point)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public finishMeasurement(point: vec2): void {
    const pointSnap = this.snap(point)
    this.measurements.finishMeasurement(pointSnap)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public getMeasurements(): { point1: vec2; point2: vec2 }[] {
    return this.measurements.getMeasurements()
  }

  public getCurrentMeasurement(): { point1: vec2; point2: vec2 } | null {
    return this.measurements.getCurrentMeasurement()
  }

  public clearMeasurements(): void {
    this.measurements.clearMeasurements()
    this.dispatchTypedEvent("update", new Event("update"))
  }

  // public setMeasurementUnits(units: Units): void {
  //   this.measurements.setMeasurementUnits(units)
  //   this.eventTarget.dispatchTypedEvent("update", new Event("update"))
  // }

  public render(): void {
    this.world((context) => {

      this.regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
      })

      this.utilitiesRenderer.render(context)
      this.drawCollections.overlay(() => this.drawCollections.renderToScreen({ renderTexture: this.utilitiesRenderer.framebuffer }))

      for (const layer of this.layers) {
        if (!layer.visible) continue
        layer.render(context)
        this.drawCollections.blend(() => {
          if (settings.COLOR_BLEND == ColorBlend.OVERLAY) {
            this.drawCollections.overlayBlendFunc(() => this.drawCollections.renderToScreen({ renderTexture: layer.framebuffer }))
          } else {
            this.drawCollections.contrastBlendFunc(() => this.drawCollections.renderToScreen({ renderTexture: layer.framebuffer }))
          }
        })
      }
      for (const selection of this.selections) {
        selection.render(context)
        this.drawCollections.overlay(() => this.drawCollections.renderToScreen({ renderTexture: selection.framebuffer }))
      }
      this.measurements.render(context)
      this.drawCollections.overlay(() => this.drawCollections.renderToScreen({ renderTexture: this.measurements.framebuffer }))
    })
  }

  public destroy(): void {
    super.unSubscribe()
    this.layersSubscriptionControler.abort()
    for (const layer of this.layers) {
      layer.destroy()
    }
    for (const selection of this.selections) {
      selection.destroy()
    }
    this.measurements.destroy()
    this.utilitiesRenderer.framebuffer.destroy()
  }
}

export function logMatrix(matrix: mat3): void {
  console.log(
    `${Math.round(matrix[0] * 100) / 100}, ${Math.round(matrix[1] * 100) / 100}, ${Math.round(matrix[2] * 100) / 100},\n` +
      `${Math.round(matrix[3] * 100) / 100}, ${Math.round(matrix[4] * 100) / 100}, ${Math.round(matrix[5] * 100) / 100},\n` +
      `${Math.round(matrix[6] * 100) / 100}, ${Math.round(matrix[7] * 100) / 100}, ${Math.round(matrix[8] * 100) / 100}`,
  )
}

// export interface LoadingRenderProps {}

// interface LoadingRenderUniforms {}

// class LoadingAnimation {
//   private regl: REGL.Regl
//   private renderLoading: REGL.DrawCommand<REGL.DefaultContext, LoadingRenderProps>
//   private tick: REGL.Cancellable = { cancel: () => {} }
//   private world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>

//   private _enabled = false

//   get enabled(): boolean {
//     return this._enabled
//   }

//   constructor(regl: REGL.Regl, world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>) {
//     this.regl = regl
//     this.world = world
//     this.renderLoading = this.regl<LoadingRenderUniforms, Record<string, never>, LoadingRenderProps>({
//       vert: FullScreenQuad,
//       frag: LoadingFrag,
//     })
//     // this.start()
//   }

//   public start(): void {
//     this._enabled = true
//     this.tick = this.regl.frame(() => {
//       this.world(() => {
//         this.renderLoading()
//       })
//     })
//   }

//   public stop(): void {
//     this._enabled = false
//     this.tick.cancel()
//   }
// }

interface BaseFrameBufferRendererUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
}

class BaseFrameBufferRenderer {
  protected regl: REGL.Regl
  protected reglRenderConfig: REGL.DrawCommand<REGL.DefaultContext>
  protected drawCollections: TLoadedReglRenderers
  public transform: ShapeTransform = new ShapeTransform()
  public framebuffer: REGL.Framebuffer2D

  constructor(regl: REGL.Regl) {
    this.regl = regl
    this.reglRenderConfig = this.regl<BaseFrameBufferRendererUniforms>({
      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.inverseMatrix,
      },
    })
    this.framebuffer = this.regl.framebuffer()
    this.drawCollections = ReglRenderers as TLoadedReglRenderers
  }

  protected render(context: REGL.DefaultContext & WorldContext, callback: () => void): void {
    const origMatrix = mat3.clone(context.transformMatrix)
    this.transform.update(context.transformMatrix)
    context.transformMatrix = this.transform.matrix

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })

    this.framebuffer.use(() => {
      this.reglRenderConfig(() => {
        callback()
      })
    })

    context.transformMatrix = origMatrix
  }
}

class UtilitiesRenderer extends BaseFrameBufferRenderer {
  private renderGrid: REGL.DrawCommand<REGL.DefaultContext>
  constructor(regl: REGL.Regl) {
    super(regl)
    this.renderGrid = this.regl({
      uniforms: {
        u_BackgroundColor: () => settings.BACKGROUND_COLOR,
      },
      depth: {
        enable: true,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
    })
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    super.render(context, () => {
      this.renderGrid(() => {
        if (origin.enabled) this.drawCollections.renderOrigin()
        if (gridSettings.enabled) this.drawCollections.renderGrid(gridSettings)
      })
    })
  }
}
