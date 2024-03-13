// import gerberFile from './testdata/gerbers/layers/Gerber_TopLayer.gbr?raw'
// import gerberFile from './testdata/boards/2307019_smt.gbr?raw'
// import cmp from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.cmp?raw'
// import drd from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.drd?raw'
// import gko from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.gko?raw'
// import plc from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.plc?raw'
// import pls from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.pls?raw'
// import sol from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sol?raw'
// import stc from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.stc?raw'
// import sts from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sts?raw'

// import type { RenderEngine } from '@src/rendererv2'
// import { RenderEngineBackend } from '@src/rendererv2/engine'
import { plot } from './plotter/src'
import { parse } from '@hpcreery/tracespace-parser'
import type { LayerRendererProps } from '@src/rendererv2/layer'
import { registerFunction } from '@src/rendererv2/plugins'


// export function plugin(engine: RenderEngineBackend): parser {
export async function plugin(file: string, props: Partial<Omit<LayerRendererProps, "regl">>, addLayer: (params: Omit<LayerRendererProps, "regl">) => void): Promise<void> {
  const tree = parse(file)
  const image = plot(tree)
  addLayer({
    name: props.name || 'Gerber',
    image: image.children,
    ...props
  })
}

registerFunction(plugin)
