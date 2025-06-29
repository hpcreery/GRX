import gdsiiPluginWorker from "@lib/gdsii?worker"
import gerberPluginWorker from "@lib/gerber?worker"
import dxfPluginWorker from "@lib/dxf?worker"
import ncPluginWorker from "@lib/nc?worker"
import { LayerProps } from "./step/layer/layer"
import { ShapeProps } from "./step/layer/shape-renderer"
import * as Comlink from "comlink"

export interface AddLayerProps extends ShapeProps, LayerProps {}

export type Plugin = (
  buffer: ArrayBuffer,
  props: Partial<AddLayerProps>,
  addLayer: (params: AddLayerProps) => void,
  addMessage?: (title: string, message: string) => Promise<void>,
) => Promise<void>

export interface PluginsDefinition {
  [key: string]: {
    plugin: new () => Worker
    matchFile: (ext: string) => boolean
  }
}
export const plugins: PluginsDefinition = {
  rs274x: {
    plugin: gerberPluginWorker,
    matchFile: (ext) => ["gbr", "geb", "gerber"].includes(ext),
  },
  gdsii: {
    plugin: gdsiiPluginWorker,
    matchFile: (ext) => ["gds", "gdsii", "gds2"].includes(ext),
  },
  dxf: {
    plugin: dxfPluginWorker,
    matchFile: (ext) => ["dxf"].includes(ext),
  },
  nc: {
    plugin: ncPluginWorker,
    matchFile: (ext) => ["nc", "drl", "dr", "rt", "xnc"].includes(ext),
  },
}

export const defaultFormat = "rs274x"
export const pluginList = Object.keys(plugins)

export function registerFunction(plugin: Plugin): void {
  Comlink.expose(plugin)
}

export default plugins
