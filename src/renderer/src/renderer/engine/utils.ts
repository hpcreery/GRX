import { mat3, vec2 } from "gl-matrix"
import { Units } from "./types"

export type immutable = boolean | number | bigint | string | symbol | null | undefined

export type ptr<T extends immutable> = { value: T }

export function ptr<T extends immutable>(read: () => T, write: (v: T) => void): ptr<T> {
  return {
    get value(): T {
      return read()
    },
    set value(v) {
      write(v)
    },
  }
}

export function malloc<T extends immutable>(value: T): ptr<T> {
  let i: T = value
  return ptr(
    function () {
      return i
    },
    function (v) {
      i = v
    },
  )
}

export function getUnitsConversion(units: Units): number {
  switch (units) {
    case "mm":
      return 1
    case "inch":
      return 1 / 25.4
    case "cm":
      return 1 / 10
    case "mil":
      return 1000 / 25.4
    default:
      return units
  }
}

// export const UID = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
export const UID = (): string => crypto.randomUUID()

// https://stackoverflow.com/questions/4361242/extract-rotation-scale-values-from-2d-transformation-matrix
export function getScaleMat3(matrix: mat3): number {
  return Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1])
}

// this has not been tested yet
export function getRotationMat3(matrix: mat3): number {
  return Math.atan2(matrix[1], matrix[0])
}

// this has not been tested yet
export function getTranslationMat3(matrix: mat3): vec2 {
  return vec2.fromValues(matrix[6], matrix[7])
}
