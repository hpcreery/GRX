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
import { ViewBox } from './types'


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

  private static _get_view(viewId: string): ViewRenderer {
    if (!Engine.views.has(viewId)) throw new Error(`View ${viewId} not found`)
    return Engine.views.get(viewId)!
  }

  /**
   * Delete a view
   * @param viewId View ID
   */
  public static delete_view(viewId: string): void {
    const view = this._get_view(viewId)
    view.destroy()
    Engine.views.delete(viewId)
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
   * Update view box for a view from a DOMRect
   * @param viewId update view's viewbox
   * @param viewBox view box (DomRect)
   */
  public static update_view_box_from_dom_rect(viewId: string, viewBox: DOMRect): void {
    viewBox.y = Engine.boundingBox.height - viewBox.bottom + Engine.boundingBox.y
    viewBox.x = viewBox.x - Engine.boundingBox.x
    const view = this._get_view(viewId)
    view.updateViewBox(viewBox)
  }

  /**
   * Update view box for a view
   * @param viewId update view's viewbox
   * @param viewBox view box (DomRect)
   */
  public static update_view_box(viewId: string, viewBox: ViewBox): void {
    const view = this._get_view(viewId)
    view.updateViewBox(viewBox)
  }

  /**
   * Perform a toss on the view to continue momentum scrolling
   * @param view Toss View with momentum
   */
  public static view_toss(viewId: string): void {
    this._get_view(viewId).toss()
  }

  /**
   * Move view viewport
   * @param viewId View ID
   * @param x X movement in pixels
   * @param y Y movement in pixels
   */
  public static view_move(viewId: string, x: number, y: number): void {
    this._get_view(viewId).moveViewport(x, y)
  }

    /**
   * Move view viewport
   * @param viewId View ID
   * @param x X rotation degrees
   * @param y Y rotation degrees
   */
  public static view_rotate(viewId: string, x: number, y: number): void {
    this._get_view(viewId).rotateViewport(x, y)
  }

  /**
   * Grab view pointer
   * @param viewId View ID
   */
  public static view_pointer_grab(viewId: string): void {
    this._get_view(viewId).grabViewport()
  }

  /**
   * Release view pointer
   * @param viewId View ID
   */
  public static view_pointer_release(viewId: string): void {
    this._get_view(viewId).releaseViewport()
  }

  /**
   * Zoom view
   * @param viewId View ID
   * @param x X position in view pixel coordinates
   * @param y Y Position in view pixel coordinates
   * @param s Scale factor
   */
  public static zoom(viewId: string, x: number, y: number, s: number): void {
    this._get_view(viewId).zoom(x, y, s)
  }

  /**
   * Read if view is currently being dragged
   * @param viewId View ID
   * @returns Dragging State boolean
   */
  public static read_pointer_grab(viewId: string): boolean {
    return this._get_view(viewId).isDragging()
  }

  /**
   * Zoom at point
   * @param viewId View ID
   * @param x X position in view pixel coordinates
   * @param y Y position in view pixel coordinates
   * @param s Scale factor
   */
  public static zoom_at_point(viewId: string, x: number, y: number, s: number): void {
    this._get_view(viewId).zoomAtPoint(x, y, s)
  }

  /**
   * Read world position from DOM position
   * @param viewId View ID
   * @param x X position in view pixel coordinates
   * @param y Y position in view pixel coordinates
   * @returns World Position [x, y]
   */
  public static read_world_position_from_canvas_position(viewId: string, x: number, y: number, z: number): [number, number] {
    return this._get_view(viewId).getWorldCoordFromScreenCoord(x, y, z)
  }

  /**
   * Read view transform
   * @param viewId View ID
   * @returns Render Transform
   */
  public static read_view_transform(viewId: string): Partial<RenderTransform> {
    return this._get_view(viewId).getTransform()
  }

  /**
   * Update view transform
   * @param viewId View ID
   * @param transform Render Transform
   */
  public static update_view_transform(viewId: string, transform: Partial<RenderTransform>): void {
    this._get_view(viewId).updateTransform(transform)
  }

  /**
   * Read view layer visibility
   * @param viewId View ID
   * @param layer Layer Name
   * @returns Visibility boolean
   */
  public static read_view_layer_visibility(viewId: string, layer: string): boolean {
    return this._get_view(viewId).getLayerVisibility(layer)
  }

  /**
   * Update view layer visibility
   * @param viewId View ID
   * @param layer Layer Name
   * @param visible Visibility boolean
   */
  public static update_view_layer_visibility(viewId: string, layer: string, visible: boolean): void {
    this._get_view(viewId).setLayerVisibility(layer, visible)
  }

  /**
   * Read view layer color
   * @param viewId View ID
   * @param layer Layer Name
   * @returns Color vec3 in gl format
   */
  public static read_view_layer_color(viewId: string, layer: string): vec3 {
    return this._get_view(viewId).getLayerColor(layer)
  }

  /**
   * Update view layer color
   * @param viewId View ID
   * @param layer Layer Name
   * @param color Color vec3 in gl format
   */
  public static update_view_layer_color(viewId: string, layer: string, color: vec3): void {
    this._get_view(viewId).setLayerColor(layer, color)
  }

  /**
   * Read view layer transform
   * @param viewId View ID
   * @param layer Layer Name
   * @returns Transform
   */
  public static read_view_layer_transform(viewId: string, layer: string): Transform {
    return this._get_view(viewId).getLayerTransform(layer)
  }

  /**
   * Update view layer transform
   * @param viewId View ID
   * @param layer Layer Name
   * @param transform Partial Transform
   */
  public static update_view_layer_transform(viewId: string, layer: string, transform: Partial<Transform>): void {
    this._get_view(viewId).setLayerTransform(layer, transform)
  }

  // /**
  //  * Sample view at position
  //  * @param viewId View ID
  //  * @param x X position
  //  * @param y Y position
  //  */
  // public static sample_view(viewId: string, x: number, y: number): void {
  //   this._get_view(viewId).sample(x, y)
  // }

  /**
   * Read view selection at pointer position
   * @param viewId View ID
   * @param pointer Pointer position vec2 in screen/view coordinates
   * @returns Array of Query Selections
   */
  public static read_view_select(viewId: string, pointer: vec2): QuerySelection[] {
    return this._get_view(viewId).select(pointer)
  }

  /**
   * Read view snap point at pointer position
   * @param viewId View ID
   * @param pointer Pointer position vec2 in screen/view coordinates
   * @returns Snap Point vec2
   */
  public static read_view_snap_point(viewId: string, pointer: vec2): vec2 {
    return this._get_view(viewId).snap(pointer)
  }

  /**
   * Update view selection
   * @param viewId View ID
   * @param selection Array of Query Selections
   */
  public static delete_view_selection(viewId: string): void {
    this._get_view(viewId).clearSelection()
  }

  /**
   * Update view pointer
   * @param viewId View ID
   * @param mouse Partial Pointer
   */
  public static update_view_pointer(viewId: string, mouse: Partial<Pointer>): void {
    this._get_view(viewId).setPointer(mouse)
  }

  /**
   * Zoom fit artwork in view
   * @param viewId View ID
   */
  public static update_view_zoom_fit_artwork(viewId: string): void {
    this._get_view(viewId).zoomFit()
  }

  /**
   * Create a measurement in view
   * @param viewId View ID
   * @param point vec2 point to start measurement, in gl/view coordinates
   */
  public static create_view_measurement(viewId: string, point: vec2): void {
    this._get_view(viewId).addMeasurement(point)
  }

  /**
   * Update current measurement in view
   * @param viewId View ID
   * @param point vec2 point to set current measurement to, in gl/view coordinates
   */
  public static update_view_measurement(viewId: string, point: vec2): void {
    this._get_view(viewId).updateMeasurement(point)
  }

  /**
   * Finish current measurement in view
   * @param viewId View ID
   * @param point vec2 point to finish measurement at, in gl/view coordinates
   */
  public static finish_view_measurement(viewId: string, point: vec2): void {
    this._get_view(viewId).finishMeasurement(point)
  }

  /**
   * Read all measurements in view
   * @param viewId View ID
   * @returns Array of measurements with point1 and point2 vec2
   */
  public static read_view_measurement(viewId: string): { point1: vec2; point2: vec2 }[] {
    return this._get_view(viewId).getMeasurements()
  }

  /**
   * Read current measurement in view
   * @param viewId View ID
   * @returns Current measurement with point1 and point2 vec2 or null if no current measurement
   */
  public static read_view_current_measurement(viewId: string): { point1: vec2; point2: vec2 } | null {
    return this._get_view(viewId).getCurrentMeasurement()
  }

  /**
   * Clear all measurements in view
   * @param viewId View ID
   */
  public static clear_view_measurements(viewId: string): void {
    this._get_view(viewId).clearMeasurements()
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
      Engine.universe(() => {
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
