import { vec2 } from 'gl-matrix'

export const FeatureTypeIdentifier = {
  PAD: 'pad',
  LINE: 'line',
  ARC: 'arc',
  ARCSEGMENT: 'arcsegment',
  LINESEGMENT: 'linesegment',
  CONTOUR: 'contour',
  SURFACE: 'surface',
  POLYLINE: 'polyline',
  MACRO: 'macro',
  SYMBOL_DEFINITION: 'symbol_defintion',
  MACRO_DEFINITION: 'macro_definition',
  STEP_AND_REPEAT: 'step_and_repeat',
  DATUM_POINT: 'datum_point',
  DATUM_TEXT: 'datum_text',
  DATUM_LINE: 'datum_line',
  DATUM_ARC: 'datum_arc',
  GLYPH_TEXT: 'glyph_text',
} as const

export type FeatureTypeIdentifiers = typeof FeatureTypeIdentifier[keyof typeof FeatureTypeIdentifier]

export interface IPlotRecord {
  type: FeatureTypeIdentifiers
  attributes: AttributeCollection
}

export interface ISymbolRecord {
  type: FeatureTypeIdentifiers
}

export type AttributeCollection = { [key: string]: string | undefined }

export function toMap<T extends string>(arr: readonly T[]): { [key in T]: number } {
  return Object.fromEntries(arr.map((key, i) => [key, i])) as { [key in T]: number }
}

export type TransformOrder = ('scale' | 'rotate' | 'translate' | 'mirror')[]

export interface Transform {
  /**
   * Translation in x and y
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
   * Order of transformations
   */
  order?: TransformOrder
}

export type Binary = 0 | 1

export type IntersectingTypes<T, U> = { [K in Extract<keyof T, keyof U>]: T[K] }
export type NonIntersectingTypes<T, U> = { [K in Exclude<keyof T, keyof U>]: T[K] }

export type Units = 'mm' | 'inch' | 'cm' | 'mil' | number

export type BoundingBox = {
  min: vec2
  max: vec2
}
