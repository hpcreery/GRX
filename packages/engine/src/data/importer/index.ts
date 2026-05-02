import dxfPluginWorker from "./dxf?worker&inline"
import gdsiiPluginWorker from "./gdsii?worker&inline"
import gerberPluginWorker from "./gerber?worker&inline"
import gerberLegacyPluginWorker from "./gerber-legacy?worker&inline"
import ncPluginWorker from "./nc?worker&inline"
import type { DataInterface } from "../interface"

export type ImportPluginSignature = (buffer: ArrayBuffer, parameters: object, api: typeof DataInterface) => Promise<void>

export const importFormats = {
  "RS-274X": {
    plugin: gerberPluginWorker,
    alt: "Gerber X3",
    matchFile: (ext: string) => ["gbr", "geb", "gerber", "gbx"].includes(ext),
  },
  "RS-274X (Legacy)": {
    plugin: gerberLegacyPluginWorker,
    matchFile: () => false,
  },
  GDSII: {
    plugin: gdsiiPluginWorker,
    matchFile: (ext: string) => ["gds", "gdsii", "gds2"].includes(ext),
  },
  DXF: {
    plugin: dxfPluginWorker,
    matchFile: (ext: string) => ["dxf"].includes(ext),
  },
  "NC": {
    plugin: ncPluginWorker,
    alt: "XNC, IPC-NC-349, Excellon",
    matchFile: (ext: string) => ["nc", "drl", "dr", "rt", "xnc"].includes(ext),
  },
} as const

export type importFormatName = keyof typeof importFormats
export const importFormatList = Object.keys(importFormats) as importFormatName[]
export const defaultImportFormat: importFormatName = "RS-274X"

export default importFormats
