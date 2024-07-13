// Tool store
// Keeps track of the defined tools, defined macros, and the current tool
import type { ChildNode } from '../parser/tree'
import type { HoleShape, ToolShape } from '../parser/types'
import { TOOL_CHANGE, TOOL_DEFINITION } from '../parser/tree'

import * as Symbols from '@src/renderer/symbols'

export const SIMPLE_TOOL = 'simpleTool'

export const MACRO_TOOL = 'macroTool'

import * as Constants from '@hpcreery/tracespace-parser'
import { PlotOptions } from './options'

export interface SimpleTool {
  type: typeof SIMPLE_TOOL
  shape: ToolShape
  dcode: string
  hole: HoleShape | undefined
}

export type Tool = Symbols.StandardSymbol

export interface ToolStore {
  block: string | undefined,
  use: (node: ChildNode, plotOptions: PlotOptions) => Tool
}

export function createToolStore(): ToolStore {
  return Object.create(ToolStorePrototype)
}

interface ToolStoreState {
  _currentToolCode: string | undefined
  _toolsByCode: Partial<Record<string, Tool>>
  _currentBlockAperture: { code: string, nodes: Constants.ChildNode[] }[]
}

const defaultTool: Tool = new Symbols.NullSymbol({
  id: 'T00',
})

const ToolStorePrototype: ToolStore & ToolStoreState = {
  _currentToolCode: undefined,
  _toolsByCode: {},
  _currentBlockAperture: [],
  block: undefined,

  use(node: ChildNode, _plotOptions: PlotOptions): Tool {

    if (node.type === TOOL_DEFINITION) {
      const { code, shape } = node


      switch (shape.type) {
        case Constants.CIRCLE:
          this._toolsByCode[code] = new Symbols.RoundSymbol({
            id: `T${code}`,
            outer_dia: shape.diameter,
            inner_dia: 0
          })
          break

      }
    }

    if (node.type === TOOL_DEFINITION || node.type === TOOL_CHANGE) {
      this._currentToolCode = node.code
    }

    if (this._currentBlockAperture?.length > 0) {
      this._currentBlockAperture[0].nodes.push(node)
    }

    return typeof this._currentToolCode === 'string'
      ? this._toolsByCode[this._currentToolCode] ?? defaultTool
      : defaultTool
  }
}
