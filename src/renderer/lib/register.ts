import { ImportPluginSignature } from '@src/renderer/data/import-plugins';
import * as Comlink from "comlink"


export function retisterPlugin(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}
