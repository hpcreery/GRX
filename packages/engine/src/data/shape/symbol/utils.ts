import { type BoundingBox, SymbolTypeIdentifier, type Units } from "@src/types"
import { baseUnitsConversionFactor } from "@src/utils"
import { vec2 } from "gl-matrix"
import { convertShapeUnits, getBoundingBoxOfShape } from "../utils"
import type { MacroSymbol, StandardSymbol, Symbols } from "./symbol"

export function getBoundingBoxOfSymbol(symbol: StandardSymbol | MacroSymbol): BoundingBox {
  const min: vec2 = vec2.fromValues(0, 0)
  const max: vec2 = vec2.fromValues(0, 0)
  if (symbol.type === SymbolTypeIdentifier.SYMBOL_DEFINITION) {
    const { width, height, outer_dia, line_length } = symbol
    const max_width = Math.max(width, outer_dia, line_length)
    const max_height = Math.max(height, outer_dia, line_length)
    vec2.set(min, -max_width / 2, -max_height / 2)
    vec2.set(max, max_width / 2, max_height / 2)
  } else {
    for (const shape of symbol.shapes) {
      const shapeBoundingBox = getBoundingBoxOfShape(shape)
      const shapeMin = shapeBoundingBox.min
      const shapeMax = shapeBoundingBox.max
      vec2.min(min, min, shapeMin)
      vec2.max(max, max, shapeMax)
    }
  }
  return { min, max }
}

/**
 * Convert the units of a symbol to the specified units.
 * This modifies the symbol in place and also returns it.
 * @param symbol symbol to convert
 * @param units units to convert to
 * @returns converted symbol
 */
export function convertSymbolUnits(symbol: Symbols, units: Units): Symbols {
  if (symbol.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
    for (const shape of symbol.shapes) {
      convertShapeUnits(shape, units)
    }
  } else {
    const factor = baseUnitsConversionFactor(symbol.units) / baseUnitsConversionFactor(units)
    if (factor === 1) return symbol
    symbol.width *= factor
    symbol.height *= factor
    symbol.corner_radius *= factor
    // "corners",
    symbol.outer_dia *= factor
    symbol.inner_dia *= factor
    symbol.line_width *= factor
    symbol.line_length *= factor
    // "angle",
    symbol.gap *= factor
    // "num_spokes",
    // "round",
    symbol.cut_size *= factor
    symbol.ring_width *= factor
    symbol.ring_gap *= factor
    // "num_rings",
    symbol.units = units
  }
  return symbol
}
