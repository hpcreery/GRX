// import gerberFile from './testdata/gerbers/layers/Gerber_TopLayer.gbr?raw'
import gerberFile from './testdata/boards/2307019_smt.gbr?raw'
import cmp from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.cmp?raw'
import drd from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.drd?raw'
import gko from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.gko?raw'
import plc from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.plc?raw'
import pls from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.pls?raw'
import sol from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sol?raw'
import stc from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.stc?raw'
import sts from './testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sts?raw'

import type { RenderEngine } from '../../src/rendererv2'
import { plot } from './plotter/src'
import { parse } from '@hpcreery/tracespace-parser'
import { LayerRendererProps } from '../../src/rendererv2/layer'

export async function addGerber(engine: RenderEngine): Promise<void> {

  const gerbers = [cmp, drd, gko, plc, pls, sol, stc, sts]
  gerbers.forEach((file, i) => {
    const tree = parse(file)
    const image = plot(tree)
    engine.addLayer({
      name: `Gerber ${i}`,
      image: image.children
    })
  })
  const tree = parse(gerberFile)
  const image = plot(tree)
  // console.log(image.children)
  engine.addLayer({
    name: 'Gerber',
    image: image.children
  })


  engine.render(true)
}

export async function plugin(engine: RenderEngine): Promise<(file: string, props: Partial<Omit<LayerRendererProps, "regl">>) => Promise<void>> {
  const parseGerber = async (file: string, props: Partial<Omit<LayerRendererProps, "regl">>): Promise<void> => {
    const tree = parse(file)
    const image = plot(tree)
    engine.addLayer({
      name: props.name || 'Gerber',
      image: image.children,
      ...props
    })
  }
  return parseGerber
}
