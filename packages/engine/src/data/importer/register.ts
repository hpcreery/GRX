import type { ImportPluginSignature } from "@src/data/import-plugins"
import * as Comlink from "comlink"

export function registerPlugin(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}
