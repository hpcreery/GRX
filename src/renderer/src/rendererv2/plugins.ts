import { plugin as gdsiiPlugin } from '@lib/gdsii'
import { plugin as gerberPlugin } from '@lib/gerber'
import { RenderEngineBackend } from './engine'
import { LayerRendererProps } from './layer'

export type parser = (file: string, props: Partial<Omit<LayerRendererProps, "regl" | "image">>) => Promise<void>
export type plugin = (engine: RenderEngineBackend) => parser

const plugins: {
  [key: string]: plugin
} = {
  gdsii: gdsiiPlugin,
  rs274x: gerberPlugin
}

export function initializeParsers(engine: RenderEngineBackend): void {
  for (const [key, plugin] of Object.entries(plugins)) {
    engine.parsers[key] = plugin(engine)
  }
}

export default plugins
