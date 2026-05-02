import type * as Shapes from "@src/data/shape/shape"
import type { Parent } from "unist"
import type { Units } from "./options"

export type { Polarity } from "@hpcreery/tracespace-parser"

export const IMAGE = "image"
export const IMAGE_SHAPE = "imageShape"
export const IMAGE_PATH = "imagePath"
export const IMAGE_REGION = "imageRegion"

export const LINE = "line"
export const ARC = "arc"

export const CIRCLE = "circle"
export const RECTANGLE = "rectangle"
export const POLYGON = "polygon"
export const OUTLINE = "outline"
export const LAYERED_SHAPE = "layeredShape"

export type Position = [x: number, y: number]

export type ArcPosition = [x: number, y: number, theta: number]

export type SizeEnvelope = [x1: number, y1: number, x2: number, y2: number] | []

export interface ImageTree extends Parent {
  type: typeof IMAGE
  units: Units
  children: Shapes.Shape[]
}
