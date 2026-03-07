import { parse } from "@hpcreery/tracespace-parser"
import { registerPlugin } from "@src/data/importer/register"
import type { DataInterface } from "@src/data/interface"
import * as z from "zod"
import { plot } from "./plotter/src"

// import * as Comlink from "comlink"

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
  // const units = image.units

  await api.create_layer(params.project, params.layer)
  await api.update_step_layer_artwork(params.project, params.step, params.layer, image.children)
}

// Comlink.expose(plugin)
registerPlugin(plugin)
