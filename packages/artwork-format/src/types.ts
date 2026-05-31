import type { vec2 } from "gl-matrix"

export const FeatureTypeIdentifier = {
  PAD: "pad",
  LINE: "line",
  ARC: "arc",
  SURFACE: "surface",
  POLYLINE: "polyline",
  STEP_AND_REPEAT: "step_and_repeat",
  DATUM_POINT: "datum_point",
  DATUM_TEXT: "datum_text",
  DATUM_LINE: "datum_line",
  DATUM_ARC: "datum_arc",
} as const

export const SymbolTypeIdentifier = {
  SYMBOL_DEFINITION: "symbol_defintion",
  MACRO_DEFINITION: "macro_definition",
} as const

export const SurfaceContourTypeIdentifier = {
  CONTOUR: "contour",
} as const

export const ContourSegmentTypeIdentifier = {
  ARCSEGMENT: "arcsegment",
  LINESEGMENT: "linesegment",
} as const

export type SymbolDefinitionTypeIdentifiers = (typeof SymbolTypeIdentifier)[keyof typeof SymbolTypeIdentifier]

export type FeatureTypeIdentifiers = (typeof FeatureTypeIdentifier)[keyof typeof FeatureTypeIdentifier]

export type SurfaceContourTypeIdentifiers = (typeof SurfaceContourTypeIdentifier)[keyof typeof SurfaceContourTypeIdentifier]

export type ContourSegmentTypeIdentifiers = (typeof ContourSegmentTypeIdentifier)[keyof typeof ContourSegmentTypeIdentifier]

export interface IPlotRecord {
  type: FeatureTypeIdentifiers
  attributes: AttributesType
  units: Units
}

export interface ISymbolRecord {
  type: SymbolDefinitionTypeIdentifiers
}

export type AttributesType = { [key: string]: string }

export function toMap<T extends string>(arr: readonly T[]): { [key in T]: number } {
  return Object.fromEntries(arr.map((key, i) => [key, i])) as { [key in T]: number }
}

// biome-ignore lint: allow any here
export function toValues<T extends string>(map: { [key in T]: any }): T[] {
  return Object.keys(map) as T[]
}

export function toEnum<T extends string>(arr: readonly T[]): { [key in T]: key } {
  return Object.fromEntries(arr.map((key) => [key, key])) as { [key in T]: key }
}

export type Binary = 0 | 1

export type IntersectingTypes<T, U> = { [K in Extract<keyof T, keyof U>]: T[K] }
export type NonIntersectingTypes<T, U> = { [K in Exclude<keyof T, keyof U>]: T[K] }

export type Units = "mm" | "inch" | "cm" | "mil" | number

export type BoundingBox = {
  min: vec2
  max: vec2
}

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
