import { plot } from "./plotter/src"
import { parse } from "@hpcreery/tracespace-parser"
import { ImportPluginSignature } from '@src/renderer/data/import-plugins'
import { AddLayerProps } from "@src/renderer/engine/plugins"
import * as Comlink from "comlink"
import { DataInterface } from "@src/renderer/data/interface";


// export async function plugin(buffer: ArrayBuffer, props: Partial<AddLayerProps>, addLayer: (params: AddLayerProps) => void): Promise<void> {
//   const decoder = new TextDecoder("utf-8")
//   const file = decoder.decode(buffer)
//   const tree = parse(file)
//   const image = plot(tree)
//   addLayer({
//     name: props.name || "Gerber",
//     image: image.children,
//     units: image.units == "in" ? "inch" : "mm",
//     ...props,
//   })
// }


// If you meant 'DataInterface', fix the typo and import or define it:

export interface Parameters {
  step: string;
  layer: string;
  project: string;
}

export async function plugin(buffer: ArrayBuffer, parameters: Parameters, api: typeof DataInterface): Promise<void> {
  const decoder = new TextDecoder("utf-8")
  const file = decoder.decode(buffer)
  const tree = parse(file)
  const image = plot(tree)
  // addLayer({
  //   name: props.name || "Gerber",
  //   image: image.children,
  //   units: image.units == "in" ? "inch" : "mm",
  //   ...props,
  // })
  // console.log('image', JSON.stringify(image.children));
  api._update_artwork_json(parameters.project, parameters.step, parameters.layer, image.children)
}

Comlink.expose(plugin)

export function registerFunction(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}
