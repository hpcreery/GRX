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

import type { LayerRendererProps } from '@src/renderer/layer'
import { registerFunction } from '@src/renderer/plugins'

export async function plugin(file: string, props: Partial<Omit<LayerRendererProps, "regl">>, addLayer: (params: Omit<LayerRendererProps, "regl">) => void): Promise<void> {
  const buffer = await (await fetch(file)).arrayBuffer()
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

registerFunction(plugin)
