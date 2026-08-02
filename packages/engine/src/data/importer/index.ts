import type { DataInterface } from "../interface"
// @deno-types="npm:vite/client"
import dxfPluginWorker from "./dxf?worker&inline"
// @deno-types="npm:vite/client"
import gdsiiPluginWorker from "./gdsii?worker&inline"
// @deno-types="npm:vite/client"
import gerberPluginWorker from "./gerber?worker&inline"
// @deno-types="npm:vite/client"
import gerberLegacyPluginWorker from "./gerber-legacy?worker&inline"
// @deno-types="npm:vite/client"
import ncPluginWorker from "./nc?worker&inline"

// class dxfPluginWorker extends Worker {
//   constructor() {
//     super(new URL("./dxf/index.ts", import.meta.url), { type: "module" })
//   }
// }

// class gdsiiPluginWorker extends Worker {
//   constructor() {
//     super(new URL("./gdsii/index.ts", import.meta.url), { type: "module" })
//   }
// }

// class gerberPluginWorker extends Worker {
//   constructor() {
//     super(new URL("./gerber/index.ts", import.meta.url), { type: "module" })
//   }
// }

// class gerberLegacyPluginWorker extends Worker {
//   constructor() {
//     super(new URL("./gerber-legacy/index.ts", import.meta.url), { type: "module" })
//   }
// }

// class ncPluginWorker extends Worker {
//   constructor() {
//     super(new URL("./nc/index.ts", import.meta.url), { type: "module" })
//   }
// }

export interface ImportResultReport {
  errors: string[]
}

export type ImportPluginSignature = (buffer: ArrayBuffer, parameters: object, api: typeof DataInterface) => Promise<ImportResultReport>

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
  "GDSII": {
    plugin: gdsiiPluginWorker,
    matchFile: (ext: string) => ["gds", "gdsii", "gds2"].includes(ext),
  },
  "DXF": {
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
