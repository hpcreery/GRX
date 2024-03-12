// Tool store
// Keeps track of the defined tools, defined macros, and the current tool
import type { GerberNode, SimpleShape, HoleShape, MacroBlock } from '@hpcreery/tracespace-parser'
import { MACRO_SHAPE, TOOL_CHANGE, TOOL_DEFINITION, TOOL_MACRO } from '@hpcreery/tracespace-parser'

// import * as Shapes from '@src/rendererv2/shapes'
import * as Symbols from '@src/rendererv2/symbols'

import { createMacro } from './graphic-plotter/plot-macro'

export const SIMPLE_TOOL = 'simpleTool'

export const MACRO_TOOL = 'macroTool'

import * as Constants from '@hpcreery/tracespace-parser'

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
  _toolsByCode: Partial<Record<string, Tool>>
  _macrosByName: Partial<Record<string, MacroBlock[]>>
  use: (node: GerberNode) => Tool | undefined
}

export function createToolStore(): ToolStore {
  return Object.create(ToolStorePrototype)
}

interface ToolStoreState {
  _currentToolCode: string | undefined
  _toolsByCode: Partial<Record<string, Tool>>
  _macrosByName: Partial<Record<string, MacroBlock[]>>
}

const ToolStorePrototype: ToolStore & ToolStoreState = {
  _currentToolCode: undefined,
  _toolsByCode: {},
  _macrosByName: {},

  use(node: GerberNode): Tool | undefined {
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
              angle: shape.rotation ?? 0
            })
            break
        }
      }
    }

    if (node.type === TOOL_DEFINITION || node.type === TOOL_CHANGE) {
      this._currentToolCode = node.code
    }

    return typeof this._currentToolCode === 'string'
      ? this._toolsByCode[this._currentToolCode]
      : undefined
  }
}
