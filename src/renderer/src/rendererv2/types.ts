export interface IPlotRecord {
  type: string
  get array(): number[]
  get object(): Record<string, number>
  get length(): number
}

// export function staticImplements<T>(ctor: T): void {
//   // do nothing
// }

// export interface IGetLen {
//   items: number
//   empty: number[]
// }
