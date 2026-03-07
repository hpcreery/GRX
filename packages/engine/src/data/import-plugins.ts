import dxfPluginWorker from "./importer/dxf?worker&inline"
import gdsiiPluginWorker from "./importer/gdsii?worker&inline"
import gerberPluginWorker from "./importer/gerber?worker&inline"
import ncPluginWorker from "./importer/nc?worker&inline"
import type { DataInterface } from "./interface"

export type ImportPluginSignature = (buffer: ArrayBuffer, parameters: object, api: typeof DataInterface) => Promise<void>

export const importFormats = {
  "RS-274X": {
    plugin: gerberPluginWorker,
    matchFile: (ext: string) => ["gbr", "geb", "gerber"].includes(ext),
  },
  GDSII: {
    plugin: gdsiiPluginWorker,
    matchFile: (ext: string) => ["gds", "gdsii", "gds2"].includes(ext),
  },
  DXF: {
    plugin: dxfPluginWorker,
    matchFile: (ext: string) => ["dxf"].includes(ext),
  },
  NC: {
    plugin: ncPluginWorker,
    matchFile: (ext: string) => ["nc", "drl", "dr", "rt", "xnc"].includes(ext),
  },
} as const

export type importFormatName = keyof typeof importFormats
export const importFormatList = Object.keys(importFormats) as importFormatName[]
export const defaultImportFormat: importFormatName = "RS-274X"

export default importFormats
