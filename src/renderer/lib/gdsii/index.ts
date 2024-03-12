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

// import type { RenderEngine } from '@src/rendererv2'
import { RenderEngineBackend } from '@src/rendererv2/engine'
import { LayerRendererProps } from '@src/rendererv2/layer'

import type { parser } from '@src/rendererv2/plugins'

// export async function addGDSII(engine: RenderEngine): Promise<void> {
//   const buffer = await (await fetch(gdsiiFile)).arrayBuffer()
//   // console.log(utils.buf2hex(buffer))
//   const tokens = LEXER.record_reader(buffer)
//   const bnf = PARSER.parse(tokens)
//   const layerHierarchy = CONVERTER.convert(bnf)

//   for (const [layer, shapes] of Object.entries(layerHierarchy)) {
//     engine.addLayer({
//       name: layer,
//       image: shapes.shapes
//     })
//   }
// }

export function plugin(engine: RenderEngineBackend): parser {
  const parseGDSII = async (file: string, props: Partial<Omit<LayerRendererProps, "regl">>): Promise<void> => {
    const buffer = await (await fetch(file)).arrayBuffer()
    const tokens = LEXER.record_reader(buffer)
    const bnf = PARSER.parse(tokens)
    const layerHierarchy = CONVERTER.convert(bnf)

    for (const [layer, shapes] of Object.entries(layerHierarchy)) {
      delete props.name
      engine.addLayer({
        name: layer,
        image: shapes.shapes,
        ...props
      })
    }
  }
  return parseGDSII
}
