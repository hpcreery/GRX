import { ISymbolRecord, FeatureTypeIdentifier, toMap, BoundingBox } from './types'
import { Shape, getBoundingBoxOfShape } from './shapes'
import { malloc } from './utils'
import { vec2 } from 'gl-matrix'

export const STANDARD_SYMBOLS = [
  'Null',
  'Round',
  'Square',
  'Rectangle',
  'Rounded_Rectangle',
  'Chamfered_Rectangle',
  'Oval',
  'Diamond',
  'Octagon',
  'Round_Donut',
  'Square_Donut',
  'SquareRound_Donut',
  'Rounded_Square_Donut',
  'Rectangle_Donut',
  'Rounded_Rectangle_Donut',
  'Oval_Donut',
  'Horizontal_Hexagon',
  'Vertical_Hexagon',
  'Butterfly',
  'Square_Butterfly',
  'Triangle',
  'Half_Oval',
  'Rounded_Round_Thermal',
  'Squared_Round_Thermal',
  'Square_Thermal',
  'Open_Corners_Square_Thermal',
  'Line_Thermal',
  'Square_Round_Thermal',
  'Rectangular_Thermal',
  'Rectangular_Thermal_Open_Corners',
  'Rounded_Square_Thermal',
  'Rounded_Square_Thermal_Open_Corners',
  'Rounded_Rectangular_Thermal',
  'Oval_Thermal',
  'Oblong_Thermal',
  'Ellipse',
  // 'Moire',
  'MoireGerber',
  'MoireODB',
  'Hole',
  'Polygon'

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
  'symbol',
  'width',
  'height',
  'corner_radius',
  'corners',
  'outer_dia',
  'inner_dia',
  'line_width',
  'line_length',
  'angle',
  'gap',
  'num_spokes',
  'round',
  'cut_size',
  'ring_width',
  'ring_gap',
  'num_rings'
] as const
export type SYMBOL_PARAMETERS = typeof SYMBOL_PARAMETERS

export const STANDARD_SYMBOLS_MAP = toMap(STANDARD_SYMBOLS)
export const SYMBOL_PARAMETERS_MAP = toMap(SYMBOL_PARAMETERS)

export type TStandardSymbol = typeof SYMBOL_PARAMETERS_MAP

type AtLeastOne<T, U = {[K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export class StandardSymbol implements TStandardSymbol, ISymbolRecord {
  public readonly type = FeatureTypeIdentifier.SYMBOL_DEFINITION
  public id = ''
  public symbol = STANDARD_SYMBOLS_MAP.Null
  public sym_num = malloc<number>(0)
  public width = 0
  public height = 0
  public corner_radius = 0
  public corners = 0
  public outer_dia = 0
  public inner_dia = 0
  public line_width = 0
  public line_length = 0
  public angle = 0
  public gap = 0
  public num_spokes = 0
  public round = 0
  public cut_size = 0
  public ring_width = 0
  public ring_gap = 0
  public num_rings = 0

  constructor(symbol: Partial<TStandardSymbol & { id: string }> & AtLeastOne<Pick<TStandardSymbol, 'width' | 'height' | 'outer_dia'>>) {
    Object.assign(this, symbol)
  }

}

export class NullSymbol extends StandardSymbol {
  constructor(symbol: Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Null, outer_dia: 0, ...symbol })
  }
}

export class RoundSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Round, ...symbol })
  }
}

export class HoleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Hole, ...symbol })
  }
}

export class SquareSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square, ...symbol })
  }
}

export class RectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle, ...symbol })
  }
}

export class RoundedRectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius' | 'corners' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangle, ...symbol })
  }
}

export class ChamferedRectangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius' | 'corners' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Chamfered_Rectangle, ...symbol })
  }
}

export class OvalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oval, ...symbol })
  }
}

export class DiamondSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Diamond, ...symbol })
  }
}

export class OctagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Octagon, ...symbol })
  }
}

export class RoundDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Round_Donut, ...symbol })
  }
}

export class SquareDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Donut, ...symbol })
  }
}

export class SquareRoundDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.SquareRound_Donut, ...symbol })
  }
}

export class RoundedSquareDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'corner_radius' | 'corners'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Donut, ...symbol })
  }
}

export class RectangleDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'line_width' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangle_Donut, ...symbol })
  }
}

export class RoundedRectangleDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius' | 'corners' | 'line_width' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangle_Donut, ...symbol })
  }
}

export class OvalDonutSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'line_width' | 'inner_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oval_Donut, ...symbol })
  }
}

export class HorizontalHexagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Horizontal_Hexagon, ...symbol })
  }
}

export class VerticalHexagonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Vertical_Hexagon, ...symbol })
  }
}

export class ButterflySymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Butterfly, ...symbol })
  }
}

export class SquareButterflySymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Butterfly, ...symbol })
  }
}

export class TriangleSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Triangle, ...symbol })
  }
}

export class HalfOvalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Half_Oval, ...symbol })
  }
}

export class RoundedRoundThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Round_Thermal, ...symbol })
  }
}

export class SquaredRoundThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Squared_Round_Thermal, ...symbol })
  }
}

export class SquareThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Thermal, ...symbol })
  }
}

export class OpenCornersSquareThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'angle' | 'num_spokes' | 'gap' | 'line_width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Open_Corners_Square_Thermal, ...symbol })
  }
}

export class LineThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Line_Thermal, ...symbol })
  }
}

export class SquareRoundThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Square_Round_Thermal, ...symbol })
  }
}

export class RectangularThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'angle' | 'num_spokes' | 'gap' | 'line_width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangular_Thermal, ...symbol })
  }
}

export class RectangularThermalOpenCornersSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'angle' | 'num_spokes' | 'gap' | 'line_width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rectangular_Thermal_Open_Corners, ...symbol })
  }
}

export class RoundedSquareThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'corner_radius' | 'corners' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Thermal, ...symbol })
  }
}

export class RoundedSquareThermalOpenCornersSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'inner_dia' | 'corner_radius' | 'corners' | 'angle' | 'num_spokes' | 'gap'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Square_Thermal_Open_Corners, ...symbol })
  }
}

export class RoundedRectangularThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'corner_radius' | 'corners' | 'angle' | 'num_spokes' | 'gap' | 'line_width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Rounded_Rectangular_Thermal, ...symbol })
  }
}

export class OvalThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'angle' | 'num_spokes' | 'gap' | 'line_width'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oval_Thermal, ...symbol })
  }
}

export class OblongThermalSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height' | 'angle' | 'num_spokes' | 'gap' | 'line_width' | 'round'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Oblong_Thermal, ...symbol })
  }
}

export class EllipseSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'width' | 'height'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Ellipse, ...symbol })
  }
}

export class MoireGerberSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'ring_width' | 'ring_gap' | 'num_rings' | 'line_width' | 'line_length' | 'angle'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.MoireGerber, ...symbol })
  }
}

export class MoireODBSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'ring_width' | 'ring_gap' | 'num_rings' | 'line_width' | 'line_length' | 'angle'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.MoireODB, ...symbol })
  }
}

export class PolygonSymbol extends StandardSymbol {
  constructor(symbol: Pick<TStandardSymbol, 'outer_dia' | 'corners' | 'line_width' | 'inner_dia' | 'angle'> & Partial<{ id: string }>) {
    super({ symbol: STANDARD_SYMBOLS_MAP.Polygon, ...symbol })
  }
}




export type TMacroSymbol = {
  id: string
  /**
   * flatten symbol. if true, the symbol polarities will be flattened, ie negatives will become truly transparent
   */
  flatten: boolean
  shapes: Shape[]
}

export class MacroSymbol implements TMacroSymbol, ISymbolRecord {
  public readonly type = FeatureTypeIdentifier.MACRO_DEFINITION
  public id = ''
  public sym_num = malloc<number>(0)
  public flatten = false
  public shapes: Shape[] = []

  constructor(macro: Partial<TMacroSymbol>) {
    Object.assign(this, macro)
  }
}

export class FlatMacroSymbol extends MacroSymbol {
  constructor(macro: Partial<TMacroSymbol & { id: string }>) {
    super(macro)
    this.flatten = true
  }
}

export type Symbol = StandardSymbol | MacroSymbol

export function getBoundingBoxOfSymbol(symbol: StandardSymbol | MacroSymbol): BoundingBox {
  const min: vec2 = vec2.fromValues(0, 0)
  const max: vec2 = vec2.fromValues(0, 0)
  if (symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
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
  return {min, max}
}
