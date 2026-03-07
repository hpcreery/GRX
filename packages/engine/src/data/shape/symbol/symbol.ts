import { type ISymbolRecord, SymbolTypeIdentifier, toMap, type Units } from "@src/types"
import { malloc } from "@src/utils"
import type { Shape } from "../shape"

export const STANDARD_SYMBOLS = [
  "Null",
  "Round",
  "Square",
  "Rectangle",
  "Rounded_Rectangle",
  "Chamfered_Rectangle",
  "Oval",
  "Diamond",
  "Octagon",
  "Round_Donut",
  "Square_Donut",
  "SquareRound_Donut",
  "Rounded_Square_Donut",
  "Rectangle_Donut",
  "Rounded_Rectangle_Donut",
  "Oval_Donut",
  "Horizontal_Hexagon",
  "Vertical_Hexagon",
  "Butterfly",
  "Square_Butterfly",
  "Triangle",
  "Half_Oval",
  "Circle_Thermal",
  "Rectangle_Thermal",
  "Rectangle_Thermal_Open_Corners",
  "Square_Circle_Thermal",
  "Constrained_Rectangle_Thermal",
  "Ellipse",
  "MoireGerber",
  "MoireODB",
  "Hole",
  "Polygon",

  // ! Implement these symbols

  // https://odbplusplus.com/wp-content/uploads/sites/2/2021/02/odb_spec_user.pdf
  // "Home_Plate",
  // "Inverted_Home_Plate",
  // "Flat_Home_Plate",
  // "Radiused_Inverted_Home_Plate",
  // "Radiused_Home_Plate",
  // "Cross",
  // "Dogbone",
  // "DPack",

  // https://www.artwork.com/ipc2581/IPC-2581C.pdf
  // "Hexagon_Thermal"
  // "Octagon_Thermal"
] as const
export type STANDARD_SYMBOLS = typeof STANDARD_SYMBOLS

export const SYMBOL_PARAMETERS = [
  "symbol",
  "width",
  "height",
  "corner_radius",
  "corners",
  "outer_dia",
  "inner_dia",
  "line_width",
  "line_length",
  "angle",
  "gap",
  "num_spokes",
  "round",
  "cut_size",
  "ring_width",
  "ring_gap",
  "num_rings",
] as const
export type SYMBOL_PARAMETERS = typeof SYMBOL_PARAMETERS

export const STANDARD_SYMBOLS_MAP = toMap(STANDARD_SYMBOLS)
export const SYMBOL_PARAMETERS_MAP = toMap(SYMBOL_PARAMETERS)

export type TStandardSymbol = typeof SYMBOL_PARAMETERS_MAP

// type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export class StandardSymbol implements TStandardSymbol, ISymbolRecord {
  public readonly type = SymbolTypeIdentifier.SYMBOL_DEFINITION
  public units: Units = "mm"
  /** symbol id. typically the symbol name and unique identifier */
  public id = ""
  public symbol = STANDARD_SYMBOLS_MAP.Null
  public sym_num = malloc<number>(0)
  /** Width of symbol */
  public width = 0
  /** Height of symbol */
  public height = 0
  /** Corner radius for rounded rectangles */
  public corner_radius = 0
  /** Corners is a value from 0 to 15. 1,2,4,8 indicate the chamfered corner starting from Top Right going CCW (VERIFY). The sum of the values is between 0 and 15 base 2 added up to represent any possibility of the chamfered corners */
  public corners = 0
  /** Outer diameter of symbol */
  public outer_dia = 0
  /** Inner diameter of symbol */
  public inner_dia = 0
  /** Width of line for donuts and thermals */
  public line_width = 0
  /** Length of line for Moire patterns */
  public line_length = 0
  /** Angle in Degrees */
  public angle = 0
  /** Gap between spokes for thermals */
  public gap = 0
  /** Number of spokes for thermals */
  public num_spokes = 0
  /** Roundness for Circle Thermals. 0 is square, 1 is round */
  public round = 0
  /** Cut size for Butterfly wings */
  public cut_size = 0
  /** Ring width for Moire patterns */
  public ring_width = 0
  /** Ring gap for Moire patterns */
  public ring_gap = 0
  /** Number of rings for Moire patterns */
  public num_rings = 0

  constructor(symbol: Partial<TStandardSymbol & { id: string; units: Units }>) {
    Object.assign(this, symbol)
  }
}

export class NullSymbol extends StandardSymbol {
  constructor(symbol: Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Null, outer_dia: 0, ...symbol })
  }
}

export class RoundSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Round, ...symbol })
  }
}

export class HoleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Hole, ...symbol })
  }
}

export class SquareSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square, ...symbol })
  }
}

export class RectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle, ...symbol })
  }
}

export class RoundedRectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius" | "corners" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangle, ...symbol })
  }
}

export class ChamferedRectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius" | "corners" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Chamfered_Rectangle, ...symbol })
  }
}

export class OvalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oval, ...symbol })
  }
}

export class DiamondSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Diamond, ...symbol })
  }
}

export class OctagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Octagon, ...symbol })
  }
}

export class RoundDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Round_Donut, ...symbol })
  }
}

export class SquareDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Donut, ...symbol })
  }
}

export class SquareRoundDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.SquareRound_Donut, ...symbol })
  }
}

export class RoundedSquareDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "corner_radius" | "corners"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Donut, ...symbol })
  }
}

export class RectangleDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "line_width"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle_Donut, ...symbol })
  }
}

export class RoundedRectangleDonutSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius" | "corners" | "line_width" | "inner_dia"> &
      Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangle_Donut, ...symbol })
  }
}

export class OvalDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "line_width"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oval_Donut, ...symbol })
  }
}

export class HorizontalHexagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Horizontal_Hexagon, ...symbol })
  }
}

export class VerticalHexagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Vertical_Hexagon, ...symbol })
  }
}

export class ButterflySymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Butterfly, ...symbol })
  }
}

export class SquareButterflySymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Butterfly, ...symbol })
  }
}

export class TriangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Triangle, ...symbol })
  }
}

export class HalfOvalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Half_Oval, ...symbol })
  }
}

export class CircleThermalSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "num_spokes" | "angle" | "gap" | "round"> & Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Circle_Thermal, ...symbol })
  }
}

export class RectangleThermalSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "width" | "height" | "line_width" | "corner_radius" | "corners" | "num_spokes" | "angle" | "gap" | "round"> &
      Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle_Thermal, ...symbol })
  }
}

export class RectangleThermalOpenCornersSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "width" | "height" | "line_width" | "num_spokes" | "angle" | "gap"> & Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle_Thermal_Open_Corners, ...symbol })
  }
}

export class SquareCircleThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "num_spokes" | "angle" | "gap"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Circle_Thermal, ...symbol })
  }
}

export class ConstrainedRectangleThermalSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "width" | "height" | "line_width" | "corner_radius" | "corners" | "num_spokes" | "angle" | "gap" | "round"> &
      Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Constrained_Rectangle_Thermal, ...symbol })
  }
}

export class EllipseSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "width" | "height"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Ellipse, ...symbol })
  }
}

export class MoireGerberSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "outer_dia" | "ring_width" | "ring_gap" | "num_rings" | "line_width" | "line_length" | "angle"> &
      Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.MoireGerber, ...symbol })
  }
}

export class MoireODBSymbol extends StandardSymbol {
  constructor(
    symbol: Pick<TStandardSymbol, "ring_width" | "ring_gap" | "num_rings" | "line_width" | "line_length" | "angle"> &
      Partial<{ id: string; units: Units }>,
  ) {
    super({ symbol: STANDARD_SYMBOLS_MAP.MoireODB, outer_dia: symbol.line_length, ...symbol })
  }
}

export class PolygonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "corners" | "line_width" | "inner_dia" | "angle"> & Partial<{ id: string; units: Units }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Polygon, ...symbol })
  }
}

// THESE ARE SUDO-SYMBOLS THAT ARE MADE UP OF OTHER PRIMARY SYMBOLS
export class RoundedRoundThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "angle" | "num_spokes" | "gap"> & Partial<{ id: string; units: Units }>) {
    super({
      symbol: STANDARD_SYMBOLS_MAP.Circle_Thermal,
      round: 1,
      ...symbol,
    })
  }
}

export class SquaredRoundThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "angle" | "num_spokes" | "gap"> & Partial<{ id: string; units: Units }>) {
    super({
      symbol: STANDARD_SYMBOLS_MAP.Circle_Thermal,
      round: 0,
      ...symbol,
    })
  }
}

export class SquareThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "angle" | "num_spokes" | "gap"> & Partial<{ id: string; units: Units }>) {
    super({
      symbol: STANDARD_SYMBOLS_MAP.Rectangle_Thermal,
      width: symbol.outer_dia,
      height: symbol.outer_dia,
      line_width: (symbol.outer_dia - symbol.inner_dia) / 2,
      angle: symbol.angle,
      num_spokes: symbol.num_spokes,
      gap: symbol.gap,
      round: 0,
    })
  }
}

export class OpenCornersSquareThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, "outer_dia" | "angle" | "num_spokes" | "gap" | "line_width"> & Partial<{ id: string; units: Units }>) {
    super({
      symbol: STANDARD_SYMBOLS_MAP.Rectangle_Thermal_Open_Corners,
      width: symbol.outer_dia,
      height: symbol.outer_dia,
      line_width: symbol.line_width,
      angle: symbol.angle,
      num_spokes: symbol.num_spokes,
      gap: symbol.gap,
      round: 0,
    })
  }
}

// export class LineThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "angle" | "num_spokes" | "gap"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Line_Thermal, ...symbol })
//   }
// }

// export class SquareRoundThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "angle" | "num_spokes" | "gap"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Square_Round_Thermal, ...symbol })
//   }
// }

// export class RectangularThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "width" | "height" | "angle" | "num_spokes" | "gap" | "line_width" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Rectangular_Thermal, ...symbol })
//   }
// }

// export class RectangularThermalOpenCornersSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "width" | "height" | "angle" | "num_spokes" | "gap" | "line_width"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Rectangular_Thermal_Open_Corners, ...symbol })
//   }
// }

// export class RoundedSquareThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "corner_radius" | "corners" | "angle" | "num_spokes" | "gap" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Thermal, ...symbol })
//   }
// }

// export class RoundedSquareThermalOpenCornersSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "outer_dia" | "inner_dia" | "corner_radius" | "corners" | "angle" | "num_spokes" | "gap" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Thermal_Open_Corners, ...symbol })
//   }
// }

// export class RoundedRectangularThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "width" | "height" | "corner_radius" | "corners" | "angle" | "num_spokes" | "gap" | "line_width" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangular_Thermal, ...symbol })
//   }
// }

// export class OvalThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "width" | "height" | "angle" | "num_spokes" | "gap" | "line_width" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Oval_Thermal, ...symbol })
//   }
// }

// export class OblongThermalSymbol extends StandardSymbol {
//   constructor(
//     symbol: Pick<TStandardSymbol, "width" | "height" | "angle" | "num_spokes" | "gap" | "line_width" | "round"> &
//       Partial<{ id: string; attributes: AttributeCollection }>,
//   ) {
//     super({ symbol: STANDARD_SYMBOLS_MAP.Oblong_Thermal, ...symbol })
//   }
// }

export type TMacroSymbol = {
  /**
   * symbol id. typically the symbol name and unique identifier
   */
  id: string
  /**
   * flatten symbol. if true, the symbol polarities will be flattened, ie negatives will become truly transparent
   */
  flatten: boolean
  /**
   * shapes that make up the symbol
   */
  shapes: Shape[]
}

export class MacroSymbol implements TMacroSymbol, ISymbolRecord {
  public readonly type = SymbolTypeIdentifier.MACRO_DEFINITION
  public id = ""
  public sym_num = malloc<number>(0)
  public flatten = false
  public shapes: Shape[] = []

  constructor(macro: Partial<TMacroSymbol>) {
    Object.assign(this, macro)
  }
}

export class FlatMacroSymbol extends MacroSymbol {
  constructor(macro: Partial<TMacroSymbol & { id: string; units: Units }>) {
    super(macro)
    this.flatten = true
  }
}

export type Symbol = StandardSymbol | MacroSymbol
export type Symbols = StandardSymbol | MacroSymbol

// export function getBoundingBoxOfSymbol(symbol: StandardSymbol | MacroSymbol): BoundingBox {
//   const min: vec2 = vec2.fromValues(0, 0)
//   const max: vec2 = vec2.fromValues(0, 0)
//   if (symbol.type === SymbolTypeIdentifier.SYMBOL_DEFINITION) {
//     const { width, height, outer_dia, line_length } = symbol
//     const max_width = Math.max(width, outer_dia, line_length)
//     const max_height = Math.max(height, outer_dia, line_length)
//     vec2.set(min, -max_width / 2, -max_height / 2)
//     vec2.set(max, max_width / 2, max_height / 2)
//   } else {
//     for (const shape of symbol.shapes) {
//       const shapeBoundingBox = getBoundingBoxOfShape(shape)
//       const shapeMin = shapeBoundingBox.min
//       const shapeMax = shapeBoundingBox.max
//       vec2.min(min, min, shapeMin)
//       vec2.max(max, max, shapeMax)
//     }
//   }
//   return { min, max }
// }

// /**
//  * Convert the units of a symbol to the specified units.
//  * This modifies the symbol in place and also returns it.
//  * @param symbol symbol to convert
//  * @param units units to convert to
//  * @returns converted symbol
//  */
// export function convertSymbolUnits(symbol: Symbols, units: Units): Symbols {
//   if (symbol.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
//     for (const shape of symbol.shapes) {
//       convertShapeUnits(shape, units)
//     }
//   } else {
//     const factor = baseUnitsConversionFactor(symbol.units) / baseUnitsConversionFactor(units)
//     if (factor === 1) return symbol
//     symbol.width *= factor
//     symbol.height *= factor
//     symbol.corner_radius *= factor
//     // "corners",
//     symbol.outer_dia *= factor
//     symbol.inner_dia *= factor
//     symbol.line_width *= factor
//     symbol.line_length *= factor
//     // "angle",
//     symbol.gap *= factor
//     // "num_spokes",
//     // "round",
//     symbol.cut_size *= factor
//     symbol.ring_width *= factor
//     symbol.ring_gap *= factor
//     // "num_rings",
//     symbol.units = units
//   }
//   return symbol
// }
