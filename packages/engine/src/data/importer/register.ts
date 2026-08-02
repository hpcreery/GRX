import type { ImportPluginSignature } from "@grx/engine/data/importer"
import * as Comlink from "comlink"

export function registerPlugin(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}
