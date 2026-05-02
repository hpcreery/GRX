import type { ImportPluginSignature } from "@src/data/importer"
import * as Comlink from "comlink"

export function registerPlugin(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}
