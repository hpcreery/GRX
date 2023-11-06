export interface IPlotRecord {
  type: string
  get array(): number[]
  get object(): Record<string, number>
  get length(): number
}
