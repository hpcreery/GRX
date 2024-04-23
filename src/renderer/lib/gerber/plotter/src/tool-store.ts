// Tool store
// Keeps track of the defined tools, defined macros, and the current tool
import type { GerberNode, SimpleShape, HoleShape, MacroBlock } from '@hpcreery/tracespace-parser'
import { MACRO_SHAPE, TOOL_CHANGE, TOOL_DEFINITION, TOOL_MACRO, BLOCK_APERTURE_OPEN, BLOCK_APERTURE_CLOSE } from '@hpcreery/tracespace-parser'

import * as Symbols from '@src/renderer/symbols'

import { createMacro } from './graphic-plotter/plot-macro'

export const SIMPLE_TOOL = 'simpleTool'

export const MACRO_TOOL = 'macroTool'

import * as Constants from '@hpcreery/tracespace-parser'
import { plotShapes } from '.'
import { PlotOptions } from './options'

export interface SimpleTool {
  type: typeof SIMPLE_TOOL
  shape: SimpleShape
  dcode: string
  hole: HoleShape | undefined
}

export interface MacroTool {
  type: typeof MACRO_TOOL
  name: string
  dcode: string
  macro: MacroBlock[]
  variableValues: number[]
}

export type Tool = Symbols.StandardSymbol | Symbols.MacroSymbol

export interface ToolStore {
  block: string | undefined,
  use: (node: GerberNode, plotOptions: PlotOptions) => Tool
}

export function createToolStore(): ToolStore {
  return Object.create(ToolStorePrototype)
}

interface ToolStoreState {
  _currentToolCode: string | undefined
  _toolsByCode: Partial<Record<string, Tool>>
  _macrosByName: Partial<Record<string, MacroBlock[]>>
  _currentBlockAperture: {code: string, nodes: Constants.ChildNode[]}[]
}

const defaultTool: Tool = new Symbols.NullSymbol({
  id: '274x_NULL',
})

const ToolStorePrototype: ToolStore & ToolStoreState = {
  _currentToolCode: undefined,
  _toolsByCode: {},
  _macrosByName: {},
  _currentBlockAperture: [],
  block: undefined,

  use(node: GerberNode, plotOptions: PlotOptions): Tool {
    if (node.type === TOOL_MACRO) {
      this._macrosByName[node.name] = node.children
    }

    if (node.type === TOOL_DEFINITION) {
      const { code, shape, hole } = node

      if (shape.type == MACRO_SHAPE) {
        this._toolsByCode[code] = createMacro({
          type: MACRO_TOOL,
          name: shape.name,
          dcode: code,
          macro: this._macrosByName[shape.name] ?? [],
          variableValues: shape.variableValues
        })
      } else {
        switch (shape.type) {
          case Constants.CIRCLE:
            this._toolsByCode[code] = new Symbols.RoundSymbol({
              id: `274x_D${code}`,
              outer_dia: shape.diameter,
              inner_dia: hole?.type === Constants.CIRCLE ? hole.diameter : 0
            })
            break
          case Constants.RECTANGLE:
            this._toolsByCode[code] = new Symbols.RectangleSymbol({
              id: `274x_D${code}`,
              width: shape.xSize,
              height: shape.ySize,
              inner_dia: hole?.type === Constants.CIRCLE ? hole.diameter : 0
            })
            break
          case Constants.OBROUND:
            this._toolsByCode[code] = new Symbols.OvalSymbol({
              id: `274x_D${code}`,
              width: shape.xSize,
              height: shape.ySize,
              inner_dia: hole?.type === Constants.CIRCLE ? hole.diameter : 0
            })
            break
          case Constants.POLYGON:
            this._toolsByCode[code] = new Symbols.PolygonSymbol({
              id: `274x_D${code}`,
              outer_dia: shape.diameter,
              corners: shape.vertices,
              inner_dia: hole?.type === Constants.CIRCLE ? hole.diameter : 0,
              line_width: 0,
              angle: (shape.rotation ?? 0) * -1
            })
            break
        }
      }
    }

    if (node.type === TOOL_DEFINITION || node.type === TOOL_CHANGE) {
      this._currentToolCode = node.code
    }

    if (node.type == BLOCK_APERTURE_OPEN) {
      this._currentBlockAperture.unshift({nodes: [], code: node.code})
      this.block = node.code
      return defaultTool
    }
    if (node.type == BLOCK_APERTURE_CLOSE) {
      const current = this._currentBlockAperture.shift()
      if (current) {
        this.block = current.code
        this._toolsByCode[current.code] = new Symbols.MacroSymbol({
          id: `274x_D${current.code}`,
          shapes: plotShapes(current.nodes, plotOptions, this, current.code),
          flatten: false
        })
      }
      this.block = undefined
      if (this._currentBlockAperture.length > 0) {
        this.block = this._currentBlockAperture[0].code
      }
      return defaultTool
    }
    if (this._currentBlockAperture?.length > 0) {
      this._currentBlockAperture[0].nodes.push(node)
    }

    return typeof this._currentToolCode === 'string'
      ? this._toolsByCode[this._currentToolCode] ?? defaultTool
      : defaultTool
  }
}
