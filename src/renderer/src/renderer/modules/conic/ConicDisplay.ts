import { Conic } from './Conic'
import { Point, Matrix } from '@pixi/math'
import { Renderer, Texture } from '@pixi/core'
import { ConicRenderer } from './ConicRenderer'
import mat3 from 'gl-mat3'
import * as PIXI from '@pixi/webworker'

const tempMatrix = new Matrix()

// https://www.shadertoy.com/view/Xds3Dn
// example of inverted conic section

/**
 * Draws a segment of conic section represented by the equation _k_<sup>2</sup>- _lm = 0_, where k, l, m are lines.
 *
 * This display-object shades the inside/outside of a conic section within a mesh.
 *
 * A conic curve can be represented in the form: _k_<sup>2</sup> - _lm = 0_, where k, l, m are lines described in
 * the form _ax + by + c = 0_. _l_ and _m_ are the tangents to the curve, and _k_ is a chord connecting the points
 * of tangency.
 */
export class ConicDisplay extends PIXI.Graphics {
  public shape: Conic

  // @ts-ignore
  public vertexData: Array<number>
  public uvData: Array<number>
  // @ts-ignore
  public indexData: Array<number>

  protected _texture: Texture
  protected _updateID: number
  protected _transformID: number
  protected _dirtyID: number

  protected _color: PIXI.Color
  protected _tint: PIXI.Color

  constructor(conic = new Conic()) {
    super()

    /**
     * The conic curve drawn by this graphic.
     */
    this.shape = conic

    this._color = new PIXI.Color(16777215)

    this._tint = new PIXI.Color(16777215)

    /**
     * Flags whether the geometry data needs to be updated.
     */
    this._dirtyID = 0

    /**
     * The world transform ID last when the geometry was updated.
     */
    this._transformID = 0

    /**
     * Last {@link _dirtyID} when the geometry was updated.
     */
    this._updateID = -1

    /**
     * World positions of the vertices
     */
    this.vertexData = []

    /**
     * Texture positions of the vertices.
     */
    this.uvData = []

    this._texture = Texture.WHITE
  }

  /**
   * @see Conic#k
   */
  get k(): [number, number, number] {
    return this.shape.k
  }
  set k(line: [number, number, number]) {
    this.shape.setk(...line)
  }

  /**
   * @see Conic#l
   */
  get l(): [number, number, number] {
    return this.shape.l
  }
  set l(line: [number, number, number]) {
    this.shape.setl(...line)
  }

  /**
   * @see Conic#m
   */
  get m(): [number, number, number] {
    return this.shape.m
  }
  set m(line: [number, number, number]) {
    this.shape.setm(...line)
  }

  get color(): [number, number, number] {
    return this._color.toRgbArray() as [number, number, number]
  }

  set color(color: PIXI.ColorSource) {
    this._color = new PIXI.Color(color)
  }

  get uColor(): [number, number, number] {
    return this._color.toRgbArray() as [number, number, number]
  }

  get tint(): PIXI.Color {
    return this._tint
  }

  set tint(tint: PIXI.ColorSource) {
    this._tint = new PIXI.Color(tint)
  }

  get uTint(): [number, number, number] {
    return this._tint.toRgbArray() as [number, number, number]
  }

  get texture(): Texture {
    return this._texture
  }
  set texture(tex: Texture) {
    this._texture = tex || Texture.WHITE
  }

  _calculateBounds(): void {
    // @ts-ignore
    this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length)
  }

  _render(renderer: Renderer): void {
    if (!renderer.plugins.conic) {
      // @ts-ignore
      renderer.plugins.conic = new ConicRenderer(renderer, null)
    }

    renderer.batch.setObjectRenderer(renderer.plugins.conic)
    renderer.plugins.conic.render(this)
  }

  /**
   * Draws the triangle formed by the control points of the shape.
   */
  drawControlPoints(): this {
    const controlPoints = this.shape.controlPoints

    this.drawTriangle(
      controlPoints[0].x,
      controlPoints[0].y,
      controlPoints[1].x,
      controlPoints[1].y,
      controlPoints[2].x,
      controlPoints[2].y
    )

    return this
  }

  /**
   * Draw a triangle defined in texture space transformed into local space. Generally, you would want to draw the triangle
   * formed by the shape's control points.
   *
   * @param x0
   * @param y0
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   */
  drawTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): this {
    const data = this.uvData
    const i = data.length

    data.length += 6
    data[i] = x0
    data[i + 1] = y0
    data[i + 2] = x1
    data[i + 3] = y1
    data[i + 4] = x2
    data[i + 5] = y2

    return this
  }

  /**
   * @param x
   * @param y
   * @param width
   * @param height
   */
  drawRect(x: number, y: number, width: number, height: number): this {
    const data = this.uvData
    const i = data.length

    data.length += 12
    data[i] = x
    data[i + 1] = y
    data[i + 2] = x + width
    data[i + 3] = y
    data[i + 4] = x + width
    data[i + 5] = y + height
    data[i + 6] = x
    data[i + 7] = y
    data[i + 8] = x + width
    data[i + 9] = y + height
    data[i + 10] = x
    data[i + 11] = y + height

    return this
  }

  /**
   * Updates the geometry data for this conic.
   */
  updateConic(): void {
    const vertexData = this.vertexData
    const uvData = this.uvData

    vertexData.length = uvData.length

    const matrix = tempMatrix.copyFrom(this.worldTransform)
    const { a, b, c, d, tx, ty } = matrix

    for (let i = 0, j = vertexData.length / 2; i < j; i++) {
      const x = uvData[i * 2]
      const y = uvData[i * 2 + 1]

      vertexData[i * 2] = a * x + c * y + tx
      vertexData[i * 2 + 1] = b * x + d * y + ty
    }

    this._updateID = this._dirtyID

    const indexData = (this.indexData = new Array(vertexData.length / 2))

    // TODO: Remove indexData, pixi-batch-renderer might have a problem with it
    for (let i = 0, j = indexData.length; i < j; i++) {
      indexData[i] = i
    }
  }

  /**
   * Sets the local-space control points of the curve.
   * @param c0
   * @param c1
   * @param c2
   */
  setControlPoints(c0: Point, c1: Point, c2: Point): void {
    const texturePoints = this.shape.controlPoints

    this.setTransform(texturePoints[0], texturePoints[1], texturePoints[2], c0, c1, c2)
  }

  setTransform(...args: any): this {
    const transform = this.transform
    const localTransform = transform.localTransform

    // @ts-ignore
    transform._localID++

    if (args.length === 1) {
      localTransform.copyFrom(args[0])

      return this
    }
    if (args.length === 9) {
      super.setTransform(...args)
    }

    localTransform.identity()

    // Design space
    let ax0: number
    let ay0: number
    let bx0: number
    let by0: number
    let cx0: number
    let cy0: number

    // Texture space
    let ax1: number
    let ay1: number
    let bx1: number
    let by1: number
    let cx1: number
    let cy1: number

    if (args.length === 6) {
      const points = args as Point[]

      ax0 = points[0].x
      ay0 = points[0].y
      bx0 = points[1].x
      by0 = points[1].y
      cx0 = points[2].x
      cy0 = points[2].y

      ax1 = points[3].x
      ay1 = points[3].y
      bx1 = points[4].x
      by1 = points[4].y
      cx1 = points[5].x
      cy1 = points[5].y
    } else {
      const coords = args as number[]

      ax0 = coords[0]
      ay0 = coords[1]
      bx0 = coords[2]
      by0 = coords[3]
      cx0 = coords[4]
      cy0 = coords[5]

      ax1 = coords[6]
      ay1 = coords[7]
      bx1 = coords[8]
      by1 = coords[9]
      cx1 = coords[10]
      cy1 = coords[11]
    }

    const input = [ax0, bx0, cx0, ay0, by0, cy0, 1, 1, 1]
    const inverse = mat3.invert(input, input)

    // input * textureTransform = output
    // textureTransform = inverse(input) * output
    localTransform.a = inverse[0] * ax1 + inverse[3] * bx1 + inverse[6] * cx1
    localTransform.c = inverse[1] * ax1 + inverse[4] * bx1 + inverse[7] * cx1
    localTransform.tx = inverse[2] * ax1 + inverse[5] * bx1 + inverse[8] * cx1

    localTransform.b = inverse[0] * ay1 + inverse[3] * by1 + inverse[6] * cy1
    localTransform.d = inverse[1] * ay1 + inverse[4] * by1 + inverse[7] * cy1
    localTransform.ty = inverse[2] * ay1 + inverse[5] * by1 + inverse[8] * cy1

    transform.setFromMatrix(localTransform)

    return this
  }

  /**
   * Updates the transform of the conic, and if changed updates the geometry data.
   *
   * @override
   */
  updateTransform(): void {
    const ret = super.updateTransform()

    if (this._transformID !== this.transform._worldID) {
      this.updateConic()
      this._transformID = this.transform._worldID
    }

    return ret
  }
}
