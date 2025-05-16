import REGL from "regl"
import { mat3, vec2, vec3 } from "gl-matrix"
import { LayerRendererProps } from "./step/layer/layer"
import { initializeFontRenderer, initializeRenderers } from "./step/layer/collections"
import * as Comlink from "comlink"
import type { PluginsDefinition, AddLayerProps } from "./plugins"
import { type Units } from "./types"
import { Transform } from "./transform"
import { ShapeDistance } from "./step/layer/shape-renderer"
import { ViewRenderer } from "./step/view"
import type { RenderSettings, GridSettings, MeasurementSettings } from "./settings"
import { settings, gridSettings, measurementSettings } from "./settings"

export interface UniverseProps {}

interface UniverseUniforms {}

interface UniverseAttributes {}

export interface UniverseContext {}

// interface ScreenRenderProps {
//   renderTexture: REGL.Framebuffer | REGL.Texture2D
// }

// interface ScreenRenderUniforms {
//   u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
// }

export interface RenderEngineBackendConfig {
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
  context: string
  type: string
  units: Units
  visible: boolean
  format: string
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

export type RenderProps = Partial<typeof RenderEngineBackend.defaultRenderProps>

export interface MessageData {
  level: TMessageLevel
  title: string
  message: string
}

export class RenderEngineBackend {
  static defaultRenderProps = { force: false, updateLayers: true }

  public offscreenCanvasGL: OffscreenCanvas
  public offscreenCanvas2D: OffscreenCanvas

  public boundingBox: DOMRect

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }

  public static ctx: OffscreenCanvasRenderingContext2D
  public static regl: REGL.Regl
  private universe: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, UniverseProps>

  // public loadingFrame: LoadingAnimation
  // public measurements: SimpleMeasurement

  public parsers: PluginsDefinition = {}

  public eventTarget = new EventTarget()

  public steps: Map<string, ViewRenderer> = new Map()
  // public steps: StepRenderer[] = []

  private renderNowInterval: NodeJS.Timeout | null = null

  constructor(offscreenCanvasGL: OffscreenCanvas, offscreenCanvas2D: OffscreenCanvas, { attributes, container }: RenderEngineBackendConfig) {
    this.offscreenCanvasGL = offscreenCanvasGL
    this.offscreenCanvas2D = offscreenCanvas2D
    this.boundingBox = {
      ...container,
      // width: container.width * dpr,
      // height: container.height * dpr,
    }

    const gl = offscreenCanvasGL.getContext("webgl", attributes)!
    RenderEngineBackend.ctx = offscreenCanvas2D.getContext("2d")!
    // this.ctx.scale(dpr, dpr)

    console.log("WEBGL VERSION", gl.getParameter(gl.VERSION))

    RenderEngineBackend.regl = REGL({
      gl,
      pixelRatio: 1,
      extensions: [
        "angle_instanced_arrays",
        "OES_texture_float",
        "webgl_depth_texture",
        "EXT_frag_depth",
        "EXT_blend_minmax",
        // "WEBGL_color_buffer_float",
        "EXT_disjoint_timer_query",
      ],
      profile: true,
    })
    console.log("WEBGL LIMITS", RenderEngineBackend.regl.limits)

    initializeRenderers(RenderEngineBackend.regl)

    RenderEngineBackend.regl.clear({
      depth: 0,
    })

    this.universe = RenderEngineBackend.regl<UniverseUniforms, UniverseAttributes, UniverseProps, UniverseContext>({})

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

  public addView(name: string, viewBox: DOMRect): void {
    const newStep = new ViewRenderer({
      regl: RenderEngineBackend.regl,
      ctx: RenderEngineBackend.ctx,
      viewBox,
    })
    newStep.eventTarget.addEventListener("RENDER", this.renderDispatch)
    this.steps.set(name, newStep)
    this.render()
  }

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
    this.offscreenCanvas2D.width = this.boundingBox.width
    this.offscreenCanvas2D.height = this.boundingBox.height
    RenderEngineBackend.regl.poll()
    if (boxChanged) {
      this.render()
    }
    // this.updateTransform()
  }

  public updateViewBox(step: string, viewBox: DOMRect): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    viewBox.y = this.boundingBox.height - viewBox.bottom + this.boundingBox.y
    viewBox.x = viewBox.x - this.boundingBox.x
    this.steps.get(step)!.updateViewBox(viewBox)
  }

  public toss(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.toss()
  }

  public moveViewport(step: string, x: number, y: number): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.moveViewport(x, y)
  }

  public grabViewport(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.grabViewport()
  }

  public releaseViewport(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.releaseViewport()
  }

  public zoom(step: string, x: number, y: number, s: number): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.zoom(x, y, s)
  }

  public isDragging(step: string): boolean {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.isDragging()
  }

  public updateTransform(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    // return this.steps.get(step)!.updateTransform()
    const transform = this.steps.get(step)!.updateTransform()
    return transform
  }

  public zoomAtPoint(step: string, x: number, y: number, s: number): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.zoomAtPoint(x, y, s)
  }

  public getWorldPosition(step: string, x: number, y: number): [number, number] {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getWorldPosition(x, y)
  }

  public async sendMessage(data: MessageData): Promise<void> {
    this.eventTarget.dispatchEvent(
      new MessageEvent<MessageData>(EngineEvents.MESSAGE, {
        data,
      }),
    )
  }

  public async addLayer(step: string, params: AddLayerProps): Promise<void> {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.addLayer(params)
  }

  public async addFile(step: string, params: { buffer: ArrayBuffer; format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.addFile(params)
  }

  public getLayers(step: string): LayerInfo[] {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getLayers()
  }

  public getTransform(step: string): Partial<RenderTransform> {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getTransform()
  }

  public setTransform(step: string, transform: Partial<RenderTransform>): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.setTransform(transform)
  }

  public removeLayer(step: string, id: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.removeLayer(id)
  }

  public moveLayer(step: string, from: number, to: number): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.moveLayer(from, to)
  }

  public setLayerProps(step: string, id: string, props: Partial<Omit<LayerRendererProps, "regl">>): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.setLayerProps(id, props)
  }

  public setLayerTransform(step: string, id: string, transform: Partial<Transform>): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.setLayerTransform(id, transform)
  }

  public addEventCallback(event: TEngineEvents, listener: (data: MessageData | null) => void): void {
    function runCallback(e: Event | MessageEvent): void {
      if (e instanceof MessageEvent) {
        listener(e.data)
      } else {
        listener(null)
      }
    }
    this.eventTarget.addEventListener(event, runCallback)
  }

  public sample(step: string, x: number, y: number): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.sample(x, y)
    })
  }

  public select(step: string, pointer: vec2): QuerySelection[] {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    let selection: QuerySelection[] = []
    this.universe((_context) => {
      selection = this.steps.get(step)!.select(pointer)
    })
    return selection
  }

  public snap(step: string, pointer: vec2): vec2 {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    let snapped: vec2 = pointer
    this.universe((_context) => {
      snapped = this.steps.get(step)!.snap(pointer)
    })
    return snapped
  }

  public clearSelection(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.clearSelection()
  }

  public setPointer(step: string, mouse: Partial<Pointer>): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.setPointer(mouse)
  }

  public async zoomFit(step: string): Promise<void> {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.zoomFit()
  }

  // public startLoading(): void {
  //   this.loadingFrame.start()
  // }

  // public stopLoading(): void {
  //   this.loadingFrame.stop()
  // }

  public addMeasurement(step: string, point: vec2): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.addMeasurement(point)
  }

  public updateMeasurement(step: string, point: vec2): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.updateMeasurement(point)
  }

  public finishMeasurement(step: string, point: vec2): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.finishMeasurement(point)
  }

  public getMeasurements(step: string): { point1: vec2; point2: vec2 }[] {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getMeasurements()
  }

  public getCurrentMeasurement(step: string): { point1: vec2; point2: vec2 } | null {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getCurrentMeasurement()
  }

  public clearMeasurements(step: string): void {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.clearMeasurements()
  }

  public getLayersQueue(step: string): {
    name: string
    id: string
  }[] {
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.layersQueue
  }

  public render(): void {
    // RenderEngineBackend.regl.poll()
    // if (this.renderNowInterval == false) return
    // this.renderNowInterval = false

    if (this.renderNowInterval != null) return

    this.renderNowInterval = setTimeout(() => {
      this.renderNowInterval = null
      this.universe((_context) => {
        this.steps.forEach((step) => {
          step.render()
        })
      })
    }, settings.MSPFRAME)
  }

  public getStats(): Stats {
    return {
      regl: {
        totalTextureSize: RenderEngineBackend.regl.stats.getTotalTextureSize ? RenderEngineBackend.regl.stats!.getTotalTextureSize() : -1,
        totalBufferSize: RenderEngineBackend.regl.stats.getTotalBufferSize ? RenderEngineBackend.regl.stats!.getTotalBufferSize() : -1,
        totalRenderbufferSize: RenderEngineBackend.regl.stats.getTotalRenderbufferSize
          ? RenderEngineBackend.regl.stats!.getTotalRenderbufferSize()
          : -1,
        maxUniformsCount: RenderEngineBackend.regl.stats.getMaxUniformsCount ? RenderEngineBackend.regl.stats!.getMaxUniformsCount() : -1,
        maxAttributesCount: RenderEngineBackend.regl.stats.getMaxAttributesCount ? RenderEngineBackend.regl.stats!.getMaxAttributesCount() : -1,
        bufferCount: RenderEngineBackend.regl.stats.bufferCount,
        elementsCount: RenderEngineBackend.regl.stats.elementsCount,
        framebufferCount: RenderEngineBackend.regl.stats.framebufferCount,
        shaderCount: RenderEngineBackend.regl.stats.shaderCount,
        textureCount: RenderEngineBackend.regl.stats.textureCount,
        cubeCount: RenderEngineBackend.regl.stats.cubeCount,
        renderbufferCount: RenderEngineBackend.regl.stats.renderbufferCount,
        maxTextureUnits: RenderEngineBackend.regl.stats.maxTextureUnits,
        vaoCount: RenderEngineBackend.regl.stats.vaoCount,
      },
      universe: this.universe.stats,
    }
  }

  public initializeFontRenderer(fontData: Uint8ClampedArray): void {
    initializeFontRenderer(RenderEngineBackend.regl, fontData)
  }

  public destroy(): void {
    this.steps.forEach((step) => {
      step.destroy()
    })
    RenderEngineBackend.regl.destroy()
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

Comlink.expose(RenderEngineBackend)

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
