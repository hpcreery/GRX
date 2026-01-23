import REGL from "regl"
import { mat3, vec2, vec3, mat4, vec4 } from "gl-matrix"
import LayerRenderer, { SelectionRenderer } from "./layer"
import { ReglRenderers, TLoadedReglRenderers } from "./gl-commands"
import * as Shapes from "../../data/shape/shape"
import { type Units, type BoundingBox, SNAP_MODES_MAP, SnapMode, ColorBlend, ViewBox } from "../types"
import Transform from "../transform"
import { UID, UpdateEventTarget, mat4Extended } from "../utils"
import { SimpleMeasurement } from "./measurements"
import { ShapeDistance } from "./shape-renderer"
import type { RenderSettings } from "../settings"
import { settings, origin, gridSettings } from "../settings"
import ShapeTransform from "../transform"
import { StepLayer, Step } from "@src/renderer/data/project"
import { DataInterface } from "@src/renderer/data/interface"
import { ArtworkBufferCollection } from "@src/renderer/data/artwork-collections"
// import { Engine } from '../engine'

export interface WorldProps {}

interface WorldUniforms {
  u_Transform: mat3
  u_InverseTransform: mat3
  u_Transform3D: mat4
  u_InverseTransform3D: mat4
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
}

interface WorldAttributes {
  a_Vertex_Position: vec2[]
}

export interface WorldContext {
  settings: RenderSettings
  transform: RenderTransform
  resolution: vec2
  transformMatrix: mat3
  zOffset: number
}

// interface ScreenRenderProps {
//   renderTexture: REGL.Framebuffer | REGL.Texture2D
// }

// interface ScreenRenderUniforms {
//   u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
// }

export interface ViewRendererConfig {
  id?: string
  dataStep: Step
  viewBox: ViewBox
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
  rotation: vec2
  matrix3D: mat4
  matrix3DInverse: mat4
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
  // units: Units
}

export type ViewRendererProps = Partial<typeof ViewRenderer.defaultRenderProps>

export class ViewRenderer extends UpdateEventTarget {
  public id: string = UID()
  public dataStep: Step
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
    position: [this.viewBox.width / 2, -this.viewBox.height / 2],
    velocity: [0, 0],
    timestamp: new Date(),
    dragging: false,
    matrix: mat3.create(),
    matrixInverse: mat3.create(),
    rotation: vec2.create(),
    matrix3D: mat4.create(),
    matrix3DInverse: mat4.create(),
    update: (): void => {
      // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
      const { zoom, position } = this.transform
      const { width, height } = this.viewBox
      if (this.transform.rotation[0] % 90 == 0) this.transform.rotation[0] += 1
      if (this.transform.rotation[1] % 90 == 0) this.transform.rotation[1] += 1
      const [rotateX, rotateY] = this.transform.rotation
      mat3.projection(this.transform.matrix, width, height)
      mat3.translate(this.transform.matrix, this.transform.matrix, position)
      // rotate here (if needed)
      mat3.scale(this.transform.matrix, this.transform.matrix, [zoom, -zoom])
      mat3.invert(this.transform.matrixInverse, this.transform.matrix)

      if (settings.ENABLE_3D) {
        mat4.perspective(this.transform.matrix3D, (90 * Math.PI) / 180, 1 / 1, 0, 1)
        // this little hack lets us move the shapes back so they dont get clipped by the near plane
        if (settings.PERSPECTIVE_3D) {
          mat4.scale(this.transform.matrix3D, this.transform.matrix3D, [2, 2, 1])
          mat4.translate(this.transform.matrix3D, this.transform.matrix3D, [0, 0, -1])
        }
        mat4.rotateX(this.transform.matrix3D, this.transform.matrix3D, (rotateX * Math.PI) / 180)
        mat4.rotateY(this.transform.matrix3D, this.transform.matrix3D, (rotateY * Math.PI) / 180)
        mat4.scale(this.transform.matrix3D, this.transform.matrix3D, [1, 1, zoom])

        mat4.perspective(this.transform.matrix3DInverse, (90 * Math.PI) / 180, 1 / 1, 0, Infinity)
        // mat4.scale(this.transform.matrix3DInverse, this.transform.matrix3DInverse, [0.5,0.5,1])
        mat4Extended.invertRotateX(this.transform.matrix3DInverse, this.transform.matrix3DInverse, (rotateX * Math.PI) / 180)
        mat4Extended.invertRotateY(this.transform.matrix3DInverse, this.transform.matrix3DInverse, (rotateY * Math.PI) / 180)
        // mat4.translate(this.transform.matrix3D, this.transform.matrix3D, [0,0,-1])
        mat4.scale(this.transform.matrix3DInverse, this.transform.matrix3DInverse, [1, 1, zoom])
      } else {
        mat4.identity(this.transform.matrix3D)
        mat4.identity(this.transform.matrix3DInverse)
      }
    },
  }

  public dirty = true

  public layers: LayerRenderer[] = []
  public selections: SelectionRenderer[] = []

  public regl: REGL.Regl
  private world: REGL.DrawCommand<REGL.DefaultContext & WorldContext, WorldProps>

  protected drawCollections: TLoadedReglRenderers

  // public loadingFrame: LoadingAnimation
  public measurements: SimpleMeasurement

  private utilitiesRenderer: UtilitiesRenderer

  private layersSubscriptionControler: AbortController

  constructor({ viewBox, regl, id, dataStep }: ViewRendererConfig) {
    super()
    this.id = id || UID()
    this.dataStep = dataStep

    this.viewBox = viewBox
    this.transform.position = [this.viewBox.width / 2, this.viewBox.height / 2]

    this.regl = regl

    this.utilitiesRenderer = new UtilitiesRenderer(regl)

    this.world = this.regl<WorldUniforms, WorldAttributes, WorldProps, WorldContext>({
      context: {
        settings: settings,
        transformMatrix: () => this.transform.matrix,
        transform: () => this.transform,
        resolution: () => [this.viewBox.width, this.viewBox.height],
        zOffset: 0.0,
      },

      uniforms: {
        u_Transform: () => this.transform.matrix,
        u_InverseTransform: () => this.transform.matrixInverse,
        // u_ZOffset: 0.0,
        u_Transform3D: () => this.transform.matrix3D,
        u_InverseTransform3D: () => this.transform.matrix3DInverse,
        u_Perspective3D: () => settings.PERSPECTIVE_3D,
        u_Resolution: () => [this.viewBox.width, this.viewBox.height],
        // u_Resolution: (context: REGL.DefaultContext, props: WorldProps) => context.resolution,
        // u_PixelSize: 2,
        u_PixelSize: () => (settings.PERSPECTIVE_3D && settings.ENABLE_3D ? 1 : 2),
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

    this.layersSubscriptionControler = new AbortController()
    this.createLayers()

    this.zoomAtPoint(0, 0, this.transform.zoom)
    this.announceUpdate()

    // DataInterface.subscribe_to_matrix(this.dataStep.matrix.project, () => {
    //   this.updateLayers()
    // }, { signal: this.layersSubscriptionControler.signal });
  }

  public announceUpdate(): void {
    this.dispatchTypedEvent("update", new Event("update"))
  }

  public updateViewBox(newViewBox: ViewBox): void {
    let viewBoxChanged = false
    for (const key in this.viewBox) {
      if (newViewBox[key] !== this.viewBox[key]) {
        viewBoxChanged = true
        break
      }
    }
    this.viewBox = newViewBox
    if (viewBoxChanged) {
      this.announceUpdate()
    }
  }

  public toss(): void {
    const { dragging } = this.transform
    if (this.transform.velocity[0] === 0 && this.transform.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    vec2.scale(this.transform.velocity, this.transform.velocity, 0.95)
    this.announceUpdate()
    if (Math.abs(this.transform.velocity[0]) < 0.05 && Math.abs(this.transform.velocity[1]) < 0.05) {
      this.transform.velocity[0] = 0
      this.transform.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), settings.MSPFRAME)
    }
  }

  public moveViewport(x: number, y: number): void {
    if (!this.transform.dragging) return

    if (settings.ENABLE_3D) {
      // take into account the 3d rotation to change the x and y movement
      x = (x * 1) / Math.cos(this.transform.rotation[1] * (Math.PI / 180))
      y = (y * 1) / Math.cos(this.transform.rotation[0] * (Math.PI / 180))
    }

    this.transform.velocity = [x, y]
    vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    this.announceUpdate()
    this.transform.timestamp = new Date()
  }

  public rotateViewport(x: number, y: number): void {
    if (!settings.ENABLE_3D) return
    if (!this.transform.dragging) return
    // this.transform.velocity = [x, y]
    // vec2.add(this.transform.position, this.transform.position, this.transform.velocity)
    vec2.add(this.transform.rotation, this.transform.rotation, [x, y])
    this.announceUpdate()
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
    this.announceUpdate()
    // this.transform2.update(this.transform.matrix)
  }

  public getWorldCoordFromScreenCoord(x: number, y: number, z: number): [number, number] {
    const { width, height } = this.viewBox
    const mouse_element_pos = [x, y]

    // Normalize the mouse position to the canvas
    const mouse_normalize_pos = { x: mouse_element_pos[0] / width, y: mouse_element_pos[1] / height }
    // mouse_normalize_pos[0] = x value from 0 to 1 ( left to right ) of the canvas
    // mouse_normalize_pos[1] = y value from 0 to 1 ( bottom to top ) of the canvas

    const mousePosViewbox: vec2 = [mouse_normalize_pos.x * 2 - 1, mouse_normalize_pos.y * 2 - 1]
    const mousePos = vec4.create()
    if (settings.ENABLE_3D) {
      vec4.transformMat4(mousePos, vec4.fromValues(mousePosViewbox[0], mousePosViewbox[1], z, 1), this.transform.matrix3DInverse)
      if (settings.PERSPECTIVE_3D) {
        mousePos[0] /= 1 + mousePos[2]
        mousePos[1] /= 1 + mousePos[2]
      }
    } else {
      vec4.transformMat4(mousePos, vec4.fromValues(mousePosViewbox[0], mousePosViewbox[1], 0, 1), mat4.create())
    }
    vec2.transformMat3(mousePos, vec2.fromValues(mousePos[0], mousePos[1]), this.transform.matrixInverse)
    return [mousePos[0], mousePos[1]]
  }

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

  private addLayer(dataLayer: StepLayer): void {
    const layerRenderer = new LayerRenderer({
      regl: this.regl,
      dataLayer,
      color: vec3.fromValues(Math.random(), Math.random(), Math.random()),
      visible: true,
    })
    this.layers.push(layerRenderer)
    layerRenderer.onUpdate(() => {
      this.announceUpdate()
    })
    this.announceUpdate()
  }

  private deleteLayer(layer: StepLayer): void {
    const index = this.layers.findIndex((l) => l.dataLayer === layer)
    if (index === -1) return
    const deleted = this.layers.splice(index, 1)
    for (const d of deleted) {
      d.destroy()
    }
    this.announceUpdate()
  }

  public getTransform(): Partial<RenderTransform> {
    return {
      zoom: this.transform.zoom,
      position: this.transform.position,
      velocity: this.transform.velocity,
      dragging: this.transform.dragging,
      matrix: this.transform.matrix,
      matrixInverse: this.transform.matrixInverse,
      rotation: this.transform.rotation,
      matrix3D: this.transform.matrix3D,
      matrix3DInverse: this.transform.matrix3DInverse,
      // update: this.transform.update
    }
  }

  public updateTransform(transform: Partial<RenderTransform>): void {
    if (transform.zoom) {
      if (transform.zoom < settings.MIN_ZOOM) {
        transform.zoom = settings.MIN_ZOOM
      } else if (transform.zoom > settings.MAX_ZOOM) {
        transform.zoom = settings.MAX_ZOOM
      }
    }
    Object.assign(this.transform, transform)
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
  public getLayerColor(name: string): vec3 {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) throw new Error(`Layer ${name} not found`)
    return layer.color
  }

  /**
   * Set layer color by name
   */
  public setLayerColor(name: string, color: vec3): void {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) return
    layer.color = color
    this.announceUpdate()
  }

  /**
   * Get layer transform by name
   */
  public getLayerTransform(name: string): Transform {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) throw new Error(`Layer ${name} not found`)
    return layer.transform
  }

  /**
   * Set layer transform by name
   */
  public setLayerTransform(name: string, transform: Partial<Transform>): void {
    const layer = this.layers.find((layer) => layer.dataLayer.layer.name === name)
    if (!layer) return
    Object.assign(layer.transform, transform)
    this.announceUpdate()
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
        console.log(layer.dataLayer.layer.name)
      }
    }
  }

  /**
   * Select shapes at pointer position
   * @param pointer vec2 of gl screen/view coordinates
   * @returns list of QuerySelection objects
   */
  public select(pointer: vec2): QuerySelection[] {
    const selection: QuerySelection[] = []
    this.selections.forEach((layer) => layer.destroy())
    this.selections.length = 0
    this.world((context) => {
      for (const layer of this.layers) {
        if (!layer.visible) continue

        context.zOffset = this.dataStep.matrix.getZOffsetForLayer(layer.dataLayer.layer)

        const distances = layer.queryDistance(pointer, context)
        if (distances.length === 0) continue
        for (const select of distances) {
          selection.push({
            sourceLayer: layer.dataLayer.layer.name,
            ...select,
            // units: layer.dataLayer.artworkUnits,
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
        const selectionImage = new ArtworkBufferCollection()
        selectionImage.fromJSON(this.copySelectionToImage(distances))

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
    this.announceUpdate()
    return selection
  }

  /**
   * Snap pointer to closest shape point. If no snap points found, return original pointer. Snap mode/position is determined by global settings.
   * @param pointer vec2 of gl screen/view coordinates
   * @returns vec2 snapped point in world coordinates
   */
  public snap(pointer: vec2): vec2 {
    const pointerWorldCoord = this.getWorldCoordFromScreenCoord(pointer[0], pointer[1], 0)
    if (settings.SNAP_MODE == SnapMode.OFF) return pointerWorldCoord

    let closest: ShapeDistance | undefined = undefined
    this.world((context) => {
      for (const layer of this.layers) {
        if (!layer.visible) continue
        const layerSelection = layer.queryDistance(pointer, context)
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
          if (select.distance < closest.distance) {
            closest = select
          }
        }
      }
    })
    closest = closest as ShapeDistance | undefined
    // console.log(closest)
    if (closest == undefined) return pointerWorldCoord
    if (closest.distance == undefined) return pointerWorldCoord
    // return (closest as ShapeDistance).snapPoint!
    // const snapPoint = this.getWorldCoordFromScreenCoord(pointer[0], pointer[1], 0)
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

  public zoomFit(): void {
    const boundingBox: BoundingBox = {
      min: vec2.fromValues(Infinity, Infinity),
      max: vec2.fromValues(-Infinity, -Infinity),
    }
    this.transform.velocity = vec2.fromValues(0, 0)
    this.transform.rotation = vec2.fromValues(0, 0)
    for (const layer of this.layers) {
      // TODO: make for loop parallel
      const layerBoundingBox = layer.getBoundingBox()
      boundingBox.min = vec2.min(boundingBox.min, boundingBox.min, layerBoundingBox.min)
      boundingBox.max = vec2.max(boundingBox.max, boundingBox.max, layerBoundingBox.max)
    }

    const layerWidth = boundingBox.max[0] - boundingBox.min[0]
    const layerHeight = boundingBox.max[1] - boundingBox.min[1]
    const viewWidth = this.viewBox.width
    const viewHeight = this.viewBox.height

    const zoomX = viewWidth / layerWidth
    const zoomY = viewHeight / layerHeight
    let zoom = Math.min(zoomX, zoomY) * 1.0 // add some padding
    if (zoom > settings.MAX_ZOOM) zoom = settings.MAX_ZOOM
    if (zoom < settings.MIN_ZOOM) zoom = settings.MIN_ZOOM

    const position = vec2.create()
    if (zoomX < zoomY) {
      // fit to width
      const centerY = viewHeight / 2 + ((boundingBox.min[1] + boundingBox.max[1]) / 2) * zoom
      vec2.set(position, boundingBox.min[0] * zoom, centerY)
    } else {
      // fit to height
      const centerX = viewWidth / 2 - ((boundingBox.min[0] + boundingBox.max[0]) / 2) * zoom
      vec2.set(position, centerX, viewHeight - boundingBox.min[1] * zoom)
    }

    // validation checks
    if (isNaN(boundingBox.min[0]) || isNaN(boundingBox.min[1]) || isNaN(boundingBox.max[0]) || isNaN(boundingBox.max[1])) return
    if (boundingBox.min[0] > boundingBox.max[0] || boundingBox.min[1] > boundingBox.max[1]) return
    if (boundingBox.min[0] === Infinity || boundingBox.min[1] === Infinity || boundingBox.max[0] === -Infinity || boundingBox.max[1] === -Infinity)
      return

    this.updateTransform({ zoom, position })
    this.announceUpdate()
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
    const snapCoord = this.snap(point)
    this.measurements.addMeasurement(snapCoord)
    this.announceUpdate()
  }

  /**
   * Update current measurement
   * @param point vec2 of gl screen/view coordinates
   */
  public updateMeasurement(point: vec2): void {
    const coord = this.getWorldCoordFromScreenCoord(point[0], point[1], 0)
    this.measurements.updateMeasurement(coord)
    this.announceUpdate()
  }

  /**
   * Finish current measurement
   * @param point vec2 of gl screen/view coordinates
   */
  public finishMeasurement(point: vec2): void {
    const snapCoord = this.snap(point)
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
  //   this.eventTarget.dispatchTypedEvent("update", new Event("update"))
  // }

  public render(): void {
    this.transform.update()
    this.world((context) => {
      this.regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
      })

      this.utilitiesRenderer.render(context)
      this.drawCollections.overlay(() => this.drawCollections.renderTextureToScreen({ renderTexture: this.utilitiesRenderer.framebuffer }))

      for (const layer of this.layers) {
        if (!layer.visible) continue

        context.zOffset = this.dataStep.matrix.getZOffsetForLayer(layer.dataLayer.layer)

        layer.render(context)
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
          // else {
          //   this.drawCollections.opaqueBlendFunc({ color: vec4.fromValues(layer.color[0], layer.color[1], layer.color[2], 1) }, () =>
          //     this.drawCollections.renderTextureToScreen({
          //       renderTexture: layer.framebuffer,
          //     }),
          //   )
          // }
        })
      }
      for (const selection of this.selections) {
        context.zOffset = this.dataStep.matrix.getZOffsetForLayer(selection.sourceLayer)

        selection.render(context)
        this.drawCollections.overlay(() => this.drawCollections.renderTextureToScreen({ renderTexture: selection.framebuffer }))
      }

      context.zOffset = 0.0

      this.measurements.render(context)
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
