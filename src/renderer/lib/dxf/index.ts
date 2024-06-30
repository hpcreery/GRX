// see https://github.com/vagran/dxf-viewer/tree/master/src/parser
import DxfParser from 'dxf-parser';
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
    dxf = parser.parse(file);
  } catch (err) {
    return console.error(err.stack);
  }

  console.log('dxf', JSON.stringify(dxf))


  const layerHierarchy = CONVERTER.convert(dxf)

  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    delete props.name
    addLayer({
      name: layer,
      units: "mm", // TODO: get units from dxf
      image: shapes.shapes,
      ...props
    })
  }
}

Comlink.expose(plugin)
