export type Vector4Like = {
  x: number
  y: number
  z: number
  w: number
}

export type Matrix4Like = {
  elements: ArrayLike<number>
}

export type QuaternionLike = {
  x: number
  y: number
  z: number
  w: number
}

export type BufferAttribute4Like = {
  getX: (index: number) => number
  getY: (index: number) => number
  getZ: (index: number) => number
  getW: (index: number) => number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export class Vector4 {
  public x: number
  public y: number
  public z: number
  public w: number
  public readonly isVector4: true = true

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  get width(): number {
    return this.z
  }

  set width(value: number) {
    this.z = value
  }

  get height(): number {
    return this.w
  }

  set height(value: number) {
    this.w = value
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x
    this.y = y
    this.z = z
    this.w = w

    return this
  }

  setScalar(scalar: number): this {
    this.x = scalar
    this.y = scalar
    this.z = scalar
    this.w = scalar

    return this
  }

  setX(x: number): this {
    this.x = x
    return this
  }

  setY(y: number): this {
    this.y = y
    return this
  }

  setZ(z: number): this {
    this.z = z
    return this
  }

  setW(w: number): this {
    this.w = w
    return this
  }

  setComponent(index: number, value: number): this {
    switch (index) {
      case 0:
        this.x = value
        break
      case 1:
        this.y = value
        break
      case 2:
        this.z = value
        break
      case 3:
        this.w = value
        break
      default:
        throw new Error("index is out of range: " + index)
    }

    return this
  }

  getComponent(index: number): number {
    switch (index) {
      case 0:
        return this.x
      case 1:
        return this.y
      case 2:
        return this.z
      case 3:
        return this.w
      default:
        throw new Error("index is out of range: " + index)
    }
  }

  clone(): Vector4 {
    return new Vector4(this.x, this.y, this.z, this.w)
  }

  copy(v: Partial<Vector4Like> & Pick<Vector4Like, "x" | "y" | "z">): this {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    this.w = v.w !== undefined ? v.w : 1

    return this
  }

  add(v: Vector4Like): this {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    this.w += v.w

    return this
  }

  addScalar(s: number): this {
    this.x += s
    this.y += s
    this.z += s
    this.w += s

    return this
  }

  addVectors(a: Vector4Like, b: Vector4Like): this {
    this.x = a.x + b.x
    this.y = a.y + b.y
    this.z = a.z + b.z
    this.w = a.w + b.w

    return this
  }

  addScaledVector(v: Vector4Like, s: number): this {
    this.x += v.x * s
    this.y += v.y * s
    this.z += v.z * s
    this.w += v.w * s

    return this
  }

  sub(v: Vector4Like): this {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    this.w -= v.w

    return this
  }

  subScalar(s: number): this {
    this.x -= s
    this.y -= s
    this.z -= s
    this.w -= s

    return this
  }

  subVectors(a: Vector4Like, b: Vector4Like): this {
    this.x = a.x - b.x
    this.y = a.y - b.y
    this.z = a.z - b.z
    this.w = a.w - b.w

    return this
  }

  multiply(v: Vector4Like): this {
    this.x *= v.x
    this.y *= v.y
    this.z *= v.z
    this.w *= v.w

    return this
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    this.w *= scalar

    return this
  }

  applyMatrix4(m: Matrix4Like): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const e = m.elements

    this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w
    this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w
    this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w

    return this
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar)
  }

  setAxisAngleFromQuaternion(q: QuaternionLike): this {
    this.w = 2 * Math.acos(q.w)

    const s = Math.sqrt(1 - q.w * q.w)

    if (s < 0.0001) {
      this.x = 1
      this.y = 0
      this.z = 0
    } else {
      this.x = q.x / s
      this.y = q.y / s
      this.z = q.z / s
    }

    return this
  }

  setAxisAngleFromRotationMatrix(m: Matrix4Like): this {
    let angle = 0
    let x = 0
    let y = 0
    let z = 0
    const epsilon = 0.01
    const epsilon2 = 0.1
    const te = m.elements
    const m11 = te[0]
    const m12 = te[4]
    const m13 = te[8]
    const m21 = te[1]
    const m22 = te[5]
    const m23 = te[9]
    const m31 = te[2]
    const m32 = te[6]
    const m33 = te[10]

    if (Math.abs(m12 - m21) < epsilon && Math.abs(m13 - m31) < epsilon && Math.abs(m23 - m32) < epsilon) {
      if (
        Math.abs(m12 + m21) < epsilon2 &&
        Math.abs(m13 + m31) < epsilon2 &&
        Math.abs(m23 + m32) < epsilon2 &&
        Math.abs(m11 + m22 + m33 - 3) < epsilon2
      ) {
        this.set(1, 0, 0, 0)
        return this
      }

      angle = Math.PI

      const xx = (m11 + 1) / 2
      const yy = (m22 + 1) / 2
      const zz = (m33 + 1) / 2
      const xy = (m12 + m21) / 4
      const xz = (m13 + m31) / 4
      const yz = (m23 + m32) / 4

      if (xx > yy && xx > zz) {
        if (xx < epsilon) {
          x = 0
          y = 0.707106781
          z = 0.707106781
        } else {
          x = Math.sqrt(xx)
          y = xy / x
          z = xz / x
        }
      } else if (yy > zz) {
        if (yy < epsilon) {
          x = 0.707106781
          y = 0
          z = 0.707106781
        } else {
          y = Math.sqrt(yy)
          x = xy / y
          z = yz / y
        }
      } else if (zz < epsilon) {
        x = 0.707106781
        y = 0.707106781
        z = 0
      } else {
        z = Math.sqrt(zz)
        x = xz / z
        y = yz / z
      }

      this.set(x, y, z, angle)
      return this
    }

    let s = Math.sqrt((m32 - m23) * (m32 - m23) + (m13 - m31) * (m13 - m31) + (m21 - m12) * (m21 - m12))

    if (Math.abs(s) < 0.001) s = 1

    this.x = (m32 - m23) / s
    this.y = (m13 - m31) / s
    this.z = (m21 - m12) / s
    this.w = Math.acos((m11 + m22 + m33 - 1) / 2)

    return this
  }

  setFromMatrixPosition(m: Matrix4Like): this {
    const e = m.elements

    this.x = e[12]
    this.y = e[13]
    this.z = e[14]
    this.w = e[15]

    return this
  }

  min(v: Vector4Like): this {
    this.x = Math.min(this.x, v.x)
    this.y = Math.min(this.y, v.y)
    this.z = Math.min(this.z, v.z)
    this.w = Math.min(this.w, v.w)

    return this
  }

  max(v: Vector4Like): this {
    this.x = Math.max(this.x, v.x)
    this.y = Math.max(this.y, v.y)
    this.z = Math.max(this.z, v.z)
    this.w = Math.max(this.w, v.w)

    return this
  }

  clamp(min: Vector4Like, max: Vector4Like): this {
    this.x = clamp(this.x, min.x, max.x)
    this.y = clamp(this.y, min.y, max.y)
    this.z = clamp(this.z, min.z, max.z)
    this.w = clamp(this.w, min.w, max.w)

    return this
  }

  clampScalar(minVal: number, maxVal: number): this {
    this.x = clamp(this.x, minVal, maxVal)
    this.y = clamp(this.y, minVal, maxVal)
    this.z = clamp(this.z, minVal, maxVal)
    this.w = clamp(this.w, minVal, maxVal)

    return this
  }

  clampLength(min: number, max: number): this {
    const len = this.length()

    return this.divideScalar(len || 1).multiplyScalar(clamp(len, min, max))
  }

  floor(): this {
    this.x = Math.floor(this.x)
    this.y = Math.floor(this.y)
    this.z = Math.floor(this.z)
    this.w = Math.floor(this.w)

    return this
  }

  ceil(): this {
    this.x = Math.ceil(this.x)
    this.y = Math.ceil(this.y)
    this.z = Math.ceil(this.z)
    this.w = Math.ceil(this.w)

    return this
  }

  round(): this {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.z = Math.round(this.z)
    this.w = Math.round(this.w)

    return this
  }

  roundToZero(): this {
    this.x = Math.trunc(this.x)
    this.y = Math.trunc(this.y)
    this.z = Math.trunc(this.z)
    this.w = Math.trunc(this.w)

    return this
  }

  negate(): this {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    this.w = -this.w

    return this
  }

  dot(v: Vector4Like): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
  }

  length(): number {
    return Math.sqrt(this.lengthSq())
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w)
  }

  normalize(): this {
    return this.divideScalar(this.length() || 1)
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length)
  }

  lerp(v: Vector4Like, alpha: number): this {
    this.x += (v.x - this.x) * alpha
    this.y += (v.y - this.y) * alpha
    this.z += (v.z - this.z) * alpha
    this.w += (v.w - this.w) * alpha

    return this
  }

  lerpVectors(v1: Vector4Like, v2: Vector4Like, alpha: number): this {
    this.x = v1.x + (v2.x - v1.x) * alpha
    this.y = v1.y + (v2.y - v1.y) * alpha
    this.z = v1.z + (v2.z - v1.z) * alpha
    this.w = v1.w + (v2.w - v1.w) * alpha

    return this
  }

  equals(v: Vector4Like): boolean {
    return v.x === this.x && v.y === this.y && v.z === this.z && v.w === this.w
  }

  fromArray(array: ArrayLike<number>, offset = 0): this {
    this.x = array[offset]
    this.y = array[offset + 1]
    this.z = array[offset + 2]
    this.w = array[offset + 3]

    return this
  }

  toArray(array: number[] = [], offset = 0): number[] {
    array[offset] = this.x
    array[offset + 1] = this.y
    array[offset + 2] = this.z
    array[offset + 3] = this.w

    return array
  }

  fromBufferAttribute(attribute: BufferAttribute4Like, index: number): this {
    this.x = attribute.getX(index)
    this.y = attribute.getY(index)
    this.z = attribute.getZ(index)
    this.w = attribute.getW(index)

    return this
  }

  random(): this {
    this.x = Math.random()
    this.y = Math.random()
    this.z = Math.random()
    this.w = Math.random()

    return this
  }

  *[Symbol.iterator](): IterableIterator<number> {
    yield this.x
    yield this.y
    yield this.z
    yield this.w
  }
}
