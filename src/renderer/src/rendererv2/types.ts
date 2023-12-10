
export const FeatureTypeIdentifyer = {
  PAD: 'pad',
  LINE: 'line',
  ARC: 'arc',
  ARCSEGMENT: 'arcsegment',
  LINESEGMENT: 'linesegment',
  CONTOUR: 'contour',
  SURFACE: 'surface',
  MACRO: 'macro',
  SYMBOL_DEFINITION: 'symbol_defintion',
  MACRO_DEFINITION: 'macro_definition',
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
