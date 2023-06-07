import type { UnitsType } from '@hpcreery/tracespace-parser'
import type { ImageGraphic, Position } from '@hpcreery/tracespace-plotter'
import { Tool } from '@hpcreery/tracespace-plotter/lib/tool-store'
import { ColorSource } from 'pixi.js'

export interface TGraphicsOptions {
  units: UnitsType
  darkColor: number
  darkAlpha: number
  clearColor: number
  clearAlpha: number
  outlineWidth: number
  outlineMode: boolean
  scale: number
  index: number
  position?: Position
  shape?: ImageGraphic
}

export interface TRendererLayer {
  uid: string
  name: string
  color: ColorSource
  visible: boolean
  zIndex: number
  tools: Partial<Record<string, Tool>>
}

export interface TIntersectItem {
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  properties: TGraphicsOptions
  position: {
    x: number
    y: number
  }
}

export type THistogram = Array<{
  dcode: string | undefined
  tool: Tool | undefined
  polarity: string | undefined
  indexes: number[]
}>
