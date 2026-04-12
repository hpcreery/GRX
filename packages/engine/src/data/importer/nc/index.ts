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
  // console.time("tokenize")
  const lexingResult = NCLexer.tokenize(file)
  // console.timeEnd("tokenize")
  if (lexingResult.errors.length > 0) {
    for (const err of lexingResult.errors) {
      console.error(`NC lexing error at line ${err.line}, column ${err.column}, length ${err.length}, offset ${err.offset}: ${err.message}`)
    }
    throw new Error(
      `NC lexing failed with ${lexingResult.errors.length} error(s):\n${lexingResult.errors.map((err) => `- Line ${err.line}, Column ${err.column}: ${err.message}`).join("\n")}`,
    )
  }
  // console.time("parse")
  parser.input = lexingResult.tokens
  const result = parser.program()
  if (parser.errors.length > 0) {
    for (const err of parser.errors) {
      console.error(`NC parse error: ${err.message}`)
    }
    throw new Error(`NC parse failed with ${parser.errors.length} error(s):\n${parser.errors.map((err) => `- ${err.message}`).join("\n")}`)
  }
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
