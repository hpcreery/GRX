export interface IPlotRecord {
  type: string
  get array(): number[]
  get length(): number
  get object(): Record<string, number>
}

export interface ISurfaceRecord {
  type: string
  get array(): number[][][]
  get length(): number
  // get object(): Record<string, number[][]>
}
