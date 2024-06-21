import { vec2 } from 'gl-matrix'

export const FeatureTypeIdentifier = {
  PAD: 'pad',
  LINE: 'line',
  BRUSHED_LINE: 'brushedline',
  ARC: 'arc',
  BRUSHED_ARC: 'brushedarc',
  ARCSEGMENT: 'arcsegment',
  LINESEGMENT: 'linesegment',
  CONTOUR: 'contour',
  SURFACE: 'surface',
  POLYLINE: 'polyline',
  MACRO: 'macro',
  SYMBOL_DEFINITION: 'symbol_defintion',
  MACRO_DEFINITION: 'macro_definition',
  STEP_AND_REPEAT: 'step_and_repeat',
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
  datum: vec2
  rotation: number
  scale: number
  mirror_x: Binary
  mirror_y: Binary
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
