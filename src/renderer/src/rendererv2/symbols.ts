import { ISymbolRecord, FeatureTypeIdentifyer, toMap } from './types'
import { Shape } from './shapes'
import { ptr } from './utils'

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
  'Rectange_Donut',
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
  // "Hexagon"
  // "Hexagon_Donut"
  // "Octagon_Donut"
  // "Hexagon_Thermal"
  // "Octagon_Thermal"

  'Ellipse',
  'Moire',
  'Hole'
] as const
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

export const STANDARD_SYMBOLS_MAP = toMap(STANDARD_SYMBOLS)
export const SYMBOL_PARAMETERS_MAP = toMap(SYMBOL_PARAMETERS)

export type TStandardSymbol = typeof SYMBOL_PARAMETERS_MAP

export class StandardSymbol implements TStandardSymbol, ISymbolRecord {
  public type = FeatureTypeIdentifyer.SYMBOL_DEFINITION
  public id = ''
  public symbol = STANDARD_SYMBOLS_MAP.Null
  public sym_num = 0
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

  constructor(symbol: Partial<TStandardSymbol & { id: string }>) {
    Object.assign(this, symbol)
  }

  public get array(): number[] {
    return SYMBOL_PARAMETERS.map((key) => this[key])
  }

  public get length(): number {
    return SYMBOL_PARAMETERS.length
  }
}

export type TMacroSymbol = {
  shapes: ptr<Shape>[]
}

export class MacroSymbol implements TMacroSymbol, ISymbolRecord {
  public type = FeatureTypeIdentifyer.MACRO_DEFINITION
  public id = ''
  public sym_num = 0
  public shapes: ptr<Shape>[] = []

  constructor(macro: Partial<TMacroSymbol & { id: string }>) {
    Object.assign(this, macro)
  }

  public get array(): number[] {
    return this.shapes.flatMap((shape) => shape.value.array)
  }

  public get length(): number {
    return this.shapes.length
  }
}

export type Symbol = StandardSymbol | MacroSymbol
