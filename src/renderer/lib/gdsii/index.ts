// import gdsiiFile from './testdata/example.gds2?url'
// import gdsiiFile from './testdata/inv.gds2?url'
// import gdsiiFile from './testdata/example0.gds?url'
// import gdsiiFile from './testdata/example1.gds?url'
// import gdsiiFile from './testdata/example2.gds?url' // broken boundaries
// import gdsiiFile from './testdata/GdsIITests_test.gds?url' // broken boundaries, paths with different ends
// import gdsiiFile from './testdata/GdsIITests_circles.gds?url'

import * as LEXER from './lexer'
import * as PARSER from './parser'
import * as CONVERTER from './converter'

import * as Comlink from 'comlink'
import { AddLayerProps } from '@src/renderer/plugins'

export async function plugin(buffer: ArrayBuffer, props: Partial<AddLayerProps>, addLayer: (params: AddLayerProps) => void): Promise<void> {
  console.log('GDSII plugin')
  const tokens = LEXER.record_reader(buffer)
  const bnf = PARSER.parse(tokens)
  const layerHierarchy = CONVERTER.convert(bnf)

  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    delete props.name
    addLayer({
      name: layer,
      units: "mm",
      image: shapes.shapes,
      ...props
    })
  }
}

Comlink.expose(plugin)
