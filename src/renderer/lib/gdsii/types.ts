import * as Shapes from "@src/renderer/engine/step/layer/shapes/shapes"

export type RecordToken = {
  recordType: number
  data: ArrayBuffer | number[] | string
}

export type GDSIIHierarchy = {
  [cellName: string]: {
    layer: number
    // datatype: number
    shape: Shapes.Shape
  }[]
}

export type LayerHierarchy = {
  [layer: number]: {
    shapes: Shapes.Shape[]
  }
}
