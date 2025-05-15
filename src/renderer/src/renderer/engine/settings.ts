import { SnapMode, ColorBlend } from "./types"
import { vec4 } from "gl-matrix"

// GENERAL SETTINGS
export interface RenderSettings {
  FPS: number
  MSPFRAME: number
  OUTLINE_MODE: boolean
  SKELETON_MODE: boolean
  SNAP_MODE: SnapMode
  COLOR_BLEND: ColorBlend
  BACKGROUND_COLOR: vec4
  MAX_ZOOM: number
  MIN_ZOOM: number
  ZOOM_TO_CURSOR: boolean
  SHOW_DATUMS: boolean
}

export const settings: RenderSettings = {
  MSPFRAME: 1000 / 60,
  get FPS(): number {
    return 1000 / this.MSPFRAME
  },
  set FPS(value: number) {
    this.MSPFRAME = 1000 / value
  },
  OUTLINE_MODE: false,
  SKELETON_MODE: false,
  SNAP_MODE: SnapMode.OFF,
  COLOR_BLEND: ColorBlend.CONTRAST,
  BACKGROUND_COLOR: [0, 0, 0, 0],
  MAX_ZOOM: 1000,
  MIN_ZOOM: 0.001,
  ZOOM_TO_CURSOR: true,
  SHOW_DATUMS: false,
}

// GRID SETTINGS
export interface GridRenderProps {
  enabled: boolean
  color: vec4
  spacing_x: number
  spacing_y: number
  offset_x: number
  offset_y: number
  _type: number
  type: "dots" | "lines"
}

export const grid: GridRenderProps = {
  enabled: true,
  color: [0.2, 0.2, 0.2, 0.5],
  spacing_x: 1,
  spacing_y: 1,
  offset_x: 0,
  offset_y: 0,
  _type: 0,
  get type(): "dots" | "lines" {
    return this._type === 0 ? "dots" : "lines"
  },
  set type(value: "dots" | "lines") {
    switch (value) {
      case "dots":
        this._type = 0
        break
      case "lines":
        this._type = 1
        break
      default:
        this._type = 0
    }
  },
}

// ORIGIN SETTINGS
export interface OriginRenderProps {
  enabled: boolean
}

export const origin: OriginRenderProps = {
  enabled: true,
}

export const dpr: number = 1
