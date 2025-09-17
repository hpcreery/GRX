import gdsiiPluginWorker from "@lib/gdsii?worker"
import gerberPluginWorker from "@lib/gerber?worker"
import dxfPluginWorker from "@lib/dxf?worker"
import ncPluginWorker from "@lib/nc?worker"
import * as Comlink from "comlink"
import { DataInterface } from './interface'



export type ImportPlugin = (
  buffer: ArrayBuffer,
  props: object,
  api: typeof DataInterface,
) => Promise<void>

export interface ImportPlugins {
  [key: string]: {
    plugin: new () => Worker
    matchFile: (ext: string) => boolean
  }
}
export const importPlugins: ImportPlugins = {
  'RS-274X': {
    plugin: gerberPluginWorker,
    matchFile: (ext) => ["gbr", "geb", "gerber"].includes(ext),
  },
  'GDSII': {
    plugin: gdsiiPluginWorker,
    matchFile: (ext) => ["gds", "gdsii", "gds2"].includes(ext),
  },
  'DXF': {
    plugin: dxfPluginWorker,
    matchFile: (ext) => ["dxf"].includes(ext),
  },
  'NC': {
    plugin: ncPluginWorker,
    matchFile: (ext) => ["nc", "drl", "dr", "rt", "xnc"].includes(ext),
  },
}

export const defaultImportFormat = "RS-274X"
export const importPluginList = Object.keys(importPlugins)

export function registerFunction(plugin: ImportPlugin): void {
  Comlink.expose(plugin)
}

export default importPlugins
