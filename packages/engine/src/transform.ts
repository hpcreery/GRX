import { mat3, vec2 } from "gl-matrix"
import type { Binary } from "./types"

export type TransformOrder = ("scale" | "rotate" | "translate" | "mirror")[]

export interface Transform {
  /**
   * Translation in x and y, in mm units. The base unit is mm. Unless Transform is a part to a shape with different units ( like step and repeats ) then those units apply.
   */
  datum: vec2
  /**
   * Rotation in degrees (counterclockwise)
   */
  rotation: number
  /**
   * Scale factor, 1 = 100% (no scaling)
   */
  scale: number
  /**
   * Mirror x cooriinate values => x = -x
   */
  mirror_x: Binary
  /**
   * Mirror y cooriinate values => y = -y
   */
  mirror_y: Binary
  /**
   * Order of transformations. Default is ["translate", "rotate", "mirror", "scale"]
   */
  order?: TransformOrder
}

export default class ShapeTransform implements Transform {
  public datum: vec2 = vec2.create()
  public rotation = 0
  public scale = 1
  public mirror_x: Binary = 0
  public mirror_y: Binary = 0
  public order: TransformOrder = ["translate", "rotate", "mirror", "scale"]
  public index = 0
  public polarity = 1
  public matrix = mat3.create()
  public inverseMatrix = mat3.create()
  public update(inputMatrix: mat3): void {
    const { rotation, scale, datum } = this
    this.matrix = mat3.clone(inputMatrix)
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
    mat3.invert(this.inverseMatrix, this.matrix)
  }
}
