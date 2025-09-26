import { plot } from "./plotter/src"
import { parse } from "@hpcreery/tracespace-parser"
import { registerFunction } from "@src/renderer/data/import-plugins"
import type { DataInterface } from "@src/renderer/data/interface"
import * as z from "zod"

const Parameters = z.object({
  step: z.string(),
  layer: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<void> {
  const params = Parameters.parse(parameters)
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)
  const tree = parse(file)
  const image = plot(tree)
  const units = image.units == "in" ? "inch" : "mm"
  api._update_layer_artwork_from_json(params.project, params.step, params.layer, image.children)
}

// Comlink.expose(plugin)
registerFunction(plugin)

// Comlink.expose(plugin)
