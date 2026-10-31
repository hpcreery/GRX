import type { Binary, TShapeTransform, TShapeTransformOrder } from "@grx/artwork-format/types"
import { mat3, vec2 } from "gl-matrix"

export default class ShapeTransform implements TShapeTransform {
  public datum: vec2 = vec2.fromValues(0, 0)
  public rotation = 0
  public scale = 1
  public mirror_x: Binary = 0
  public mirror_y: Binary = 0
  public order: TShapeTransformOrder = ["translate", "rotate", "mirror", "scale"]
  public index = 0
  public polarity = 1
  public readonly matrix = mat3.create()
  public readonly matrixInverse = mat3.create()

  public update(inputMatrix: mat3): this {
    const { rotation, scale, datum } = this
    mat3.copy(this.matrix, inputMatrix)
    this.order = [...new Set(this.order)]
    for (const transform of this.order) {
      switch (transform) {
        case "scale":
          mat3.scale(this.matrix, this.matrix, [scale, scale])
          break
        case "translate":
          mat3.translate(this.matrix, this.matrix, datum)
          break
        case "rotate":
          // rotation is counterclockwise
          mat3.rotate(this.matrix, this.matrix, rotation * (Math.PI / 180))
          break
        case "mirror":
          mat3.scale(this.matrix, this.matrix, [this.mirror_x ? -1 : 1, this.mirror_y ? -1 : 1])
          break
      }
    }
    mat3.invert(this.matrixInverse, this.matrix)
    return this
  }

  public setTransform(transform: Partial<TShapeTransform>): this {
    if (transform.datum) this.datum = vec2.clone(transform.datum)
    if (transform.rotation !== undefined) this.rotation = transform.rotation
    if (transform.scale !== undefined) this.scale = transform.scale
    if (transform.mirror_x !== undefined) this.mirror_x = transform.mirror_x
    if (transform.mirror_y !== undefined) this.mirror_y = transform.mirror_y
    if (transform.order) this.order = [...transform.order]
    return this
  }

  public getTransform(): TShapeTransform {
    return {
      datum: vec2.clone(this.datum),
      rotation: this.rotation,
      scale: this.scale,
      mirror_x: this.mirror_x,
      mirror_y: this.mirror_y,
      order: [...this.order],
    }
  }
}
