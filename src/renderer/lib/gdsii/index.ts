// import gdsiiFile from './testdata/example.gds2?url'
import gdsiiFile from './testdata/inv.gds2?url'

import * as LEXER from './lexer'
import * as PARSER from './parser'
import * as CONVERTER from './converter'
// import * as utils from './utils'

import { RenderEngine } from '../../src/rendererv2/engine'

export async function addGDSII(engine: RenderEngine): Promise<void> {
  const buffer = await (await fetch(gdsiiFile)).arrayBuffer()
  // console.log(utils.buf2hex(buffer))
  const tokens = LEXER.record_reader(buffer)
  const bnf = PARSER.parse(tokens)
  const layerHierarchy = CONVERTER.convert(bnf)

  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    console.log('layer', layer)
    engine.addLayer({
      name: layer,
      image: shapes.shapes
    })
  }
}
