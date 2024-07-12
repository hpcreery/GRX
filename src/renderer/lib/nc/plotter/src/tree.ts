import type {Parent} from 'unist'

export type UnitsType = "mm" | "in"

import * as Shapes from '@src/renderer/shapes'

export const IMAGE = 'image'
export const IMAGE_SHAPE = 'imageShape'
export const IMAGE_PATH = 'imagePath'
export const IMAGE_REGION = 'imageRegion'

export const LINE = 'line'
export const ARC = 'arc'

export const CIRCLE = 'circle'

export type Position = [x: number, y: number]

export type ArcPosition = [x: number, y: number, theta: number]

export type SizeEnvelope = [x1: number, y1: number, x2: number, y2: number] | []


export interface ImageTree extends Parent {
  type: typeof IMAGE
  units: UnitsType
  children: Shapes.Shape[]
}
