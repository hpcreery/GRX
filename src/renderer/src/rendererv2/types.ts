
export const FeatureTypeIdentifyer = {
  PAD: 'pad',
  LINE: 'line',
  ARC: 'arc',
  ARCSEGMENT: 'arcsegment',
  LINESEGMENT: 'linesegment',
  CONTOUR: 'contour',
  SURFACE: 'surface',
  SYMBOL: 'symbol',
} as const

export type FeatureTypeIdentifyers = typeof FeatureTypeIdentifyer[keyof typeof FeatureTypeIdentifyer]


export interface IPlotRecord {
  type: FeatureTypeIdentifyers
  get array(): number[]
  get object(): Record<string, number>
  get length(): number
}
