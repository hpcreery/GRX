// import gdsiiFile from './testdata/example.gds2?url'
// import gdsiiFile from './testdata/inv.gds2?url'
// import gdsiiFile from './testdata/example0.gds?url'
// import gdsiiFile from './testdata/example1.gds?url'
// import gdsiiFile from './testdata/example2.gds?url' // broken boundaries
// import gdsiiFile from './testdata/GdsIITests_test.gds?url' // broken boundaries, paths with different ends
// import gdsiiFile from './testdata/GdsIITests_circles.gds?url'

import { recordReader } from "@grx/parser-gdsii/lexer"
import { parse } from "@grx/parser-gdsii/parser"
import { registerPlugin } from "@src/data/importer/register"
// import messages from "./messages"
import type { DataInterface } from "@src/data/interface"
import * as z from "zod"
import { convert } from "./converter"

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
    if (!(await api.read_layers_list(params.project)).includes(layer)) await api.create_layer(params.project, layer)
    await api.update_step_layer_artwork(params.project, params.step, layer, shapes.shapes)
  }
}

registerPlugin(plugin)
