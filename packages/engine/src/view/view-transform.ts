import { defaultViewSettings, settings, type ViewSettings } from "@src/settings"
import type { BoundingBox, ViewBox } from "@src/types"
import { UpdateEventTarget } from "@src/utils"
import { mat3, mat4, vec2 } from "gl-matrix"

export interface TViewTransform {
  viewBox: ViewBox
  zoom: number
  position: vec2
  velocity: vec2
  dragging: boolean
  rotation: vec2
}

interface ViewTransformSettings extends Pick<ViewSettings, "MIN_ZOOM" | "MAX_ZOOM" | "ENABLE_3D" | "PERSPECTIVE_3D"> {}

export class ViewTransform extends UpdateEventTarget implements TViewTransform {
  constructor(config: Partial<TViewTransform> = {}, settings: ViewTransformSettings = defaultViewSettings) {
    super()
    Object.assign(this.settings, settings)
    this.setTransform(config)
    this.update()
  }

  private settings: ViewTransformSettings = {
    MIN_ZOOM: defaultViewSettings.MIN_ZOOM,
    MAX_ZOOM: defaultViewSettings.MAX_ZOOM,
    ENABLE_3D: defaultViewSettings.ENABLE_3D,
    PERSPECTIVE_3D: defaultViewSettings.PERSPECTIVE_3D,
  }

  private timestamp = new Date()

  private _viewBox: ViewBox = { width: 0, height: 0, x: 0, y: 0 }
  private _zoom: number = 1
  private _position: vec2 = vec2.fromValues(0, 0)
  private _velocity: vec2 = vec2.fromValues(0, 0)
  private _dragging: boolean = false
  private _rotation: vec2 = vec2.fromValues(0, 0)

  public readonly matrix: mat3 = mat3.create()
  public readonly matrixInverse: mat3 = mat3.create()
  public readonly matrix3D: mat4 = mat4.create()

  public get viewBox(): ViewBox {
    return this._viewBox
  }
  private set viewBox(value: ViewBox) {
    Object.assign(this._viewBox, value)
  }

  public get zoom(): number {
    return this._zoom
  }
  private set zoom(value: number) {
    // Clamp the zoom level to the allowed range.
    if (value < this.settings.MIN_ZOOM) {
      this._zoom = this.settings.MIN_ZOOM
    } else if (value > this.settings.MAX_ZOOM) {
      this._zoom = this.settings.MAX_ZOOM
    } else {
      this._zoom = value
    }
  }

  public get position(): vec2 {
    return this._position
  }
  private set position(value: vec2) {
    vec2.copy(this._position, value)
  }

  public get velocity(): vec2 {
    return this._velocity
  }
  private set velocity(value: vec2) {
    vec2.copy(this._velocity, value)
  }

  public get dragging(): boolean {
    return this._dragging
  }
  private set dragging(value: boolean) {
    this._dragging = value
  }

  public get rotation(): vec2 {
    return this._rotation
  }
  private set rotation(value: vec2) {
    this._rotation = value
  }

  /**
   * Update the internal transformation matrices based on the current view transform properties.
   * This should be called whenever the view transform changes to ensure the matrices are in sync.
   * @returns this
   */
  public update(): this {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const { zoom, position } = this
    const { width, height } = this.viewBox
    if (this.rotation[0] % 90 == 0) this.rotation[0] += 1
    if (this.rotation[1] % 90 == 0) this.rotation[1] += 1
    const [rotateX, rotateY] = this.rotation
    mat3.projection(this.matrix, width, height)
    mat3.translate(this.matrix, this.matrix, position)
    // rotate here (if needed)
    mat3.scale(this.matrix, this.matrix, [zoom, -zoom])
    mat3.invert(this.matrixInverse, this.matrix)

    if (this.settings.ENABLE_3D) {
      mat4.perspective(this.matrix3D, (90 * Math.PI) / 180, width / height, 0, 1)
      // this little hack lets us move the shapes back so they dont get clipped by the near plane
      if (this.settings.PERSPECTIVE_3D) {
        mat4.scale(this.matrix3D, this.matrix3D, [2, 2, 1])
        mat4.translate(this.matrix3D, this.matrix3D, [0, 0, -1])
      }
      mat4.rotateX(this.matrix3D, this.matrix3D, (rotateX * Math.PI) / 180)
      mat4.rotateY(this.matrix3D, this.matrix3D, (rotateY * Math.PI) / 180)
      mat4.scale(this.matrix3D, this.matrix3D, [width / height, 1, zoom])
    } else {
      mat4.identity(this.matrix3D)
    }
    this.timestamp = new Date()
    this.announceUpdate()
    return this
  }

  /**
   * Get the current view transform as a TViewTransform object.
   * @returns a copy of the TViewTransform Object
   */
  public getTransform(): TViewTransform {
    return {
      viewBox: {
        width: this.viewBox.width,
        height: this.viewBox.height,
        x: this.viewBox.x,
        y: this.viewBox.y,
      },
      zoom: this.zoom,
      position: this.position,
      velocity: this.velocity,
      dragging: this.dragging,
      rotation: this.rotation,
    }
  }

  /**
   * Set the current view transform using a partial TViewTransform object.
   * @param config Partial<TViewTransform>
   */
  public setTransform(transform: Partial<TViewTransform>): this {
    let changed = false
    if (transform.zoom !== undefined && transform.zoom !== this.zoom) {
      this.zoom = transform.zoom
      changed = true
    }
    if (transform.position !== undefined && !vec2.equals(transform.position, this.position)) {
      vec2.copy(this.position, transform.position)
      changed = true
    }
    if (transform.rotation !== undefined && !vec2.equals(transform.rotation, this.rotation)) {
      vec2.copy(this.rotation, transform.rotation)
      changed = true
    }
    if (transform.velocity !== undefined && !vec2.equals(transform.velocity, this.velocity)) {
      vec2.copy(this.velocity, transform.velocity)
      changed = true
    }
    if (transform.dragging !== undefined && transform.dragging !== this.dragging) {
      this.dragging = transform.dragging
      changed = true
    }
    if (transform.viewBox !== undefined) {
      const a = Object.keys(this.viewBox) as (keyof ViewBox)[]
      a.forEach((key) => {
        if (transform.viewBox![key] !== this.viewBox[key]) {
          changed = true
        }
      })
      Object.assign(this.viewBox, transform.viewBox)
    }
    if (changed) {
      this.update()
    }
    return this
  }

  /**
   * Zoom at point
   * @param x x location to zoom to in view pixel coordinates
   * @param y y location to zoom to in view pixel coordinates
   * @param s Increase in zoom level. + to zoom in, - to zoom out. typically corresponds to mouse wheel delta
   */
  public zoomAboutPoint(x: number, y: number, s: number): this {
    const rotatedX = Math.abs(this.rotation[0]) % 360
    const rotatedY = Math.abs(this.rotation[1]) % 360
    if (this.settings.ENABLE_3D) {
      if (rotatedX > 90 && rotatedX < 270) y = this.viewBox.height - y
      if (rotatedY > 90 && rotatedY < 270) x = this.viewBox.width - x
    }
    const { zoom } = this
    let newZoom = zoom + s / (1000 / zoom / 2)
    let zoomBy = newZoom / zoom
    if (newZoom < this.settings.MIN_ZOOM) {
      newZoom = this.settings.MIN_ZOOM
      zoomBy = newZoom / zoom
      this.zoom = newZoom
    } else if (newZoom > this.settings.MAX_ZOOM) {
      newZoom = this.settings.MAX_ZOOM
      zoomBy = newZoom / zoom
      this.zoom = newZoom
    } else {
      this.zoom = newZoom
    }
    this.position[0] = x - (x - this.position[0]) * zoomBy
    this.position[1] = y - (y - this.position[1]) * zoomBy
    this.update()
    return this
  }

  /**
   * Zoom the view to fit the given bounding box.
   * @param boundingBox the bounding box to zoom to
   * @returns this
   */
  public zoomToBox(boundingBox: BoundingBox): this {
    this.velocity = vec2.fromValues(0, 0)
    this.rotation = vec2.fromValues(0, 0)

    const layerWidth = boundingBox.max[0] - boundingBox.min[0]
    const layerHeight = boundingBox.max[1] - boundingBox.min[1]
    const viewWidth = this.viewBox.width
    const viewHeight = this.viewBox.height

    // calc zoom
    const zoomX = viewWidth / layerWidth
    const zoomY = viewHeight / layerHeight
    let zoom = Math.min(zoomX, zoomY) * 1.0 // add some padding
    if (zoom > this.settings.MAX_ZOOM) zoom = this.settings.MAX_ZOOM
    if (zoom < this.settings.MIN_ZOOM) zoom = this.settings.MIN_ZOOM

    // calc position: world-space bbox center must map to the viewport center once scaled by zoom
    const centerX = (boundingBox.min[0] + boundingBox.max[0]) / 2
    const centerY = (boundingBox.min[1] + boundingBox.max[1]) / 2
    const position = vec2.fromValues(viewWidth / 2 - centerX * zoom, viewHeight / 2 + centerY * zoom)

    // validation checks
    if (Number.isNaN(boundingBox.min[0]) || Number.isNaN(boundingBox.min[1]) || Number.isNaN(boundingBox.max[0]) || Number.isNaN(boundingBox.max[1]))
      return this
    if (boundingBox.min[0] > boundingBox.max[0] || boundingBox.min[1] > boundingBox.max[1]) return this
    if (boundingBox.min[0] === Infinity || boundingBox.min[1] === Infinity || boundingBox.max[0] === -Infinity || boundingBox.max[1] === -Infinity)
      return this

    // apply the calculated zoom and position to the view transform
    this.zoom = zoom
    this.position = position
    this.update()
    return this
  }

  /**
   * Move viewport
   * @param x x distance in pixels
   * @param y y distance in pixels
   * @returns this
   */
  public moveViewport(x: number, y: number): this {
    if (!this.dragging) return this

    // consider inverting x and y based on rotation
    if (this.settings.ENABLE_3D) {
      const rotatedX = Math.abs(this.rotation[0]) % 360
      const rotatedY = Math.abs(this.rotation[1]) % 360
      if (rotatedX > 90 && rotatedX < 270) y = -y
      if (rotatedY > 90 && rotatedY < 270) x = -x
    }
    vec2.add(this.position, this.position, this.velocity)
    vec2.set(this.velocity, x, y)
    this.update()
    return this
  }

  /**
   * Rotate viewport
   * @param x x rotation in degrees
   * @param y y rotation in degrees
   * @returns this
   */
  public rotateViewport(x: number, y: number): this {
    if (!this.settings.ENABLE_3D) return this
    if (!this.dragging) return this
    vec2.add(this.rotation, this.rotation, [x, y])
    this.update()
    return this
  }

  /**
   * Grab viewport for dragging
   * @returns this
   */
  public grabViewport(): this {
    this.dragging = true
    this.velocity = [0, 0]
    this.update()
    return this
  }

  /**
   * Release viewport from dragging
   * @returns this
   */
  public releaseViewport(): this {
    this.dragging = false
    const currentTimestamp = new Date()
    const timeDiff = currentTimestamp.getTime() - this.timestamp.getTime()
    if (timeDiff > settings.MSPFRAME * 10) {
      this.velocity = [0, 0]
    }
    this.toss()
    this.update()
    return this
  }

  private toss(): void {
    const { dragging } = this
    if (this.velocity[0] === 0 && this.velocity[1] === 0) return
    if (dragging) return
    vec2.add(this.position, this.position, this.velocity)
    vec2.scale(this.velocity, this.velocity, 0.95)
    // this.announceUpdate()
    if (Math.abs(this.velocity[0]) < 0.05 && Math.abs(this.velocity[1]) < 0.05) {
      this.velocity[0] = 0
      this.velocity[1] = 0
    } else {
      setTimeout(() => this.toss(), settings.MSPFRAME)
    }
    this.update()
  }

  public getSettings(): ViewTransformSettings {
    return { ...this.settings }
  }

  public updateSettings(settings: Partial<ViewTransformSettings>): void {
    Object.assign(this.settings, settings)
    this.update()
  }
}
