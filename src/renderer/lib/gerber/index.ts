import { plot } from './plotter/src'
import { parse } from '@hpcreery/tracespace-parser'
import type { LayerRendererProps } from '@src/renderer/layer'
import * as Comlink from 'comlink'


export async function plugin(buffer: ArrayBuffer, props: Partial<Omit<LayerRendererProps, "regl">>, addLayer: (params: Omit<LayerRendererProps, "regl">) => void): Promise<void> {
  const decoder = new TextDecoder('utf-8')
  const file = decoder.decode(buffer)
  const tree = parse(file)
  const image = plot(tree)
  addLayer({
    name: props.name || 'Gerber',
    image: image.children,
    units: image.units == 'in' ? 'inch' : 'mm',
    ...props
  })
}

Comlink.expose(plugin)
