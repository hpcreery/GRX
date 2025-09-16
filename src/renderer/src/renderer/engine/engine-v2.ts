import REGL from "regl"
import { mat3, vec2, vec3 } from "gl-matrix"
import { LayerRendererProps } from "./step/layer/layer"
import { initializeFontRenderer, initializeRenderers } from "./step/layer/collections"
import * as Comlink from "comlink"
import type { PluginsDefinition, AddLayerProps } from "./plugins"
import { type Units } from "./types"
import { Transform } from "./transform"
import { ShapeDistance } from "./step/layer/shape-renderer"
import { StepRenderer } from "./step/step"
import type { RenderSettings, GridSettings, MeasurementSettings } from "./settings"
import { settings, gridSettings, measurementSettings } from "./settings"

export interface UniverseProps {}

interface UniverseUniforms {}

interface UniverseAttributes {}

export interface UniverseContext {}

export interface RenderEngineConfig {
  attributes?: WebGLContextAttributes | undefined
  container: DOMRect
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
  // context: string
  // type: string
  units: Units
  visible: boolean
  // format: string
  transform: Transform
}

export const EngineEvents = {
  RENDER: "RENDER",
  LAYERS_CHANGED: "LAYERS_CHANGED",
  MESSAGE: "MESSAGE",
} as const

export type TEngineEvents = (typeof EngineEvents)[keyof typeof EngineEvents]

export const MessageLevel = {
  INFO: "blue",
  WARN: "yellow",
  ERROR: "red",
} as const

export type TMessageLevel = (typeof MessageLevel)[keyof typeof MessageLevel]

export interface Pointer {
  x: number
  y: number
  down: boolean
}

export interface QuerySelection extends ShapeDistance {
  sourceLayer: string
  units: Units
}

export type RenderProps = Partial<typeof Engine.defaultRenderProps>

export interface MessageData {
  level: TMessageLevel
  title: string
  message: string
}

export class Engine {
  static defaultRenderProps = { force: false, updateLayers: true }

  public offscreenCanvasGL: OffscreenCanvas

  public boundingBox: DOMRect

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }

  public regl: REGL.Regl
  private universe: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, UniverseProps>

  // public loadingFrame: LoadingAnimation
  // public measurements: SimpleMeasurement

  public parsers: PluginsDefinition = {}

  public views: Map<string, StepRenderer> = new Map()
  // public steps: StepRenderer[] = []

  private renderNowInterval: NodeJS.Timeout | null = null

  constructor(offscreenCanvasGL: OffscreenCanvas, { attributes, container }: RenderEngineConfig) {
    this.offscreenCanvasGL = offscreenCanvasGL
    this.boundingBox = {
      ...container,
      // width: container.width * dpr,
      // height: container.height * dpr,
    }

    const gl = offscreenCanvasGL.getContext("webgl", attributes)!

    console.log("WEBGL VERSION", gl.getParameter(gl.VERSION))

    this.regl = REGL({
      gl,
      pixelRatio: 1,
      extensions: [
        "angle_instanced_arrays",
        "OES_texture_float",
        "webgl_depth_texture",
        "EXT_frag_depth",
        "EXT_blend_minmax",
        // "WEBGL_color_buffer_float",
        // "EXT_disjoint_timer_query",
        "OES_standard_derivatives"
      ],
      profile: true,
    })
    console.log("WEBGL LIMITS", this.regl.limits)

    initializeRenderers(this.regl)

    this.regl.clear({
      depth: 0,
    })

    this.universe = this.regl<UniverseUniforms, UniverseAttributes, UniverseProps, UniverseContext>({})

    this.render()
  }

  public setSettings(newSettings: Partial<RenderSettings>): void {
    Object.assign(settings, newSettings)
    this.render()
  }

  public getSettings(): RenderSettings {
    return settings
  }

  public setGrid(newGrid: Partial<GridSettings>): void {
    Object.assign(gridSettings, newGrid)
    this.render()
  }

  public getGrid(): GridSettings {
    return gridSettings
  }

  public getMeasurementSettings(): MeasurementSettings {
    return measurementSettings
  }

  public setMeasurementSettings(newSettings: Partial<MeasurementSettings>): void {
    Object.assign(measurementSettings, newSettings)
    this.render()
  }

  public renderDispatch = (): void => this.render()

  public addView(id: string, name: string, viewBox: DOMRect): void {
    const newStep = new StepRenderer({
      regl: this.regl,
      viewBox,
      name,
      id,
    })
    newStep.eventTarget.addEventListener("RENDER", this.renderDispatch)
    this.views.set(id, newStep)
    this.render()
  }

  // public addStep(name: string, viewBox: DOMRect): void {
  //   const newStep = new ViewRenderer({
  //     regl: this.regl,
  //     viewBox,
  //   })
  //   newStep.eventTarget.addEventListener("RENDER", this.renderDispatch)
  //   this.steps.set(name, newStep)
  //   this.render()
  // }

  public updateBoundingBox(box: DOMRect): void {
    // this.boundingBox.width = box.width * dpr
    // this.boundingBox.height = box.height * dpr
    let boxChanged = false
    for (const key in this.boundingBox) {
      if (box[key] !== this.boundingBox[key]) {
        boxChanged = true
        break
      }
    }
    this.boundingBox = box
    this.offscreenCanvasGL.width = this.boundingBox.width
    this.offscreenCanvasGL.height = this.boundingBox.height
    this.regl.poll()
    if (boxChanged) {
      this.render()
    }
    // this.updateTransform()
  }

  public updateViewBox(view: string, viewBox: DOMRect): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    viewBox.y = this.boundingBox.height - viewBox.bottom + this.boundingBox.y
    viewBox.x = viewBox.x - this.boundingBox.x
    this.views.get(view)!.updateViewBox(viewBox)
  }

  public toss(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.toss()
  }

  public moveViewport(view: string, x: number, y: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.moveViewport(x, y)
  }

  public grabViewport(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.grabViewport()
  }

  public releaseViewport(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.releaseViewport()
  }

  public zoom(view: string, x: number, y: number, s: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoom(x, y, s)
  }

  public isDragging(view: string): boolean {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.isDragging()
  }

  public updateTransform(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    // return this.steps.get(view)!.updateTransform()
    const transform = this.views.get(view)!.updateTransform()
    return transform
  }

  public zoomAtPoint(view: string, x: number, y: number, s: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoomAtPoint(x, y, s)
  }

  public getWorldPosition(view: string, x: number, y: number): [number, number] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getWorldPosition(x, y)
  }

  /**
   * @deprecated Use data api instead.
   */
  public async addLayer(view: string, params: AddLayerProps): Promise<void> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.addLayer(params)
  }

  /**
   * @deprecated Use data api instead.
   */
  public async addFile(view: string, buffer: ArrayBuffer, params: {format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.addFile(buffer, params)
  }

  /**
   * @deprecated Use data api instead.
   */
  public getLayers(view: string): LayerInfo[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getLayers()
  }

  public getTransform(view: string): Partial<RenderTransform> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getTransform()
  }

  public setTransform(view: string, transform: Partial<RenderTransform>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setTransform(transform)
  }

  /**
   * @deprecated Use data api instead.
   */
  public removeLayer(view: string, id: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.removeLayer(id)
  }

  /**
   * @deprecated Use data api instead.
   */
  public moveLayer(view: string, from: number, to: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.moveLayer(from, to)
  }

  /**
   * @deprecated Use data api instead.
   */
  public setLayerProps(view: string, id: string, props: Partial<Omit<LayerRendererProps, "regl">>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setLayerProps(id, props)
  }

  public setLayerTransform(view: string, id: string, transform: Partial<Transform>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setLayerTransform(id, transform)
  }

  public addEventCallback(view: string, event: TEngineEvents, listener: (data: MessageData | null) => void): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.addEventCallback(event, listener)
  }

  public sample(view: string, x: number, y: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.sample(x, y)
  }

  public select(view: string, pointer: vec2): QuerySelection[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    let selection: QuerySelection[] = []
    selection = this.views.get(view)!.select(pointer)
    return selection
  }

  public snap(view: string, pointer: vec2): vec2 {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    let snapped: vec2 = pointer
    snapped = this.views.get(view)!.snap(pointer)
    return snapped
  }

  public clearSelection(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.clearSelection()
  }

  public setPointer(view: string, mouse: Partial<Pointer>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setPointer(mouse)
  }

  public async zoomFit(view: string): Promise<void> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoomFit()
  }

  // public startLoading(): void {
  //   this.loadingFrame.start()
  // }

  // public stopLoading(): void {
  //   this.loadingFrame.stop()
  // }

  public addMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.addMeasurement(point)
  }

  public updateMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.updateMeasurement(point)
  }

  public finishMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.finishMeasurement(point)
  }

  public getMeasurements(view: string): { point1: vec2; point2: vec2 }[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getMeasurements()
  }

  public getCurrentMeasurement(view: string): { point1: vec2; point2: vec2 } | null {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getCurrentMeasurement()
  }

  public clearMeasurements(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.clearMeasurements()
  }

  public getLayersQueue(view: string): {
    name: string
    id: string
  }[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.layersQueue
  }

  public render(): void {
    if (this.renderNowInterval) return
    this.renderNowInterval = setTimeout(() => {
      this.renderNowInterval = null
      this.universe((_context) => {
        this.views.forEach((view) => {
          view.render()
        })
      })
    }, settings.MSPFRAME)
  }

  public getStats(): Stats {
    return {
      regl: {
        totalTextureSize: this.regl.stats.getTotalTextureSize ? this.regl.stats!.getTotalTextureSize() : -1,
        totalBufferSize: this.regl.stats.getTotalBufferSize ? this.regl.stats!.getTotalBufferSize() : -1,
        totalRenderbufferSize: this.regl.stats.getTotalRenderbufferSize ? this.regl.stats!.getTotalRenderbufferSize() : -1,
        maxUniformsCount: this.regl.stats.getMaxUniformsCount ? this.regl.stats!.getMaxUniformsCount() : -1,
        maxAttributesCount: this.regl.stats.getMaxAttributesCount ? this.regl.stats!.getMaxAttributesCount() : -1,
        bufferCount: this.regl.stats.bufferCount,
        elementsCount: this.regl.stats.elementsCount,
        framebufferCount: this.regl.stats.framebufferCount,
        shaderCount: this.regl.stats.shaderCount,
        textureCount: this.regl.stats.textureCount,
        cubeCount: this.regl.stats.cubeCount,
        renderbufferCount: this.regl.stats.renderbufferCount,
        maxTextureUnits: this.regl.stats.maxTextureUnits,
        vaoCount: this.regl.stats.vaoCount,
      },
      universe: this.universe.stats,
    }
  }

  public initializeFontRenderer(fontData: Uint8ClampedArray): void {
    initializeFontRenderer(this.regl, fontData)
  }

  public destroy(): void {
    this.views.forEach((view) => {
      view.eventTarget.removeEventListener("RENDER", this.renderDispatch)
      view.destroy()
    })
    this.regl.destroy()
  }
}

export interface Stats {
  regl: ReglStats
  universe: REGL.CommandStats
}

interface ReglStats extends REGL.Stats {
  totalTextureSize: number
  totalBufferSize: number
  totalRenderbufferSize: number
  maxUniformsCount: number
  maxAttributesCount: number
}

Comlink.expose(Engine)

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
