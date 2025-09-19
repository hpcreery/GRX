import gdsiiPluginWorker from "@lib/gdsii?worker"
import gerberPluginWorker from "@lib/gerber?worker"
import dxfPluginWorker from "@lib/dxf?worker"
import ncPluginWorker from "@lib/nc?worker"
import * as Comlink from "comlink"
import { DataInterface } from "./interface"
import * as z from "zod";

export type ImportPluginSignature = (buffer: ArrayBuffer, parameters: object, api: typeof DataInterface) => Promise<void>

export const importFormats = {
  "RS-274X": {
    plugin: gerberPluginWorker,
    matchFile: (ext: string) => ["gbr", "geb", "gerber"].includes(ext),
    parameters: z.object({
      step: z.string(),
      layer: z.string(),
      project: z.string().optional()
    }),
  },
  GDSII: {
    plugin: gdsiiPluginWorker,
    matchFile: (ext: string) => ["gds", "gdsii", "gds2"].includes(ext),
    parameters: z.object({}),
  },
  DXF: {
    plugin: dxfPluginWorker,
    matchFile: (ext: string) => ["dxf"].includes(ext),
    parameters: z.object({}),
  },
  NC: {
    plugin: ncPluginWorker,
    matchFile: (ext: string) => ["nc", "drl", "dr", "rt", "xnc"].includes(ext),
    parameters: z.object({}),
  },
} as const

export type importFormatName = keyof typeof importFormats
export const importFormatList = Object.keys(importFormats) as importFormatName[]
export const defaultImportFormat = importFormatList["RS-274X"]

export type ParametersType<F extends importFormatName> = z.infer<(typeof importFormats)[F]['parameters']>

export function registerFunction(plugin: ImportPluginSignature): void {
  Comlink.expose(plugin)
}

export default importFormats
