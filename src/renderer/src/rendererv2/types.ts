import { vec2 } from 'gl-matrix'

export const FeatureTypeIdentifyer = {
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
} as const

export type FeatureTypeIdentifyers = typeof FeatureTypeIdentifyer[keyof typeof FeatureTypeIdentifyer]

export interface IPlotRecord {
  type: FeatureTypeIdentifyers
  get array(): number[]
  get object(): Record<string, number>
  get length(): number
}

export interface ISymbolRecord {
  type: FeatureTypeIdentifyers
  get array(): number[]
  get length(): number
}

export function toMap<T extends string>(arr: readonly T[]): { [key in T]: number } {
  return Object.fromEntries(arr.map((key, i) => [key, i])) as { [key in T]: number }
}

export type TransformOrder = ('scale' | 'rotate' | 'translate' | 'mirror')[]

export interface Transform {
  datum: vec2
  rotation: number
  scale: number
  mirror: number
  order?: TransformOrder
}
