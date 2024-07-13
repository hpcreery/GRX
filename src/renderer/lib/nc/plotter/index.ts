// build abstract board images from @hpcreery/tracespace-parser ASTs
import type { Tree, ChildNode } from '../parser/tree'

import { getPlotOptions, PlotOptions } from './options'
import { createToolStore, Tool, ToolStore } from './tool-store'
import { createLocationStore, Location, LocationStore } from './location-store'
import { createGraphicPlotter, GraphicPlotter } from './graphic-plotter'
import { createTransformStore, ApertureTransform, TransformStore } from './aperture-transform-store'
import { IMAGE } from './tree'
import type { ImageTree } from './tree'
import * as Shapes from '@src/renderer/shapes'

export * from './tree'
export * from './tool-store'
export * from './graphic-plotter'

export function plot(tree: Tree): ImageTree {
  const plotOptions: PlotOptions = getPlotOptions(tree)
  const toolStore: ToolStore = createToolStore()
  const children = plotShapes(tree.children, plotOptions, toolStore)

  return {
    type: IMAGE,
    units: plotOptions.units,
    children,
  }
}

export function plotShapes(nodes: ChildNode[], plotOptions: PlotOptions, toolStore: ToolStore, block?: string): Shapes.Shape[] {
  const locationStore: LocationStore = createLocationStore()
  const transformStore: TransformStore = createTransformStore()
  const graphicPlotter: GraphicPlotter = createGraphicPlotter()
  const children: Shapes.Shape[] = []

  for (const node of nodes) {
    const location: Location = locationStore.use(node, plotOptions)
    const apertureTransform: ApertureTransform = transformStore.use(node)
    const tool: Tool = toolStore.use(node, plotOptions)
    if (toolStore.block && toolStore.block != block) continue
    const graphics: Shapes.Shape[] = graphicPlotter.plot(node, tool, location, apertureTransform)

    children.push(...graphics)
  }
  return children
}
