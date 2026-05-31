import { parseDXF } from "@grx/importer-dxf"
import { registerPlugin } from "@src/data/importer/register"
import type { DataInterface } from "@src/data/interface"
import * as z from "zod"
import type { ImportResultReport } from ".."

// import file from './testdata/noentities.dxf?url'

const Parameters = z.object({
  step: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<ImportResultReport> {
  const params = Parameters.parse(parameters)
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)

  const layerHierarchy = parseDXF(file)

  for (const [layerName, layer] of Object.entries(layerHierarchy)) {
    const layers = api.read_layers_list(params.project)
    let newLayerName = layerName
    if (layers.includes(layerName)) {
      let i = 1
      while (layers.includes(`${layerName} (${i})`)) {
        i++
      }
      newLayerName = `${layerName} (${i})`
    }
    await api.create_layer(params.project, newLayerName)
    await api.update_step_layer_artwork(params.project, params.step, newLayerName, layer.shapes)
  }
  return {
    errors: [],
  }
}

registerPlugin(plugin)
