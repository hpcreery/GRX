import type * as Shapes from "@grx/artwork-format/shape"
import { toMap, toValues } from "@grx/artwork-format/types"
import type { vec2 } from "gl-matrix"

export * from "@grx/artwork-format/types"

export const ColorBlend = {
  CONTRAST: "Contrast",
  OVERLAY: "Overlay",
  OPAQUE: "Opaque",
} as const
export type ColorBlend = (typeof ColorBlend)[keyof typeof ColorBlend]

export const SnapMode = {
  OFF: "OFF",
  EDGE: "EDGE",
  CENTER: "CENTER",
  // GRID: "GRID",
} as const
export const SNAP_MODES = toValues(SnapMode)
export const SNAP_MODES_MAP = toMap(SNAP_MODES)
export type SnapMode = keyof typeof SNAP_MODES_MAP

export const PointerMode = {
  MOVE: "MOVE",
  SELECT: "SELECT",
  MEASURE: "MEASURE",
} as const
export const POINTER_MODES = toValues(PointerMode)
export const POINTER_MODES_MAP = toMap(POINTER_MODES)
export type PointerMode = keyof typeof POINTER_MODES_MAP

export interface ViewBox {
  width: number
  height: number
  x: number
  y: number
}

export type ShapeDistance = {
  // snapPoint?: vec2
  direction?: vec2
  distance?: number
  shape: Shapes.Shape
  children: ShapeDistance[]
}
