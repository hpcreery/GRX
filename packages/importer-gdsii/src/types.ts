import type { Shape } from "@grx/artwork-format/shape"

export type RecordToken = {
  recordType: number
  data: ArrayBuffer | number[] | string
}

export type GDSIIHierarchy = {
  [cellName: string]: {
    layer: number
    shape: Shape
  }[]
}

export type LayerHierarchy = {
  [layer: number]: {
    shapes: Shape[]
  }
}
