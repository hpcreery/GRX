import { IPlotRecord } from './types'

export const PAD_RECORD_PARAMETERS = [
  'index',
  'x',
  'y',
  'sym_num',
  'resize_factor',
  'polarity',
  'rotation',
  'mirror'
] as const
export const LINE_RECORD_PARAMETERS = [
  'index',
  'xs',
  'ys',
  'xe',
  'ye',
  'sym_num',
  'polarity'
] as const
export const ARC_RECORD_PARAMETERS = [
  'index',
  'xs',
  'ys',
  'xe',
  'ye',
  'xc',
  'yc',
  'sym_num',
  'polarity',
  'clockwise'
] as const

export const PAD_RECORD_PARAMETERS_MAP = Object.fromEntries(
  PAD_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof PAD_RECORD_PARAMETERS)[number]]: number
}
export const LINE_RECORD_PARAMETERS_MAP = Object.fromEntries(
  LINE_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof LINE_RECORD_PARAMETERS)[number]]: number
}
export const ARC_RECORD_PARAMETERS_MAP = Object.fromEntries(
  ARC_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof ARC_RECORD_PARAMETERS)[number]]: number
}

// =================

export type TPad_Record = typeof PAD_RECORD_PARAMETERS_MAP

export class Pad_Record implements TPad_Record, IPlotRecord {
  public type = 'pad' as const
  public index = 0
  public x = 0
  public y = 0
  public sym_num = 0
  public resize_factor = 0
  public polarity = 0
  public rotation = 0
  public mirror = 0

  constructor(record: Partial<TPad_Record>) {
    Object.assign(this, record)
  }

  public get array(): number[] {
    return PAD_RECORD_PARAMETERS.map((key) => this[key])
  }
}

// =================

export type TLine_Record = typeof LINE_RECORD_PARAMETERS_MAP

export class Line_Record implements TLine_Record, IPlotRecord {
  public type = 'line' as const
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public sym_num = 0
  public polarity = 0

  constructor(record: Partial<TLine_Record>) {
    Object.assign(this, record)
  }

  public get array(): number[] {
    return LINE_RECORD_PARAMETERS.map((key) => this[key])
  }
}

// =================

export type TArc_Record = typeof ARC_RECORD_PARAMETERS_MAP

export class Arc_Record implements TArc_Record, IPlotRecord {
  public type = 'arc' as const
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public xc = 0
  public yc = 0
  public sym_num = 0
  public polarity = 0
  public clockwise = 0

  constructor(record: Partial<TArc_Record>) {
    Object.assign(this, record)
  }

  public get array(): number[] {
    return ARC_RECORD_PARAMETERS.map((key) => this[key])
  }
}

export type Record =
  | Pad_Record
  | Line_Record
  | Arc_Record
