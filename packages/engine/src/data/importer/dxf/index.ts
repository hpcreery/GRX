// see https://github.com/vagran/dxf-viewer/tree/master/src/parser

import { registerPlugin } from "@src/data/importer/register"
import type { DataInterface } from "@src/data/interface"
import DxfParser from "dxf-parser"
import * as z from "zod"
import type { ImportResultReport } from ".."
import * as converter from "./converter"

// import file from './testdata/noentities.dxf?url'

const Parameters = z.object({
  step: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<ImportResultReport> {
  const params = Parameters.parse(parameters)
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)
  const parser = new DxfParser()
  let dxf
  try {
    dxf = parser.parse(file)
  } catch (err) {
    // return console.error(err)
    console.error("Failed to parse DXF file:", err instanceof Error ? err.message : err)
    // return {
    //   errors: [err instanceof Error ? err.message : String(err)],
    // }
    throw new Error(`Failed to parse DXF file: ${err instanceof Error ? err.message : String(err)}`)
  }

  // console.log("dxf", JSON.stringify(dxf))
  if (!dxf) {
    console.error("Failed to parse DXF file")
    throw new Error("Failed to parse DXF file")
  }

  const layerHierarchy = converter.convert(dxf)

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
