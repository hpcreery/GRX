import { mat3, vec2 } from "gl-matrix"
import { Units } from "./types"
import { TypedEventTarget } from 'typescript-event-target'

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

/**
 * Converts various units to millimeters (mm)
 * @param units Units to convert from. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
 * @returns Conversion factor to mm
 */
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

/**
 * https://stackoverflow.com/questions/4361242/extract-rotation-scale-values-from-2d-transformation-matrix
 * @param matrix
 * @returns
 */
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

/**
 * cyrb53 (c) 2018 bryc (github.com/bryc). License: Public domain. Attribution appreciated.
 * A fast and simple 64-bit (or 53-bit) string hash function with decent collision resistance.
 * Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
 * See https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/52171480#52171480
 * https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
*/
export const cyrb64 = (str: string, seed = 0): number => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch: number; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  // For a single 53-bit numeric return value we could return
  // 4294967296 * (2097151 & h2) + (h1 >>> 0);
  // but we instead return the full 64-bit value:
  // return [h2>>>0, h1>>>0];
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export interface UpdateEventsMap {
  update: Event
}

export class UpdateEventTarget extends TypedEventTarget<UpdateEventsMap> {
  protected controller: AbortController = new AbortController()

  public onUpdate(callback: (ev: Event) => void): void {
    this.addEventListener("update", callback, { signal: this.controller.signal })
  }

  public unSubscribe(): void {
    this.controller.abort()
    this.controller = new AbortController()
  }
}
