import { ColorSource } from 'pixi.js'

export interface Colors {
  copper: string
  mask: string
  silkscreen: string
  paste: string
  substrate: string
}

export type ViewBox = [x: number, y: number, width: number, height: number]

export interface PathProps {
  strokeWidth: number
  fill: string
}

export interface RendererLayer {
  uid: string
  name: string
  color: ColorSource
  visible: boolean
  zIndex: number
}
