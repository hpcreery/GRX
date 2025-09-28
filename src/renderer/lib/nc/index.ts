// import * as Comlink from "comlink"

import { parser, NCLexer, NCToShapesVisitor } from "./parser/parser"
import type { DataInterface } from "@src/renderer/data/interface";
import { registerFunction } from "@src/renderer/data/import-plugins"
import * as z from "zod"

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
  // const units = visitor.state.units
  api._update_layer_artwork_from_json(params.project, params.step, params.layer, visitor.result)
}

// Comlink.expose(plugin)
registerFunction(plugin)
