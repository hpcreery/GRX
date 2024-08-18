// see https://github.com/vagran/dxf-viewer/tree/master/src/parser
import DxfParser from "dxf-parser"
import * as converter from "./converter"

import * as Comlink from "comlink"
import { AddLayerProps } from "@src/renderer/plugins"

// import file from './testdata/noentities.dxf?url'

export async function plugin(buffer: ArrayBuffer, props: Partial<AddLayerProps>, addLayer: (params: AddLayerProps) => void): Promise<void> {
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
    delete props.name
    addLayer({
      name: layerName,
      units: units,
      color: layer.color,
      image: layer.shapes,
      ...props,
    })
  }
}

Comlink.expose(plugin)
