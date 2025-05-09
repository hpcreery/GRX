import REGL from "regl"
import { mat3, vec2, vec3, vec4 } from "gl-matrix"
import LayerRenderer, { LayerRendererProps } from "./layer"
import { initializeFontRenderer, initializeRenderers, ReglRenderers, ScreenRenderProps } from "./collections"
import * as Shapes from "./shapes"
import * as Comlink from "comlink"
import plugins from "./plugins"
import type { Plugin, PluginsDefinition, AddLayerProps } from "./plugins"
import { type Units, type BoundingBox, FeatureTypeIdentifier, SNAP_MODES_MAP, SnapMode, ColorBlend } from "./types"
import Transform from "./transform"
import GridFrag from "./shaders/src/Grid.frag"
import OriginFrag from "./shaders/src/Origin.frag"
// import LoadingFrag from "./shaders/src/Loading/Winding.frag"
import FullScreenQuad from "./shaders/src/FullScreenQuad.vert"
import { UID } from "./utils"
import { SimpleMeasurement } from "./measurements"
import { ShapeDistance } from "./shape-renderer"
import { StepRenderer, StepRendererProps } from "./step"

export interface UniverseProps {}

interface UniverseUniforms {
  // u_Transform: mat3
  // u_InverseTransform: mat3
  // u_Resolution: vec2
  u_PixelSize: number
  u_OutlineMode: boolean
  u_SkeletonMode: boolean
  u_SnapMode: number
  u_PointerPosition: vec2
  u_PointerDown: boolean
  u_QueryMode: boolean
  u_Time: number
}

interface UniverseAttributes {
  a_Vertex_Position: vec2[]
}

export interface UniverseContext {
  settings: RenderSettings
  // transform: RenderTransform
  // resolution: vec2
  // transformMatrix: mat3
}

// interface ScreenRenderProps {
//   renderTexture: REGL.Framebuffer | REGL.Texture2D
// }

// interface ScreenRenderUniforms {
//   u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
// }

export interface RenderEngineBackendConfig {
  attributes?: WebGLContextAttributes | undefined
  width: number
  height: number
  dpr: number
}

export interface RenderSettings {
  FPS: number
  MSPFRAME: number
  OUTLINE_MODE: boolean
  SKELETON_MODE: boolean
  SNAP_MODE: SnapMode
  COLOR_BLEND: ColorBlend
  BACKGROUND_COLOR: vec4
  MAX_ZOOM: number
  MIN_ZOOM: number
  ZOOM_TO_CURSOR: boolean
  SHOW_DATUMS: boolean
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

export interface GridRenderProps {
  enabled: boolean
  color: vec4
  spacing_x: number
  spacing_y: number
  offset_x: number
  offset_y: number
  _type: number
  type: "dots" | "lines"
}

interface GridRenderUniforms {
  u_Spacing: vec2
  u_Offset: vec2
  u_Type: number
  u_Color: vec4
}

interface OriginRenderProps {
  enabled: boolean
}

interface OriginRenderUniforms {
  u_Color: vec4
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

  public static settings: RenderSettings = {
    MSPFRAME: 1000 / 60,
    get FPS(): number {
      return 1000 / this.MSPFRAME
    },
    set FPS(value: number) {
      this.MSPFRAME = 1000 / value
    },
    OUTLINE_MODE: false,
    SKELETON_MODE: false,
    SNAP_MODE: SnapMode.OFF,
    COLOR_BLEND: ColorBlend.CONTRAST,
    BACKGROUND_COLOR: [0, 0, 0, 0],
    MAX_ZOOM: 1000,
    MIN_ZOOM: 0.001,
    ZOOM_TO_CURSOR: true,
    SHOW_DATUMS: false,
  }

  public static offscreenCanvasGL: OffscreenCanvas
  public static offscreenCanvas2D: OffscreenCanvas

  public static viewBox: {
    width: number
    height: number
    dpr: number
  }

  public pointer: Pointer = {
    x: 0,
    y: 0,
    down: false,
  }

  // public transform: RenderTransform = {
  //   zoom: 1,
  //   position: [0, 0],
  //   velocity: [0, 0],
  //   timestamp: new Date(),
  //   dragging: false,
  //   matrix: mat3.create(),
  //   matrixInverse: mat3.create(),
  //   update: (): void => {
  //     this.updateTransform()
  //   },
  // }

  public static grid: GridRenderProps = {
    enabled: true,
    color: [0.2, 0.2, 0.2, 0.5],
    spacing_x: 1,
    spacing_y: 1,
    offset_x: 0,
    offset_y: 0,
    _type: 0,
    get type(): "dots" | "lines" {
      return this._type === 0 ? "dots" : "lines"
    },
    set type(value: "dots" | "lines") {
      switch (value) {
        case "dots":
          this._type = 0
          break
        case "lines":
          this._type = 1
          break
        default:
          this._type = 0
      }
    },
  }

  public static origin: OriginRenderProps = {
    enabled: true,
  }

  private dirty = true

  // ** make layers a proxy so that we can call render when a property is updated
  // public layers: LayerRenderer[] = new Proxy([], {
  //   set: (target, name, value): boolean => {
  //     target[name] = value
  //     this.render(true)
  //     return true
  //   }
  // })

  // public layers: LayerRenderer[] = []
  // public selections: LayerRenderer[] = []
  // public layersQueue: { name: string; id: string }[] = []

  public static ctx: OffscreenCanvasRenderingContext2D
  public static regl: REGL.Regl
  private universe: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, UniverseProps>

  // move these to nested object much like reglrenderers, something like utility renderers....
  public static renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps>
  public static blend: REGL.DrawCommand
  public static overlayBlendFunc: REGL.DrawCommand
  public static contrastBlendFunc: REGL.DrawCommand
  public static overlay: REGL.DrawCommand
  public static renderGrid: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, GridRenderProps>
  public static renderOrigin: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, OriginRenderProps>

  // public loadingFrame: LoadingAnimation
  // public measurements: SimpleMeasurement

  public parsers: PluginsDefinition = {}

  public eventTarget = new EventTarget()

  public steps: Map<string, StepRenderer> = new Map()
  // public steps: StepRenderer[] = []

  constructor(offscreenCanvasGL: OffscreenCanvas, offscreenCanvas2D: OffscreenCanvas, { attributes, width, height, dpr }: RenderEngineBackendConfig) {
    RenderEngineBackend.offscreenCanvasGL = offscreenCanvasGL
    RenderEngineBackend.offscreenCanvas2D = offscreenCanvas2D
    RenderEngineBackend.viewBox = {
      width: width * dpr,
      height: height * dpr,
      dpr,
    }

    const gl = offscreenCanvasGL.getContext("webgl", attributes)!
    RenderEngineBackend.ctx = offscreenCanvas2D.getContext("2d")!
    // this.ctx.scale(dpr, dpr)

    console.log("WEBGL VERSION", gl.getParameter(gl.VERSION))

    RenderEngineBackend.regl = REGL({
      gl,
      pixelRatio: dpr,
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

    this.universe = RenderEngineBackend.regl<UniverseUniforms, UniverseAttributes, UniverseProps, UniverseContext>({
      // context: {
      //   settings: RenderEngineBackend.settings,
      //   // transformMatrix: () => this.transform.matrix,
      //   // transform: this.transform,
      //   // resolution: () => [RenderEngineBackend.viewBox.width, RenderEngineBackend.viewBox.height],
      // },
      // uniforms: {
      //   // u_Transform: () => this.transform.matrix,
      //   // u_InverseTransform: () => this.transform.matrixInverse,
      //   u_Resolution: () => [RenderEngineBackend.viewBox.width, RenderEngineBackend.viewBox.height],
      //   // u_Resolution: (context: REGL.DefaultContext, props: WorldProps) => context.resolution,
      //   u_PixelSize: 2,
      //   u_OutlineMode: () => RenderEngineBackend.settings.OUTLINE_MODE,
      //   u_SkeletonMode: () => RenderEngineBackend.settings.SKELETON_MODE,
      //   // u_SnapMode: () => this.settings.SNAP_MODE,
      //   u_SnapMode: SNAP_MODES_MAP.OFF,
      //   u_PointerPosition: (_context: REGL.DefaultContext) => [this.pointer.x, this.pointer.y],
      //   u_PointerDown: (_context: REGL.DefaultContext) => this.pointer.down,
      //   u_QueryMode: false,
      //   u_Time: (context: REGL.DefaultContext) => context.time,
      // },
      // attributes: {
      //   a_Vertex_Position: [
      //     [-1, -1],
      //     [+1, -1],
      //     [-1, +1],
      //     [+1, +1],
      //     [-1, +1],
      //     [+1, -1],
      //   ],
      // },
      // cull: {
      //   enable: false,
      //   face: "front",
      // },
      // primitive: "triangles",
      // count: 6,
      // offset: 0,
      // profile: true,
    })

    // this.loadingFrame = new LoadingAnimation(this.regl, this.world)
    // this.measurements = new SimpleMeasurement(this.regl, this.ctx)
    // this.measurements = new SimpleMeasurement({
    //   regl: RenderEngineBackend.regl,
    //   ctx: RenderEngineBackend.ctx,
    // })

    RenderEngineBackend.renderGrid = RenderEngineBackend.regl<GridRenderUniforms, Record<string, never>, GridRenderProps, UniverseContext>({
      vert: FullScreenQuad,
      frag: GridFrag,
      uniforms: {
        u_Color: (_context: REGL.DefaultContext, props: GridRenderProps) => props.color,
        u_Spacing: (_context: REGL.DefaultContext, props: GridRenderProps) => [props.spacing_x, props.spacing_y],
        u_Offset: (_context: REGL.DefaultContext, props: GridRenderProps) => [props.offset_x, props.offset_y],
        u_Type: (_context: REGL.DefaultContext, props: GridRenderProps) => props._type,
      },
    })

    RenderEngineBackend.renderOrigin = RenderEngineBackend.regl<OriginRenderUniforms, Record<string, never>, OriginRenderProps, UniverseContext>({
      vert: FullScreenQuad,
      frag: OriginFrag,
      uniforms: {
        u_Color: (context: REGL.DefaultContext & UniverseContext) => {
          const color = vec4.create()
          vec4.subtract(color, [1, 1, 1, 1], context.settings.BACKGROUND_COLOR)
          color[3] = 1
          return color
        },
      },
    })

    RenderEngineBackend.blend = RenderEngineBackend.regl({
      blend: {
        enable: true,

        // func: {
        //   srcRGB:"one minus dst color",
        //   srcAlpha: "one",
        //   dstRGB: "one minus src color",
        //   dstAlpha: "one",
        // },

        equation: {
          rgb: "add",
          alpha: "add",
        },
        color: [0, 0, 0, 0.1],
      },
    })

    RenderEngineBackend.overlayBlendFunc = RenderEngineBackend.regl({
      blend: {
        func: {
          srcRGB: "src color",
          srcAlpha: "one",
          dstRGB: "one minus src color",
          dstAlpha: "one",
        },
      },
    })

    RenderEngineBackend.contrastBlendFunc = RenderEngineBackend.regl({
      blend: {
        func: {
          srcRGB: "one minus dst color",
          srcAlpha: "one",
          dstRGB: "one minus src color",
          dstAlpha: "one",
        },
      },
    })

    RenderEngineBackend.overlay = RenderEngineBackend.regl({
      blend: {
        enable: true,

        func: {
          srcRGB: "src alpha",
          srcAlpha: "src alpha",
          dstRGB: "one minus src alpha",
          dstAlpha: "one minus src alpha",
        },

        equation: {
          rgb: "add",
          alpha: "add",
        },
        color: [0, 0, 0, 0.1],
      },
    })

    RenderEngineBackend.renderToScreen = ReglRenderers.renderToScreen!

    // this.zoomAtPoint(0, 0, this.transform.zoom)
    this.render({
      force: true,
    })
  }

  public setSettings(settings: Partial<RenderSettings>): void {
    Object.assign(RenderEngineBackend.settings, settings)
    this.render({
      force: true,
    })
  }

  public getSettings(): RenderSettings {
    return RenderEngineBackend.settings
  }

  public setGrid(grid: Partial<GridRenderProps>): void {
    Object.assign(RenderEngineBackend.grid, grid)
    this.render({
      force: true,
    })
  }

  public getGrid(): GridRenderProps {
    return RenderEngineBackend.grid
  }

  public addStep(name: string): void {
    this.steps.set(
      name,
      new StepRenderer({
        regl: RenderEngineBackend.regl,
        ctx: RenderEngineBackend.ctx,
        dpr: RenderEngineBackend.viewBox.dpr,
        width: RenderEngineBackend.viewBox.width,
        height: RenderEngineBackend.viewBox.height,
      }),
    )
  }

  public resize(width: number, height: number, dpr: number): void {
    RenderEngineBackend.viewBox.width = width * dpr
    RenderEngineBackend.viewBox.height = height * dpr
    RenderEngineBackend.offscreenCanvasGL.width = RenderEngineBackend.viewBox.width
    RenderEngineBackend.offscreenCanvasGL.height = RenderEngineBackend.viewBox.height
    RenderEngineBackend.offscreenCanvas2D.width = RenderEngineBackend.viewBox.width
    RenderEngineBackend.offscreenCanvas2D.height = RenderEngineBackend.viewBox.height
    RenderEngineBackend.regl.poll()
    // this.updateTransform()
    this.render({
      force: true,
    })
  }

  public toss(step: string): void {
    // const { dragging } = this.transform
    // if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    // if (dragging) return
    // vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    // vec2.scale(this.transform.velocity, this.transform.velocity, 0.95)
    // this.transform.update()
    // if (Math.abs(this.transform.velocity[0]) < 0.05 && Math.abs(this.transform.velocity[1]) < 0.05) {
    //   this.transform.velocity[0] = 0
    //   this.transform.velocity[1] = 0
    // } else {
    //   setTimeout(() => this.toss(), this.settings.MSPFRAME)
    // }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.toss()
  }

  public moveViewport(step: string, x: number, y: number): void {
    // if (!this.transform.dragging) return
    // this.transform.velocity = [x, y]
    // vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    // this.transform.update()
    // this.transform.timestamp = new Date()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.moveViewport(x, y)
  }

  public grabViewport(step: string): void {
    // this.transform.velocity = [0, 0]
    // this.transform.dragging = true
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.grabViewport()
  }

  public releaseViewport(step: string): void {
    // this.transform.dragging = false
    // const currentTimestamp = new Date()
    // const timeDiff = currentTimestamp.getTime() - this.transform.timestamp.getTime()
    // if (timeDiff > this.settings.MSPFRAME * 10) {
    //   this.transform.velocity = [0, 0]
    // }
    // this.toss()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.releaseViewport()
  }

  public zoom(step: string, x: number, y: number, s: number): void {
    // if (this.settings.ZOOM_TO_CURSOR) {
    //   this.zoomAtPoint(x, y, s)
    // } else {
    //   this.zoomAtPoint(x, x, s)
    // }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.zoom(x, y, s)
  }

  public isDragging(step: string): boolean {
    // return this.transform.dragging
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.isDragging()
  }

  public updateTransform(step: string): void {
    // // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    // const { zoom, position } = this.transform
    // const { width, height } = this.viewBox
    // mat3.projection(this.transform.matrix, width, height)
    // mat3.translate(this.transform.matrix, this.transform.matrix, position)
    // mat3.scale(this.transform.matrix, this.transform.matrix, [zoom, zoom])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [height / width, 1])
    // // mat3.scale(this.transform.matrix, this.transform.matrix, [1, width / height])
    // // mat3.scale(this.transform.matrix, this.transform.matrix, [width, height])
    // mat3.translate(this.transform.matrix, this.transform.matrix, [width / 2, height / 2])
    // mat3.scale(this.transform.matrix, this.transform.matrix, [width / 2, -height / 2])
    // // mat3.scale(this.transform.matrix, this.transform.matrix, [height / width / 2, width / height / 2])

    // mat3.invert(this.transform.matrixInverse, this.transform.matrix)

    // // logMatrix(this.transform.matrix)
    // this.render()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.updateTransform()
  }

  public zoomAtPoint(step: string, x: number, y: number, s: number): void {
    // const { zoom } = this.transform
    // let newZoom = zoom - s / (1000 / zoom / 2)
    // let zoomBy = newZoom / zoom
    // if (newZoom < this.settings.MIN_ZOOM) {
    //   newZoom = this.settings.MIN_ZOOM
    //   zoomBy = newZoom / zoom
    //   this.transform.zoom = newZoom
    // } else if (newZoom > this.settings.MAX_ZOOM) {
    //   newZoom = this.settings.MAX_ZOOM
    //   zoomBy = newZoom / zoom
    //   this.transform.zoom = newZoom
    // } else {
    //   this.transform.zoom = newZoom
    // }
    // this.transform.position[0] = x - (x - this.transform.position[0]) * zoomBy
    // this.transform.position[1] = y - (y - this.transform.position[1]) * zoomBy
    // this.transform.update()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.zoomAtPoint(x, y, s)
  }

  public getWorldPosition(step: string, x: number, y: number): [number, number] {
    // const mousePosViewbox: vec2 = [x * 2 - 1, y * 2 - 1]
    // const mousePos = vec2.transformMat3(vec2.create(), mousePosViewbox, this.transform.matrixInverse)
    // return [mousePos[0], mousePos[1]]
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
    // const layer = new LayerRenderer({
    //   ...params,
    //   regl: this.regl,
    //   ctx: this.ctx,
    // })
    // this.layers.push(layer)
    // this.render({
    //   force: true,
    // })
    // this.eventTarget.dispatchEvent(new Event(EngineEvents.LAYERS_CHANGED))
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.addLayer(params)
  }

  public async addFile(step: string, params: { buffer: ArrayBuffer; format: string; props: Partial<Omit<AddLayerProps, "image">> }): Promise<void> {
    //   console.log(params.format)
    //   if (params.format == "") {
    //     console.error("No format provided")
    //     // this.addMessage({ level: MessageLevel.ERROR, title: 'File Load Error', message: 'No format provided' })
    //     return
    //   }
    //   if (!Object.keys(plugins).includes(params.format)) {
    //     console.error("No parser found for format: " + params.format)
    //     this.sendMessage({ level: MessageLevel.ERROR, title: "File Load Error", message: "No parser found for format: " + params.format })
    //     return
    //   }

    //   const pluginWorker = plugins[params.format].plugin
    //   if (pluginWorker) {
    //     const tempUID = UID()
    //     this.layersQueue.push({ name: params.props.name || "", id: tempUID })
    //     const addLayerCallback = async (params: AddLayerProps): Promise<void> => await this.addLayer({ ...params, format: params.format })
    //     const addMessageCallback = async (title: string, message: string): Promise<void> => {
    //       // await notifications.show({title, message})
    //       this.sendMessage({ level: MessageLevel.WARN, title, message })
    //     }
    //     const instance = new pluginWorker()
    //     const parser = Comlink.wrap<Plugin>(instance)
    //     try {
    //       await parser(params.buffer, params.props, Comlink.proxy(addLayerCallback), Comlink.proxy(addMessageCallback))
    //     } catch (error) {
    //       console.error(error)
    //       throw error
    //     } finally {
    //       parser[Comlink.releaseProxy]()
    //       instance.terminate()
    //       const index = this.layersQueue.findIndex((file) => file.id === tempUID)
    //       if (index != -1) {
    //         this.layersQueue.splice(index, 1)
    //       }
    //       this.eventTarget.dispatchEvent(new Event(EngineEvents.LAYERS_CHANGED))
    //       this.sendMessage({ level: MessageLevel.INFO, title: "File Loaded", message: "File loaded successfully" })
    //     }
    //   } else {
    //     console.error("No parser found for format: " + params.format)
    //     this.sendMessage({ level: MessageLevel.ERROR, title: "File Load Error", message: "No parser found for format: " + params.format })
    //   }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.addFile(params)
  }

  public getLayers(step: string): LayerInfo[] {
    //   return this.layers.map((layer) => {
    //     return {
    //       name: layer.name,
    //       id: layer.id,
    //       color: layer.color,
    //       context: layer.context,
    //       type: layer.type,
    //       units: layer.units,
    //       visible: layer.visible,
    //       format: layer.format,
    //       transform: layer.transform,
    //     }
    //   })
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    // return this.steps.get(step)!.getLayers()
    let layers: LayerInfo[] = []
    this.universe((_context) => {
      layers = this.steps.get(step)!.getLayers()
    })
    return layers
  }

  public getTransform(step: string): Partial<RenderTransform> {
    //   return {
    //     zoom: this.transform.zoom,
    //     position: this.transform.position,
    //     velocity: this.transform.velocity,
    //     dragging: this.transform.dragging,
    //     matrix: this.transform.matrix,
    //     matrixInverse: this.transform.matrixInverse,
    //     // update: this.transform.update
    //   }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    let transform: Partial<RenderTransform> = {}
    this.universe((_context) => {
      transform = this.steps.get(step)!.getTransform()
    })
    return transform
  }

  public setTransform(step: string, transform: Partial<RenderTransform>): void {
    //   if (transform.zoom) {
    //     if (transform.zoom < this.settings.MIN_ZOOM) {
    //       transform.zoom = this.settings.MIN_ZOOM
    //     } else if (transform.zoom > this.settings.MAX_ZOOM) {
    //       transform.zoom = this.settings.MAX_ZOOM
    //     }
    //   }
    //   Object.assign(this.transform, transform)
    //   this.updateTransform()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.setTransform(transform)
    })
  }

  public removeLayer(step: string, id: string): void {
    //   const index = this.layers.findIndex((layer) => layer.id === id)
    //   if (index === -1) return
    //   this.layers.splice(index, 1)
    //   this.render({
    //     force: true,
    //   })
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.removeLayer(id)
    })
  }

  public moveLayer(step: string, from: number, to: number): void {
    //   this.layers.splice(to < 0 ? this.layers.length + to : to, 0, this.layers.splice(from, 1)[0])
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.moveLayer(from, to)
    })
  }

  public setLayerProps(step: string, id: string, props: Partial<Omit<LayerRendererProps, "regl">>): void {
    // const layer = this.layers.find((layer) => layer.id === id)
    // if (!layer) return
    // Object.assign(layer, props)
    // this.render({
    //   force: true,
    // })
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.setLayerProps(id, props)
    })
  }

  public setLayerTransform(step: string, id: string, transform: Partial<Transform>): void {
    // const layer = this.layers.find((layer) => layer.id === id)
    // if (!layer) return
    // Object.assign(layer.transform, transform)
    // this.render({
    //   force: true,
    // })
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.setLayerTransform(id, transform)
    })
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
    // for (const layer of this.layers) {
    //   if (!layer.visible) continue
    //   const data = this.regl.read({
    //     framebuffer: layer.framebuffer,
    //     x,
    //     y,
    //     width: 1,
    //     height: 1,
    //   })
    //   if (data.reduce((acc, val) => acc + val, 0) > 0) {
    //     console.log(layer.name)
    //   }
    // }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.universe((_context) => {
      this.steps.get(step)!.sample(x, y)
    })
  }

  public select(step: string, pointer: vec2): QuerySelection[] {
    //   const selection: QuerySelection[] = []
    //   this.selections.length = 0
    //   this.universe((context) => {
    //     // this.clearMeasurements()
    //     // const scale = Math.sqrt(context.transformMatrix[0] ** 2 + context.transformMatrix[1] ** 2) * context.viewportWidth
    //     // const epsilons = 100 / scale
    //     for (const layer of this.layers) {
    //       if (!layer.visible) continue
    //       const distances = layer.queryDistance(pointer, SnapMode.EDGE, context)
    //       // const layerSelection = distances.filter((shape) => shape.distance <= 0)
    //       for (const select of distances) {
    //         // if (select.distance >= epsilons) continue
    //         selection.push({
    //           sourceLayer: layer.id,
    //           ...select,
    //           units: layer.units,
    //         })

    //         // THIS IS A VISUAL AIDS FOR THE SELECTION
    //         // this.measurements.addMeasurement(pointer)
    //         // this.measurements.finishMeasurement(vec2.sub(vec2.create(), pointer, vec2.scale(vec2.create(), select.direction, select.distance)))
    //       }
    //       const newSelectionLayer = new LayerRenderer({
    //         regl: this.regl,
    //         ctx: this.ctx,
    //         color: [0.5, 0.5, 0.5],
    //         alpha: 0.7,
    //         units: layer.units,
    //         name: layer.name,
    //         id: layer.id,
    //         // we want to deep clone this object to avoid the layer renderer from mutating the properties
    //         image: this.copySelectionToImage(distances),
    //         transform: layer.transform,
    //       })
    //       newSelectionLayer.dirty = true
    //       this.selections.push(newSelectionLayer)
    //     }
    //   })
    //   this.render({
    //     force: true,
    //   })
    //   return selection
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    let selection: QuerySelection[] = []
    this.universe((_context) => {
      selection = this.steps.get(step)!.select(pointer)
    })
    return selection
  }

  public snap(step: string, pointer: vec2): vec2 {
    //   if (this.settings.SNAP_MODE == SnapMode.OFF) return pointer

    //   let closest: ShapeDistance | undefined = undefined
    //   this.universe((context) => {
    //     for (const layer of this.layers) {
    //       if (!layer.visible) continue
    //       const layerSelection = layer.queryDistance(pointer, this.settings.SNAP_MODE, context)
    //       for (const select of layerSelection) {
    //         if (closest == undefined) {
    //           closest = select
    //           continue
    //         }
    //         if (vec2.dist(pointer, select.snapPoint) < vec2.dist(pointer, (closest as ShapeDistance).snapPoint)) {
    //           closest = select
    //         }
    //       }
    //     }
    //   })
    //   if (closest == undefined) return pointer
    //   return (closest as ShapeDistance).snapPoint
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    // return this.steps.get(step)!.snap(pointer)
    let snapped: vec2 = pointer
    this.universe((_context) => {
      snapped = this.steps.get(step)!.snap(pointer)
    })
    return snapped
  }

  // private copySelectionToImage(step: string, selection: ShapeDistance[]): Shapes.Shape[] {
  //   const image: Shapes.Shape[] = []
  //   for (const select of selection) {
  //     // we want to deep clone this object to avoid the layer renderer from mutating the properties
  //     const shape = JSON.parse(JSON.stringify(select.shape)) as Shapes.Shape
  //     if (select.children.length > 0) {
  //       if (shape.type == FeatureTypeIdentifier.STEP_AND_REPEAT) {
  //         shape.shapes = this.copySelectionToImage(select.children)
  //       }
  //       if (shape.type == FeatureTypeIdentifier.PAD && shape.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION) {
  //         shape.symbol.shapes = this.copySelectionToImage(select.children)
  //       }
  //     }
  //     image.push(shape)
  //   }
  //   return image
  // if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
  // return this.steps.get(step)!.copySelectionToImage(selection)
  // }

  public clearSelection(step: string): void {
    // this.selections.length = 0
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.clearSelection()
  }

  public setPointer(step: string, mouse: Partial<Pointer>): void {
    //   Object.assign(this.pointer, mouse)
    //   if (this.pointer.down) {
    //     this.render({
    //       force: true,
    //     })
    //   }
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.setPointer(mouse)
  }

  public async zoomFit(step: string): Promise<void> {
    //   const boundingBox: BoundingBox = {
    //     min: vec2.fromValues(Infinity, Infinity),
    //     max: vec2.fromValues(-Infinity, -Infinity),
    //   }
    //   this.transform.velocity = vec2.fromValues(0, 0)
    //   for (const layer of this.layers) {
    //     // TODO: make for loop parallel
    //     const layerBoundingBox = layer.getBoundingBox()
    //     boundingBox.min = vec2.min(boundingBox.min, boundingBox.min, layerBoundingBox.min)
    //     boundingBox.max = vec2.max(boundingBox.max, boundingBox.max, layerBoundingBox.max)
    //   }

    //   const screenWidthPx = this.viewBox.width
    //   const screenHeightPx = this.viewBox.height
    //   const screenAR = screenWidthPx / screenHeightPx
    //   const unitToPx = screenHeightPx / 2 / 1 // px per unit
    //   const bbWidthPx = (boundingBox.max[0] - boundingBox.min[0]) * unitToPx
    //   const bbHeightPx = (boundingBox.max[1] - boundingBox.min[1]) * unitToPx
    //   const bbAR = bbWidthPx / bbHeightPx
    //   // console.log('Screen Width, Height:', screenWidthPx, screenHeightPx)
    //   // console.log('Screen AR:', screenAR)
    //   // console.log('BB Width, Height:', bbWidthPx, bbHeightPx)
    //   // console.log('BB AR:', bbAR)
    //   // zooming zooms to canvas -1,-1
    //   const origin = vec2.fromValues(-1, 1)
    //   const originPx = vec2.scale(vec2.create(), origin, unitToPx)
    //   const bbTopLeft = vec2.fromValues(boundingBox.min[0] * unitToPx, boundingBox.max[1] * unitToPx)
    //   const bbTopLeftToOrigin = vec2.sub(vec2.create(), originPx, bbTopLeft)

    //   // boundingBox logic validation
    //   if (boundingBox.min[0] === Infinity || boundingBox.min[1] === Infinity || boundingBox.max[0] === -Infinity || boundingBox.max[1] === -Infinity)
    //     return
    //   if (boundingBox.min[0] > boundingBox.max[0] || boundingBox.min[1] > boundingBox.max[1]) return
    //   if (isNaN(boundingBox.min[0]) || isNaN(boundingBox.min[1]) || isNaN(boundingBox.max[0]) || isNaN(boundingBox.max[1])) return

    //   if (bbAR > screenAR) {
    //     const zoom = screenWidthPx / bbWidthPx
    //     const bbTopLeftToOriginScaled = vec2.scale(vec2.create(), bbTopLeftToOrigin, zoom)
    //     const offsetX = bbTopLeftToOriginScaled[0]
    //     const offsetY = -bbTopLeftToOriginScaled[1] + screenHeightPx / 2 - (bbHeightPx * zoom) / 2
    //     this.setTransform({ position: [offsetX, offsetY], zoom })
    //   } else {
    //     const zoom = screenHeightPx / bbHeightPx
    //     const bbTopLeftToOriginScaled = vec2.scale(vec2.create(), bbTopLeftToOrigin, zoom)
    //     const offsetX = bbTopLeftToOriginScaled[0] + screenWidthPx / 2 - (bbWidthPx * zoom) / 2
    //     const offsetY = -bbTopLeftToOriginScaled[1]
    //     this.setTransform({ position: [offsetX, offsetY], zoom })
    //   }
    //   this.render({
    //     force: true,
    //   })
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
    //   const pointSnap = this.snap(point)
    //   this.measurements.addMeasurement(pointSnap)
    //   this.render()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.addMeasurement(point)
  }

  public updateMeasurement(step: string, point: vec2): void {
    //   this.measurements.updateMeasurement(point)
    //   this.render({
    //     force: true,
    //     updateLayers: false,
    //   })
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.updateMeasurement(point)
  }

  public finishMeasurement(step: string, point: vec2): void {
    //   const pointSnap = this.snap(point)
    //   this.measurements.finishMeasurement(pointSnap)
    //   this.render()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    this.steps.get(step)!.finishMeasurement(point)
  }

  public getMeasurements(step: string): { point1: vec2; point2: vec2 }[] {
    //   return this.measurements.getMeasurements()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getMeasurements()
  }

  public getCurrentMeasurement(step: string): { point1: vec2; point2: vec2 } | null {
    //   return this.measurements.getCurrentMeasurement()
    if (!this.steps.has(step)) throw new Error(`Step ${step} not found`)
    return this.steps.get(step)!.getCurrentMeasurement()
  }

  // public clearMeasurements(): void {
  //   this.measurements.clearMeasurements()
  //   this.render({
  //     force: true,
  //     updateLayers: false,
  //   })
  // }

  // public setMeasurementUnits(units: Units): void {
  //   this.measurements.setMeasurementUnits(units)
  //   this.render({
  //     force: true,
  //     updateLayers: false,
  //   })
  // }

  // public render(props: RenderProps = RenderEngineBackend.defaultRenderProps): void {
  //   const { force, updateLayers } = { ...RenderEngineBackend.defaultRenderProps, ...props }
  //   if (!this.dirty && !force) return
  //   // if (this.loadingFrame.enabled) return
  //   if (updateLayers) this.dirty = false
  //   this.regl.poll()
  //   this.regl.clear({
  //     color: [0, 0, 0, 0],
  //     depth: 1,
  //   })
  //   this.ctx.clearRect(0, 0, this.viewBox.width, this.viewBox.height)

  //   setTimeout(() => (this.dirty = true), this.settings.MSPFRAME)
  //   this.universe((context) => {
  //     if (this.origin.enabled) this.renderOrigin()
  //     if (this.grid.enabled) this.renderGrid(this.grid)
  //     for (const layer of this.layers) {
  //       if (!layer.visible) continue
  //       updateLayers && layer.render(context)
  //       this.blend(() => {
  //         if (this.settings.COLOR_BLEND == ColorBlend.OVERLAY) {
  //           this.overlayBlendFunc(() => this.renderToScreen({ renderTexture: layer.framebuffer }))
  //         } else {
  //           this.contrastBlendFunc(() => this.renderToScreen({ renderTexture: layer.framebuffer }))
  //         }
  //       })
  //     }
  //     for (const selection of this.selections) {
  //       selection.render(context)
  //       this.overlay(() => this.renderToScreen({ renderTexture: selection.framebuffer }))
  //     }
  //     this.measurements.render(context)
  //     this.overlay(() => this.renderToScreen({ renderTexture: this.measurements.framebuffer }))
  //   })
  // }

  public render(props: RenderProps = RenderEngineBackend.defaultRenderProps): void {
    // RenderEngineBackend.regl.poll()
    // RenderEngineBackend.regl.clear({
    //   color: [0, 0, 0, 0],
    //   depth: 1,
    // })
    // RenderEngineBackend.ctx.clearRect(0, 0, RenderEngineBackend.viewBox.width, RenderEngineBackend.viewBox.height)
    console.log(this.steps)
    this.universe((_context) => {
      this.steps.forEach((step) => {
        step.render(props)
      })
    })
    // for (const step of this.steps) {
    //   step[1].render(props)
    // }
  }

  // private shapeToElement(shape: Shapes.Shape): Path2D {
  //   const path = new Path2D()
  //   switch (shape.type) {
  //     case FeatureTypeIdentifier.LINE:
  //       path.moveTo(shape.xs, shape.ys)
  //       path.lineTo(shape.xe, shape.ye)
  //       break
  //     case FeatureTypeIdentifier.POLYLINE:
  //       path.moveTo(shape.xs, shape.ys)
  //       for (let i = 0; i < shape.lines.length; i++) {
  //         path.lineTo(shape.lines[i].x, shape.lines[i].y)
  //       }
  //       break
  //   }
  //   return path
  // }

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
