import { Tool } from '@hpcreery/tracespace-plotter/lib/tool-store'
import { ColorSource } from 'pixi.js'

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
  dcode: string | undefined
  index: number
}

export type THistogram = Array<{
  dcode: string | undefined
  tool: Tool | undefined
  polarity: string
  indexes: number[]
}>
