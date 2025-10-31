import REGL from "regl"
import { mat3, vec2, vec3 } from "gl-matrix"
import { initializeFontRenderer, initializeRenderers } from "./view/gl-commands"
import * as Comlink from "comlink"
import { Transform } from "./transform"
import { ShapeDistance } from "./view/shape-renderer"
import { ViewRenderer } from "./view/view"
import type { RenderSettings, GridSettings, MeasurementSettings } from "./settings"
import { settings, gridSettings, measurementSettings } from "./settings"
import { DataInterface } from "../data/interface"
import { initStaticShaderCollections } from "./view/buffer-collections"


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

/**
 * EngineInterface object provides all the methods to manage the engine.
 * Rules for methods:
 *   - All methods are static and can be called without instantiating the class.
 *   - All methods throw CommandError on failure. Other errors are considered internal errors.
 *   - All methods validate input and state before performing operations.
 *   - All methods ensure the integrity of the project structure.
 *   - All methods are documented with JSDoc comments.
 *   - All methods are named using snake_case.
 *   - Methods prefixed with _ are considered private and should not be used outside this class.
 *       - This is because these methods either return return or consume references to abstract data structures. (non-primitives or non JSON serializable data)
 *   - All public methods are designed to be used in a command-line interface context.
 *   - All public methods return void or primitive types (string, number, boolean) or JSON serilizable types.
 *   - All public method parameters are primitive types (string, number, boolean) or JSON serilizable types.
 *   - Methods should not have side effects outside of the project management context.
 *   - Methods, when applicable, should be named using verbs that clearly indicate their action. ie CRUD operations should be named create_*, read_*, update_*, delete_*.
 */
export abstract class EngineInterface extends DataInterface {
  /**
   * Update engine rendering settings
   * @param newSettings Partial render settings to update
   */
  public static set_engine_settings(newSettings: Partial<RenderSettings>): void {
    Object.assign(settings, newSettings)
    Engine.render()
  }

  /**
   * Read current engine rendering settings
   * @returns Render Settings
   */
  public static read_engine_settings(): RenderSettings {
    return settings
  }

  /**
   * Update grid settings
   * @param settings Partial grid settings
   */
  public static update_grid_settings(settings: Partial<GridSettings>): void {
    Object.assign(gridSettings, settings)
    Engine.render()
  }

  /**
   * Read current grid settings
   * @returns Grid Settings
   */
  public static read_grid_settings(): GridSettings {
    return gridSettings
  }

  /**
   * Read measurement settings
   * @returns Measurement Settings
   */
  public static read_measurement_settings(): MeasurementSettings {
    return measurementSettings
  }

  /**
   * Update measurement settings
   * @param settings Partial Measurement Settings
   */
  public static update_measurement_settings(settings: Partial<MeasurementSettings>): void {
    Object.assign(measurementSettings, settings)
    Engine.render()
  }

  // !! Creating a view requires a valid project and step to be present !!
  // ?? Maybe another method of creating views that will not be bound to a project/step ??
  /**
   * Create a new view
   * @param id View ID
   * @param project Project Name
   * @param step Step Name
   * @param viewBox View Box
   */
  public static create_view(id: string, project: string, step: string, viewBox: DOMRect): void {
    const stepObject = DataInterface.read_step_info(project, step)
    const newStep = new ViewRenderer({
      regl: Engine.regl,
      viewBox,
      dataStep: stepObject,
      id,
    })
    newStep.onUpdate(Engine.renderDispatch)
    Engine.views.set(id, newStep)
    Engine.render()
  }

  /**
   * Delete a view
   * @param id View ID
   */
  public static delete_view(id: string): void {
    if (!Engine.views.has(id)) throw new Error(`View ${id} not found`)
    const view = Engine.views.get(id)!
    view.destroy()
    Engine.views.delete(id)
    Engine.render()
  }

  /**
   * Update engine bounding box
   * @param box Bounding Box (DOMRect)
   */
  public static update_engine_bounding_box(box: DOMRect): void {
    // Engine.boundingBox.width = box.width * dpr
    // Engine.boundingBox.height = box.height * dpr
    let boxChanged = false
    for (const key in Engine.boundingBox) {
      if (box[key] !== Engine.boundingBox[key]) {
        boxChanged = true
        break
      }
    }
    Engine.boundingBox = box
    Engine.offscreenCanvasGL.width = Engine.boundingBox.width
    Engine.offscreenCanvasGL.height = Engine.boundingBox.height
    Engine.regl.poll()
    if (boxChanged) {
      Engine.render()
    }
    // Engine.updateTransform()
  }

  /**
   * Update view box for a view
   * @param view update view's viewbox
   * @param viewBox view box (DomRect)
   */
  public static update_view_box(view: string, viewBox: DOMRect): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    viewBox.y = Engine.boundingBox.height - viewBox.bottom + Engine.boundingBox.y
    viewBox.x = viewBox.x - Engine.boundingBox.x
    Engine.views.get(view)!.updateViewBox(viewBox)
  }

  /**
   * Perform a toss on the view to continue momentum scrolling
   * @param view Toss View with momentum
   */
  public static view_toss(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.toss()
  }

  /**
   * Move view viewport
   * @param view View ID
   * @param x X movement
   * @param y Y movement
   */
  public static view_move(view: string, x: number, y: number): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.moveViewport(x, y)
  }

  /**
   * Grab view pointer
   * @param view View ID
   */
  public static view_pointer_grab(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.grabViewport()
  }

  /**
   * Release view pointer
   * @param view View ID
   */
  public static view_pointer_release(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.releaseViewport()
  }

  /**
   * Zoom view
   * @param view View ID
   * @param x X position
   * @param y Y Position
   * @param s Scale factor
   */
  public static zoom(view: string, x: number, y: number, s: number): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.zoom(x, y, s)
  }

  public static read_pointer_grab(view: string): boolean {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.isDragging()
  }

  public static refresh_view_transfrom(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    const transform = Engine.views.get(view)!.refreshTransform()
    return transform
  }

  public static zoom_at_point(view: string, x: number, y: number, s: number): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.zoomAtPoint(x, y, s)
  }

  public static read_world_position_from_dom_position(view: string, x: number, y: number): [number, number] {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getWorldPosition(x, y)
  }

  public static read_view_transform(view: string): Partial<RenderTransform> {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getTransform()
  }

  public static update_view_transform(view: string, transform: Partial<RenderTransform>): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.updateTransform(transform)
  }

  public static read_view_layer_visibility(view: string, layer: string): boolean {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getLayerVisibility(layer)
  }

  public static update_view_layer_visibility(view: string, layer: string, visible: boolean): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.setLayerVisibility(layer, visible)
  }

  public static read_view_layer_color(view: string, layer: string): vec3 {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getLayerColor(layer)
  }

  public static update_view_layer_color(view: string, layer: string, color: vec3): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.setLayerColor(layer, color)
  }

  public static read_view_layer_transform(view: string, layer: string): Transform {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getLayerTransform(layer)
  }

  public static update_view_layer_transform(view: string, layer: string, transform: Partial<Transform>): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.setLayerTransform(layer, transform)
  }

  public static sample_view(view: string, x: number, y: number): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.sample(x, y)
  }

  public static read_view_select(view: string, pointer: vec2): QuerySelection[] {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    let selection: QuerySelection[] = []
    selection = Engine.views.get(view)!.select(pointer)
    return selection
  }

  public static read_view_snap_point(view: string, pointer: vec2): vec2 {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    let snapped: vec2 = pointer
    snapped = Engine.views.get(view)!.snap(pointer)
    return snapped
  }

  public static delete_view_selection(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.clearSelection()
  }

  public static update_view_pointer(view: string, mouse: Partial<Pointer>): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.setPointer(mouse)
  }

  public static async update_view_zoom_fit_artwork(view: string): Promise<void> {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.zoomFit()
  }

  public static create_view_measurement(view: string, point: vec2): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.addMeasurement(point)
  }

  public static update_view_measurement(view: string, point: vec2): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.updateMeasurement(point)
  }

  public static finish_view_measurement(view: string, point: vec2): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    Engine.views.get(view)!.finishMeasurement(point)
  }

  public static read_view_measurement(view: string): { point1: vec2; point2: vec2 }[] {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getMeasurements()
  }

  public static read_view_current_measurement(view: string): { point1: vec2; point2: vec2 } | null {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.getCurrentMeasurement()
  }

  public static clear_view_measurements(view: string): void {
    if (!Engine.views.has(view)) throw new Error(`View ${view} not found`)
    return Engine.views.get(view)!.clearMeasurements()
  }
}

export interface EngineInitParams {
  attributes?: WebGLContextAttributes | undefined
  container: DOMRect
}

export abstract class Engine {
  public static readonly interface = Comlink.proxy(EngineInterface)
  public static offscreenCanvasGL: OffscreenCanvas
  public static regl: REGL.Regl
  private static universe: REGL.DrawCommand<REGL.DefaultContext>
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

  public static init(offscreenCanvasGL: OffscreenCanvas, { attributes, container }: EngineInitParams): void {
    Engine.offscreenCanvasGL = offscreenCanvasGL
    Engine.boundingBox = {
      ...container,
      // width: container.width * dpr,
      // height: container.height * dpr,
    }

    const gl = offscreenCanvasGL.getContext("webgl", attributes)!

    console.log("WEBGL VERSION", gl.getParameter(gl.VERSION))

    Engine.regl = REGL({
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
        "OES_standard_derivatives",
      ],
      profile: true,
    })
    console.log("WEBGL LIMITS", Engine.regl.limits)

    initStaticShaderCollections(Engine.regl)
    initializeRenderers(Engine.regl)

    Engine.regl.clear({
      depth: 0,
    })

    Engine.universe = Engine.regl({})

    Engine.render()
    console.log("Render Engine Initialized")
  }

  public static onLoad(): void {
    console.log("Engine onLoad called")
  }

  public static render(): void {
    if (Engine.renderNowInterval) return
    Engine.renderNowInterval = setTimeout(() => {
      Engine.renderNowInterval = null
      const startTime = performance.now()
      Engine.universe((_context) => {
        Engine.views.forEach((view) => {
          view.render()
        })
      })
      const endTime = performance.now()
      Engine.renderTimeMilliseconds = endTime - startTime
      // console.log(`Render Time: ${endTime - startTime} milliseconds`)
      // console.log(`FPS: ${Math.round(1000 / (endTime - startTime))}`)
      // Engine.calculatedFPS = Math.round(1000 / (endTime - startTime))
    }, settings.MSPFRAME)
  }

  public static getStats(): Stats {
    return {
      regl: {
        totalTextureSize: Engine.regl.stats.getTotalTextureSize ? Engine.regl.stats!.getTotalTextureSize() : -1,
        totalBufferSize: Engine.regl.stats.getTotalBufferSize ? Engine.regl.stats!.getTotalBufferSize() : -1,
        totalRenderbufferSize: Engine.regl.stats.getTotalRenderbufferSize ? Engine.regl.stats!.getTotalRenderbufferSize() : -1,
        maxUniformsCount: Engine.regl.stats.getMaxUniformsCount ? Engine.regl.stats!.getMaxUniformsCount() : -1,
        maxAttributesCount: Engine.regl.stats.getMaxAttributesCount ? Engine.regl.stats!.getMaxAttributesCount() : -1,
        bufferCount: Engine.regl.stats.bufferCount,
        elementsCount: Engine.regl.stats.elementsCount,
        framebufferCount: Engine.regl.stats.framebufferCount,
        shaderCount: Engine.regl.stats.shaderCount,
        textureCount: Engine.regl.stats.textureCount,
        cubeCount: Engine.regl.stats.cubeCount,
        renderbufferCount: Engine.regl.stats.renderbufferCount,
        maxTextureUnits: Engine.regl.stats.maxTextureUnits,
        vaoCount: Engine.regl.stats.vaoCount,
      },
      universe: Engine.universe.stats,
      engine: {
        renderTimeMilliseconds: Engine.renderTimeMilliseconds,
      },
    }
  }

  public static initializeFontRenderer(fontData: Uint8ClampedArray): void {
    initializeFontRenderer(Engine.regl, fontData)
  }

  public static renderDispatch = (): void => Engine.render()

  public static destroy(): void {
    Engine.views.forEach((view) => {
      view.removeEventListener("update", Engine.renderDispatch)
      view.destroy()
    })
    Engine.regl.destroy()
  }
}

Comlink.expose(Engine)

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
//     return Engine._enabled
//   }

//   constructor(regl: REGL.Regl, world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>) {
//     Engine.regl = regl
//     Engine.world = world
//     Engine.renderLoading = Engine.regl<LoadingRenderUniforms, Record<string, never>, LoadingRenderProps>({
//       vert: FullScreenQuad,
//       frag: LoadingFrag,
//     })
//     // Engine.start()
//   }

//   public start(): void {
//     Engine._enabled = true
//     Engine.tick = Engine.regl.frame(() => {
//       Engine.world(() => {
//         Engine.renderLoading()
//       })
//     })
//   }

//   public stop(): void {
//     Engine._enabled = false
//     Engine.tick.cancel()
//   }
// }
