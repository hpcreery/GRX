import REGL from "regl"
import { mat3, vec2, vec3 } from "gl-matrix"
import { initializeFontRenderer, initializeRenderers } from "./view/gl-commands"
import * as Comlink from "comlink"
import { Transform } from "./transform"
import { ShapeDistance } from "./view/shape-renderer"
import { ViewRenderer } from "./view/view"
import type { RenderSettings, GridSettings, MeasurementSettings } from "./settings"
import { settings, gridSettings, measurementSettings } from "./settings"
import { DataInterface } from '../data/interface'
import { initStaticShaderCollections } from './view/buffer-collections'



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

export interface Pointer {
  x: number
  y: number
  down: boolean
}

export interface QuerySelection extends ShapeDistance {
  sourceLayer: string
}

export abstract class Engine {

  public static readonly DataInterface = Comlink.proxy(DataInterface)
  public static offscreenCanvasGL: OffscreenCanvas
  public static regl: REGL.Regl
  private static universe: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, UniverseProps>
  public static views: Map<string, ViewRenderer> = new Map()
  public static boundingBox: DOMRect
  public static pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }
  public static renderTimeMilliseconds: number = 0
  private static renderNowInterval: NodeJS.Timeout | null = null

  // public loadingFrame: LoadingAnimation
  // public measurements: SimpleMeasurement


  public static init(offscreenCanvasGL: OffscreenCanvas, { attributes, container }: RenderEngineConfig): void {
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

    initStaticShaderCollections(this.regl)
    initializeRenderers(this.regl)

    this.regl.clear({
      depth: 0,
    })

    this.universe = this.regl<UniverseUniforms, UniverseAttributes, UniverseProps, UniverseContext>({})

    this.render()
    console.log("Render Engine Initialized")
  }

  public static onLoad(): void {
    console.log("Engine onLoad called")
  }

  public static setSettings(newSettings: Partial<RenderSettings>): void {
    Object.assign(settings, newSettings)
    this.render()
  }

  public static getSettings(): RenderSettings {
    return settings
  }

  public static setGrid(newGrid: Partial<GridSettings>): void {
    Object.assign(gridSettings, newGrid)
    this.render()
  }

  public static getGrid(): GridSettings {
    return gridSettings
  }

  public static getMeasurementSettings(): MeasurementSettings {
    return measurementSettings
  }

  public static setMeasurementSettings(newSettings: Partial<MeasurementSettings>): void {
    Object.assign(measurementSettings, newSettings)
    this.render()
  }

  public static renderDispatch = (): void => this.render()

  public static addView(id: string, project: string, step: string, viewBox: DOMRect): void {
    const stepObject = DataInterface.read_step_info(project, step)
    const newStep = new ViewRenderer({
      regl: this.regl,
      viewBox,
      dataStep: stepObject,
      id,
    })
    newStep.onUpdate(this.renderDispatch)
    this.views.set(id, newStep)
    this.render()
  }

  public static removeView(id: string): void {
    if (!this.views.has(id)) throw new Error(`View ${id} not found`)
    const view = this.views.get(id)!
    view.destroy()
    this.views.delete(id)
    this.render()
  }

  public static updateBoundingBox(box: DOMRect): void {
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

  public static updateViewBox(view: string, viewBox: DOMRect): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    viewBox.y = this.boundingBox.height - viewBox.bottom + this.boundingBox.y
    viewBox.x = viewBox.x - this.boundingBox.x
    this.views.get(view)!.updateViewBox(viewBox)
  }

  public static toss(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.toss()
  }

  public static moveViewport(view: string, x: number, y: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.moveViewport(x, y)
  }

  public static grabViewport(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.grabViewport()
  }

  public static releaseViewport(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.releaseViewport()
  }

  public static zoom(view: string, x: number, y: number, s: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoom(x, y, s)
  }

  public static isDragging(view: string): boolean {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.isDragging()
  }

  public static updateTransform(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    const transform = this.views.get(view)!.updateTransform()
    return transform
  }

  public static zoomAtPoint(view: string, x: number, y: number, s: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoomAtPoint(x, y, s)
  }

  public static getWorldPosition(view: string, x: number, y: number): [number, number] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getWorldPosition(x, y)
  }

  public static getTransform(view: string): Partial<RenderTransform> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getTransform()
  }

  public static setTransform(view: string, transform: Partial<RenderTransform>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setTransform(transform)
  }

  public static getLayerVisibility(view: string, layer: string): boolean {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getLayerVisibility(layer)
  }

  public static setLayerVisibility(view: string, layer: string, visible: boolean): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setLayerVisibility(layer, visible)
  }

  public static getLayerColor(view: string, layer: string): vec3 {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getLayerColor(layer)
  }

  public static setLayerColor(view: string, layer: string, color: vec3): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setLayerColor(layer, color)
  }

  public static getLayerTransform(view: string, layer: string): Transform {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getLayerTransform(layer)
  }

  public static setLayerTransform(view: string, layer: string, transform: Partial<Transform>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setLayerTransform(layer, transform)
  }

  public static sample(view: string, x: number, y: number): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.sample(x, y)
  }

  public static select(view: string, pointer: vec2): QuerySelection[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    let selection: QuerySelection[] = []
    selection = this.views.get(view)!.select(pointer)
    return selection
  }

  public static snap(view: string, pointer: vec2): vec2 {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    let snapped: vec2 = pointer
    snapped = this.views.get(view)!.snap(pointer)
    return snapped
  }

  public static clearSelection(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.clearSelection()
  }

  public static setPointer(view: string, mouse: Partial<Pointer>): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.setPointer(mouse)
  }

  public static async zoomFit(view: string): Promise<void> {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.zoomFit()
  }

  // public startLoading(): void {
  //   this.loadingFrame.start()
  // }

  // public stopLoading(): void {
  //   this.loadingFrame.stop()
  // }

  public static addMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.addMeasurement(point)
  }

  public static updateMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.updateMeasurement(point)
  }

  public static finishMeasurement(view: string, point: vec2): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    this.views.get(view)!.finishMeasurement(point)
  }

  public static getMeasurements(view: string): { point1: vec2; point2: vec2 }[] {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getMeasurements()
  }

  public static getCurrentMeasurement(view: string): { point1: vec2; point2: vec2 } | null {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.getCurrentMeasurement()
  }

  public static learMeasurements(view: string): void {
    if (!this.views.has(view)) throw new Error(`View ${view} not found`)
    return this.views.get(view)!.clearMeasurements()
  }

  public static render(): void {
    if (this.renderNowInterval) return
    this.renderNowInterval = setTimeout(() => {
      this.renderNowInterval = null
      const startTime = performance.now()
      this.universe((_context) => {
        this.views.forEach((view) => {
          view.render()
        })
      })
      const endTime = performance.now()
      this.renderTimeMilliseconds = endTime - startTime
      // console.log(`Render Time: ${endTime - startTime} milliseconds`)
      // console.log(`FPS: ${Math.round(1000 / (endTime - startTime))}`)
      // this.calculatedFPS = Math.round(1000 / (endTime - startTime))
    }, settings.MSPFRAME)
  }

  public static getStats(): Stats {
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
      engine: {
        renderTimeMilliseconds: this.renderTimeMilliseconds,
      }
    }
  }

  public static initializeFontRenderer(fontData: Uint8ClampedArray): void {
    initializeFontRenderer(this.regl, fontData)
  }

  public static destroy(): void {
    this.views.forEach((view) => {
      view.removeEventListener("update", this.renderDispatch)
      view.destroy()
    })
    this.regl.destroy()
  }
}

export interface Stats {
  regl: ReglStats
  universe: REGL.CommandStats
  engine: {
    renderTimeMilliseconds: number
  }
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
