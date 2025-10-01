// import gdsiiFile from './testdata/example.gds2?url'
// import gdsiiFile from './testdata/inv.gds2?url'
// import gdsiiFile from './testdata/example0.gds?url'
// import gdsiiFile from './testdata/example1.gds?url'
// import gdsiiFile from './testdata/example2.gds?url' // broken boundaries
// import gdsiiFile from './testdata/GdsIITests_test.gds?url' // broken boundaries, paths with different ends
// import gdsiiFile from './testdata/GdsIITests_circles.gds?url'

import { recordReader } from "./lexer"
import { parse } from "./parser"
import { convert } from "./converter"
import messages from "./messages"
import type { DataInterface } from "@src/renderer/data/interface"
import * as z from "zod"
import { registerFunction } from "@src/renderer/data/import-plugins"

const Parameters = z.object({
  step: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<void> {
  const params = Parameters.parse(parameters)
  // messages.setSender(addMessage, "GDSII")
  // messages.clear()
  const tokens = recordReader(buffer)
  const bnf = parse(tokens)
  const layerHierarchy = convert(bnf)

  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    if (!(await api.read_layers(params.project)).includes(layer)) api.create_layer(params.project, layer)
    api._update_layer_artwork_from_json(params.project, params.step, layer, shapes.shapes)
  }
}

registerFunction(plugin)
