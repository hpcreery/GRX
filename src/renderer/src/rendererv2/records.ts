import { IPlotRecord, ISurfaceRecord } from './types'

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

export const SEGMENT_RECORD_PARAMETERS = ['x', 'y', 'xc', 'yc', 'clockwise'] as const

export const SEGMENT_RECORD_PARAMETERS_MAP = Object.fromEntries(
  SEGMENT_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof SEGMENT_RECORD_PARAMETERS)[number]]: number
}

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

  public get length(): number {
    return PAD_RECORD_PARAMETERS.length
  }

  public get object(): TPad_Record {
    return Object.fromEntries(PAD_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TPad_Record
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

  public get length(): number {
    return LINE_RECORD_PARAMETERS.length
  }

  public get object(): TLine_Record {
    return Object.fromEntries(LINE_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TLine_Record
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

  public get length(): number {
    return ARC_RECORD_PARAMETERS.length
  }

  public get object(): TArc_Record {
    return Object.fromEntries(ARC_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TArc_Record
  }
}

export type TSegment = typeof SEGMENT_RECORD_PARAMETERS_MAP

export class Segment implements TSegment, IPlotRecord {
  public get type(): 'line' | 'arc' {
    return (this.x, this.y) === (this.xc, this.yc) ? 'line' : 'arc'
  }
  public x = 0
  public y = 0
  public xc = 0
  public yc = 0
  public clockwise = 0

  constructor(segment: Partial<Segment>) {
    Object.assign(this, segment)
    if (segment.xc === undefined && segment.yc === undefined) {
      this.xc = this.x
      this.yc = this.y
    }
  }

  public get array(): number[] {
    return SEGMENT_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get length(): number {
    return SEGMENT_RECORD_PARAMETERS.length
  }

  public get object(): TSegment {
    return Object.fromEntries(SEGMENT_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TSegment
  }
}

export class Contour {
  public poly_type: 'island' | 'hole' = 'island'
  public segments: Segment[] = []

  constructor(contour: Partial<Contour>) {
    Object.assign(this, contour)
  }

  public get array(): number[][] {
    return this.segments.map((segment) => segment.array)
  }
}

export class Surface_Record {
  public type = 'surface' as const
  public index = 0
  public polarity = 0
  public contours: Contour[] = []

  constructor(record: Partial<Surface_Record>) {
    Object.assign(this, record)
  }

  // public get array(): number[][][] {
  //   return this.contours.map((contour) => contour.array)
  // }

  public get array(): Contour[] {
    return this.contours
  }

  public get length(): number {
    return this.contours.length
  }

  // public get object(): Record<string, number[][]> {
  //   return Object.fromEntries(this.contours.map((contour) => [contour.poly_type, contour.array]))
  // }
}

export type Record = Pad_Record | Line_Record | Arc_Record | Surface_Record
