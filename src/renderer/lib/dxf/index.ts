// see https://github.com/vagran/dxf-viewer/tree/master/src/parser
import DxfParser from "dxf-parser"
import * as converter from "./converter"
import { registerFunction } from "@src/renderer/data/import-plugins"
import type { DataInterface } from "@src/renderer/data/interface"
import * as z from "zod"
// import file from './testdata/noentities.dxf?url'

const Parameters = z.object({
  step: z.string(),
  project: z.string(),
})

export async function plugin(buffer: ArrayBuffer, parameters: object, api: typeof DataInterface): Promise<void> {
  const params = Parameters.parse(parameters)
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)
  const parser = new DxfParser()
  let dxf
  try {
    dxf = parser.parse(file)
  } catch (err) {
    return console.error(err)
  }

  console.log("dxf", JSON.stringify(dxf))

  const units = converter.getUnits(dxf)
  const layerHierarchy = converter.convert(dxf)

  for (const [layerName, layer] of Object.entries(layerHierarchy)) {
    // delete props.name
    // addLayer({
    //   name: layerName,
    //   units: units,
    //   color: layer.color,
    //   image: layer.shapes,
    //   ...props,
    // })
    const layers = api.read_layers(params.project)
    let newLayerName = layerName
    if (layers.includes(layerName)) {
      let i = 1
      while (layers.includes(`${layerName} (${i})`)) {
        i++
      }
      newLayerName = `${layerName} (${i})`
    }
    api.create_layer(params.project, newLayerName)
    api._update_layer_artwork_from_json(params.project, params.step, newLayerName, layer.shapes)
  }
}

registerFunction(plugin)
