// see https://github.com/vagran/dxf-viewer/tree/master/src/parser
import DxfParser from 'dxf-parser'
import * as CONVERTER from './converter'

import type { LayerRendererProps } from '@src/renderer/layer'
import * as Comlink from 'comlink'

// import file from './testdata/noentities.dxf?url'

export async function plugin(
  file: string,
  props: Partial<Omit<LayerRendererProps, 'regl'>>,
  addLayer: (params: Omit<LayerRendererProps, 'regl'>) => void
): Promise<void> {
  const parser = new DxfParser()
  let dxf
  try {
    dxf = parser.parse(file)
  } catch (err) {
    return console.error(err.stack)
  }

  console.log('dxf', JSON.stringify(dxf))

  let units: 'inch' | 'mm' = 'inch'
  // check if $INSUNITS exists
  if (dxf.header && Object.keys(dxf.header).includes('$INSUNITS')) {
    units = dxf.header['$INSUNITS'] === 1
    ? 'inch'
    : dxf.header['$INSUNITS'] === 4
      ? 'mm'
      : 'inch'
  } else {
    console.warn('No $INSUNITS found, defaulting to inches')
  }
  const layerHierarchy = CONVERTER.convert(dxf)

  for (const [layerName, layer] of Object.entries(layerHierarchy)) {
    delete props.name
    addLayer({
      name: layerName,
      units: units,
      color: layer.color,
      image: layer.shapes,
      ...props
    })
  }
}

Comlink.expose(plugin)
