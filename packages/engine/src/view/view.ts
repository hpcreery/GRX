import type * as Shapes from "@grx/artwork-format/shape"
import type { BoundingBox, Units } from "@grx/artwork-format/types"
import { ShapesBufferCollection } from "@src/data/artwork-collections"
import { DataInterface } from "@src/data/interface"
import type { Step, StepLayer } from "@src/data/project"
import { type mat3, type mat4, vec2, vec4 } from "gl-matrix"
import type REGL from "regl"
import type { ViewSettings } from "../settings"
import { defaultViewSettings, gridSettings, origin, settings } from "../settings"
import type { ShapeDistance, TShapeTransform } from "../types"
import { ColorBlend, SNAP_MODES_MAP, SnapMode, type ViewBox } from "../types"
import { ndcToWorld3D, UID, UpdateEventTarget } from "../utils"
import { ReglRenderers, type TLoadedReglRenderers } from "./gl-commands"
import LayerRenderer, { SelectionRenderer } from "./layer"
import { SimpleMeasurement } from "./measurements"
import type Transform from "./shape-transform"
import ShapeTransform from "./shape-transform"
import { type TViewTransform, ViewTransform } from "./view-transform"
// import type { BinaryMask, Bounds } from "@grx/contours"
// import init, { initSync, vectorize_bytes, vectorize_rgba } from "../contours-vtracer/pkg/vtracer_wasm.js"

export type DrawWorldProps = {}

interface DrawWorldUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Transform3D: mat4
  u_ZOffset: number
  u_Perspective3D: boolean
  u_Resolution: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
  u_SkeletonMode: boolean
  u_SnapMode: number
  u_PointerPosition: vec2
  u_PointerDown: boolean
  u_QueryMode: boolean
  u_Time: number
  u_Color: vec4
}

interface DrawWorldAttributes {
  a_Vertex_Position: vec2[]
}

export interface DrawWorldContext {
  viewSettings: ViewSettings
  transform: TViewTransform
  resolution: vec2
  transformMatrix: mat3
  zOffset: number
  preRender: undefined
}

export interface ViewRendererConfig {
  id?: string
  dataStep: Step
  viewBox: ViewBox
  regl: REGL.Regl
}

export interface LayerInfo {
  name: string
  id: string
  color: vec4
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
  // units: Units
}

export class ViewRenderer extends UpdateEventTarget {
  public id: string = UID()
  public dataStep: Step

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }

  public settings: ViewSettings = {
    ...defaultViewSettings,
  }
  public transform = new ViewTransform({}, this.settings)


  public layers: LayerRenderer[] = []
  public selections: SelectionRenderer[] = []

  public regl: REGL.Regl
  private drawWorld: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext, DrawWorldProps>

  protected drawCollections: TLoadedReglRenderers

  // public loadingFrame: LoadingAnimation
  public measurements: SimpleMeasurement

  private utilitiesRenderer: UtilitiesRenderer

  private layersSubscriptionControler: AbortController

  constructor({ viewBox, regl, id, dataStep }: ViewRendererConfig) {
    super()
    this.id = id || UID()
    this.dataStep = dataStep

    this.transform.onUpdate(() => this.announceUpdate())
    this.transform.setTransform({ viewBox, position: [viewBox.width / 2, viewBox.height / 2] })

    this.regl = regl

    this.utilitiesRenderer = new UtilitiesRenderer(regl)

    this.drawWorld = this.regl<DrawWorldUniforms, DrawWorldAttributes, DrawWorldProps, DrawWorldContext>({
      context: {
        viewSettings: this.settings,
        transformMatrix: () => this.transform.matrix,
        transform: () => this.transform,
        resolution: () => [this.transform.viewBox.width, this.transform.viewBox.height],
        zOffset: 0.0,
        preRender: () => {
          // this.transform.update()
        },
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        u_ZOffset: (context) => context.zOffset || 0.0,
        u_Color: vec4.fromValues(1.0, 1.0, 1.0, 1.0),
        u_Transform3D: () => this.transform.matrix3D,
        u_Perspective3D: () => this.settings.PERSPECTIVE_3D,
        u_Resolution: () => [this.transform.viewBox.width, this.transform.viewBox.height],
        // u_PixelSize: 2,
        u_PixelSize: () => (this.settings.PERSPECTIVE_3D && this.settings.ENABLE_3D ? 1 : 2),
        u_OutlineMode: () => this.settings.OUTLINE_MODE,
        u_SkeletonMode: () => this.settings.SKELETON_MODE,
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

      scissor: {
        enable: true,
        box: () => this.transform.viewBox,
      },

      viewport: () => this.transform.viewBox,

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

    this.layersSubscriptionControler = new AbortController()
    this.createLayers()

    this.transform.zoomAboutPoint(0, 0, this.transform.zoom)
    this.announceUpdate()
  }

  /**
   * Get world coordinates from screen coordinates
   * @param x pixel x coord (0,0) is lower left of the viewport
   * @param y pixel y coord (0,0) is lower left of the viewport
   * @param z z coord used as u_ZOffset (layer z offset)
   * @returns world coordinates [x, y]
   */
  public getWorldCoordFromScreenCoord(x: number, y: number, z: number): [number, number] {
    const { width, height } = this.transform.viewBox

    // Normalize the mouse position to NDC (-1 .. 1)
    const nx = (x / width) * 2 - 1
    const ny = (y / height) * 2 - 1

    return ndcToWorld3D(nx, ny, z, this.transform.matrix, this.transform.matrix3D, this.settings.PERSPECTIVE_3D)
  }

  /**
   * Init/Create layers from data step
   */
  private createLayers(): void {
    this.layersSubscriptionControler.abort()
    this.layersSubscriptionControler = new AbortController()
    DataInterface.subscribe_to_matrix(
      this.dataStep.matrix.project,
      () => {
        this.updateLayers()
      },
      { signal: this.layersSubscriptionControler.signal },
    )
    this.updateLayers()
  }

  /**
   * Sync method to update layers to match data step. Add new layers and remove deleted layers.
   */
  public updateLayers(): void {
    for (const layer of this.dataStep.layers) {
      if (this.layers.find((l) => l.dataLayer === layer)) continue
      this.addLayer(layer)
    }
    for (const layer of this.layers) {
      if (this.dataStep.layers.find((l) => l === layer.dataLayer)) continue
      this.deleteLayer(layer.dataLayer)
    }
  }

  /**
   * Add layer to view
   * @param dataLayer StepLayer to add
   */
  private addLayer(dataLayer: StepLayer): void {
    const layerRenderer = new LayerRenderer({
      regl: this.regl,
      dataLayer,
      color: vec4.fromValues(Math.random(), Math.random(), Math.random(), 1.0),
      visible: true,
    })
    this.layers.push(layerRenderer)
    layerRenderer.onUpdate(() => {
      this.announceUpdate()
    })
    this.announceUpdate()
  }

  /**
   * Delete layer from view
   * @param layer StepLayer to delete
   */
  private deleteLayer(layer: StepLayer): void {
    const index = this.layers.findIndex((l) => l.dataLayer === layer)
    if (index === -1) return
    const deleted = this.layers.splice(index, 1)
    for (const d of deleted) {
      d.destroy()
    }
    this.announceUpdate()
  }

  public updateSettings(settings: Partial<ViewSettings>): void {
    Object.assign(this.settings, settings)
    this.transform.updateSettings(this.settings)
    this.announceUpdate()
  }

  /**
   * Get layer visibility by name
   */
  public getLayerVisibility(name: string): boolean {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) throw new Error(`Layer ${name} not found`)
    return layer.visible
  }

  /**
   * Toggle layer visibility by name
   */
  public setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) return
    layer.visible = visible
    this.announceUpdate()
  }

  /**
   * Get layer color by name
   */
  public getLayerColor(name: string): vec4 {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) throw new Error(`Layer ${name} not found`)
    return layer.color
  }

  /**
   * Set layer color by name
   */
  public setLayerColor(name: string, color: vec4): void {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) return
    layer.color = color
    this.announceUpdate()
  }

  /**
   * Get layer transform by name
   */
  public getLayerTransform(name: string): TShapeTransform {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) throw new Error(`Layer ${name} not found`)
    return layer.transform.getTransform()
  }

  /**
   * Set layer transform by name
   */
  public setLayerTransform(name: string, transform: Partial<TShapeTransform>): void {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) return
    layer.transform.setTransform(transform)
    this.announceUpdate()
  }

  // public sample(x: number, y: number): void {
  //   for (const layer of this.layers) {
  //     if (!layer.visible) continue
  //     const data = this.regl.read({
  //       framebuffer: layer.framebuffer,
  //       x,
  //       y,
  //       width: 1,
  //       height: 1,
  //     })
  //     if (data.reduce((acc, val) => acc + val, 0) > 0) {
  //       console.log(layer.dataLayer.layer.name)
  //     }
  //   }
  // }

  /**
   * Select shapes at pointer position
   * @param pointer vec2 of gl screen/view coordinates
   * @returns list of QuerySelection objects
   */
  public select(pointer: vec2): QuerySelection[] {
    const selection: QuerySelection[] = []
    this.selections.forEach((layer) => layer.destroy())
    this.selections.length = 0
    const origSnapMode = settings.SNAP_MODE
    settings.SNAP_MODE = SnapMode.EDGE
    this.drawWorld(() => {
      for (const layer of this.layers) {
        if (!layer.visible) continue

        const distances = layer.queryDistance(pointer)
        const clicked = distances.filter((d) => d.distance != undefined && d.distance <= 0)
        if (clicked.length === 0) continue
        for (const select of clicked) {
          selection.push({
            sourceLayer: layer.dataLayer.layer.name,
            ...select,
          })

          // THIS IS A VISUAL AIDS FOR THE SELECTION SNAP POINT
          // const pointerWorldCoord = this.getWorldCoordFromScreenCoord(pointer[0], pointer[1], 0)
          // const snapPoint = vec2.clone(pointerWorldCoord)
          // if (select.direction != undefined && select.distance != undefined) {
          //   const offset = vec2.create()
          //   vec2.scale(offset, select.direction, select.distance)
          //   vec2.sub(snapPoint, snapPoint, offset)
          // }
          // this.measurements.addMeasurement(pointerWorldCoord)
          // this.measurements.finishMeasurement(snapPoint)
        }
        const selectionImage = new ShapesBufferCollection()
        selectionImage.fromJSON(this.copySelectionToImage(clicked))

        const newSelectionLayer = new SelectionRenderer({
          regl: this.regl,
          image: selectionImage,
          transform: layer.transform,
          sourceLayer: layer.dataLayer.layer,
        })
        // newSelectionLayer.onUpdate(() => {
        //   this.announceUpdate()
        // })
        this.selections.push(newSelectionLayer)
      }
    })
    settings.SNAP_MODE = origSnapMode
    this.announceUpdate()
    return selection
  }

  /**
   * Snap pointer to closest shape point. If no snap points found, return original pointer. Snap mode/position is determined by global settings.
   * @param pointer vec2 of gl screen/view coordinates
   * @returns vec2 snapped point in world coordinates
   */
  public snapPointerToClosestVisibleShape(pointer: vec2): vec2 {
    const pointerWorldCoord = this.getWorldCoordFromScreenCoord(pointer[0], pointer[1], 0)
    if (settings.SNAP_MODE == SnapMode.OFF) return pointerWorldCoord

    let closest: ShapeDistance | undefined
    this.drawWorld(() => {
      for (const layer of this.layers) {
        if (!layer.visible) continue
        const layerSelection = layer.queryDistance(pointer)
        for (const select of layerSelection) {
          if (select.distance == undefined) continue
          if (closest == undefined) {
            closest = select
            continue
          }
          if (closest.distance == undefined) {
            closest = select
            continue
          }
          if (Math.abs(select.distance) < Math.abs(closest.distance)) {
            closest = select
          }
        }
      }
    })
    if (closest == undefined) return pointerWorldCoord
    if (closest.distance == undefined) return pointerWorldCoord
    const snapPoint = vec2.clone(pointerWorldCoord)
    if (closest.direction != undefined && closest.distance != undefined) {
      const offset = vec2.create()
      vec2.scale(offset, closest.direction, closest.distance)
      vec2.sub(snapPoint, snapPoint, offset)
    }
    return snapPoint
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
      this.announceUpdate()
    }
  }

  /**
   * Zoom the view to fit all layers.
   * @returns void
   */
  public zoomToFitLayers(): void {
    const boundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity),
    }
    for (const layer of this.layers) {
      // TODO: make for loop parallel
      const layerBoundingBox = layer.getBoundingBox()
      boundingBox.min = vec2.min(boundingBox.min, boundingBox.min, layerBoundingBox.min)
      boundingBox.max = vec2.max(boundingBox.max, boundingBox.max, layerBoundingBox.max)
    }
    this.transform.zoomToBox(boundingBox)
  }

  // public startLoading(): void {
  //   this.loadingFrame.start()
  // }

  // public stopLoading(): void {
  //   this.loadingFrame.stop()
  // }

  /**
   * Create a measurement
   * @param point vec2 of gl screen/view coordinates
   */
  public addMeasurement(point: vec2): void {
    const snapCoord = this.snapPointerToClosestVisibleShape(point)
    this.measurements.addMeasurement(snapCoord)
    this.announceUpdate()
  }

  /**
   * Update current measurement
   * @param point vec2 of gl screen/view coordinates
   */
  public updateMeasurement(point: vec2): void {
    // const snapCoord = this.snap(point)
    const coord = this.getWorldCoordFromScreenCoord(point[0], point[1], 0)
    this.measurements.updateMeasurement(coord)
    this.announceUpdate()
  }

  /**
   * Finish current measurement
   * @param point vec2 of gl screen/view coordinates
   */
  public finishMeasurement(point: vec2): void {
    const snapCoord = this.snapPointerToClosestVisibleShape(point)
    this.measurements.finishMeasurement(snapCoord)
    this.announceUpdate()
  }

  public getMeasurements(): { point1: vec2; point2: vec2 }[] {
    return this.measurements.getMeasurements()
  }

  public getCurrentMeasurement(): { point1: vec2; point2: vec2 } | null {
    return this.measurements.getCurrentMeasurement()
  }

  public clearMeasurements(): void {
    this.measurements.clearMeasurements()
    this.announceUpdate()
  }

  // public setMeasurementUnits(units: Units): void {
  //   this.measurements.setMeasurementUnits(units)
  //   this.eventTarget.announceUpdate()
  // }

  private renderLayerArtwork(): void {
    // determine layer draw order based on 3d rotation
    const sortedLayers = this.layers.slice().sort((a, b) => {
      const aIndex = this.dataStep.matrix.layers.indexOf(a.dataLayer.layer)
      const bIndex = this.dataStep.matrix.layers.indexOf(b.dataLayer.layer)
      return bIndex - aIndex
    })

    const rotatedX = Math.abs(this.transform.rotation[0]) % 360
    const rotatedY = Math.abs(this.transform.rotation[1]) % 360
    if (this.settings.ENABLE_3D && (rotatedX > 90 && rotatedX < 270) != (rotatedY > 90 && rotatedY < 270)) {
      sortedLayers.reverse()
    }

    for (const layer of sortedLayers) {
      if (!layer.visible) continue

      layer.render()
      this.drawCollections.blend(() => {
        if (settings.COLOR_BLEND == ColorBlend.OVERLAY) {
          this.drawCollections.overlayBlendFunc(() =>
            this.drawCollections.renderTextureToScreen({
              renderTexture: layer.framebuffer,
            }),
          )
        } else if (settings.COLOR_BLEND == ColorBlend.CONTRAST) {
          this.drawCollections.contrastBlendFunc(() =>
            this.drawCollections.renderTextureToScreen({
              renderTexture: layer.framebuffer,
            }),
          )
        }
        // TODO: add more blend modes here
        else {
          this.drawCollections.opaqueBlendFunc(() =>
            this.drawCollections.renderTextureToScreen({
              renderTexture: layer.framebuffer,
            }),
          )
        }
      })
    }
  }

  public render(): void {
    this.drawWorld(() => {
      this.regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
      })

      // render the grid and origin datum first, under the artwork
      this.utilitiesRenderer.render()
      this.drawCollections.overlay(() => this.drawCollections.renderTextureToScreen({ renderTexture: this.utilitiesRenderer.framebuffer }))

      // render the layer artwork
      this.renderLayerArtwork()

      // render the selections on top of the artwork
      for (const selection of this.selections) {
        selection.render()
        this.drawCollections.overlay(() => this.drawCollections.renderTextureToScreen({ renderTexture: selection.framebuffer }))
      }

      // render the measurements on top of everything else
      this.measurements.render()
      this.drawCollections.overlay(() => this.drawCollections.renderTextureToScreen({ renderTexture: this.measurements.framebuffer }))
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

interface BaseFrameBufferRendererContext {
  preRender: undefined
}

class BaseFrameBufferRenderer {
  protected regl: REGL.Regl
  protected reglRenderConfig: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext & BaseFrameBufferRendererContext>
  protected drawCollections: TLoadedReglRenderers
  public transform: ShapeTransform = new ShapeTransform()
  public framebuffer: REGL.Framebuffer2D

  constructor(regl: REGL.Regl) {
    this.regl = regl
    this.framebuffer = this.regl.framebuffer()
    this.reglRenderConfig = this.regl<
      BaseFrameBufferRendererUniforms,
      Record<string, never>,
      Record<string, never>,
      BaseFrameBufferRendererContext,
      REGL.DefaultContext & DrawWorldContext
    >({
      context: {
        preRender: (context) => {
          // resize framebuffer before clearing
          this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
          this.regl.clear({
            framebuffer: this.framebuffer,
            color: [0, 0, 0, 0],
            depth: 0,
          })
          this.transform.update(context.transformMatrix)
        },
      },
      framebuffer: this.framebuffer,
      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
      },
    })
    this.drawCollections = ReglRenderers as TLoadedReglRenderers
  }

  protected render(callback: () => void): void {
    this.reglRenderConfig(() => {
      callback()
    })
  }

  protected destroy(): void {
    this.framebuffer.destroy()
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

  public render(): void {
    super.render(() => {
      this.renderGrid(() => {
        if (origin.enabled) this.drawCollections.renderOrigin()
        if (gridSettings.enabled) this.drawCollections.renderGrid(gridSettings)
      })
    })
  }
}
