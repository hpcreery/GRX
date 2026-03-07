// import * as Comlink from "comlink"

import { registerPlugin } from "@src/data/importer/register"
import type { DataInterface } from "@src/data/interface"
import * as z from "zod"
import { NCLexer, NCToShapesVisitor, parser } from "./parser/parser"

const Parameters = z.object({
  step: z.string(),
  layer: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<void> {
  const params = Parameters.parse(parameters)
  // console.time("decode")
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)
  // console.timeEnd("decode")
  // console.time("parse")
  const lexingResult = NCLexer.tokenize(file)
  parser.input = lexingResult.tokens
  const result = parser.program()
  // console.timeEnd("parse")
  // console.time("visit")
  const visitor = new NCToShapesVisitor()
  visitor.visit(result)
  // console.timeEnd("visit")
  await api.create_layer(params.project, params.layer)
  await api.update_step_layer_artwork(params.project, params.step, params.layer, visitor.result)
}

// Comlink.expose(plugin)
registerPlugin(plugin)
