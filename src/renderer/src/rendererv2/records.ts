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

export const CONTOUR_SEGMENT_RECORD_PARAMETERS = ['id', 'x', 'y'] as const
export const CONTOUR_ARC_RECORD_PARAMETERS = ['id', 'x', 'y', 'xc', 'yc', 'clockwise'] as const
export const CONTOUR_RECORD_PARAMETERS = ['id', 'poly_type'] as const
export const SURFACE_RECORD_PARAMETERS = ['id', 'index', 'polarity', 'xs', 'ys'] as const

export const CONTOUR_SEGMENT_RECORD_PARAMETERS_MAP = Object.fromEntries(
  CONTOUR_SEGMENT_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof CONTOUR_SEGMENT_RECORD_PARAMETERS)[number]]: number
}
export const CONTOUR_ARC_RECORD_PARAMETERS_MAP = Object.fromEntries(
  CONTOUR_ARC_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof CONTOUR_ARC_RECORD_PARAMETERS)[number]]: number
}
export const CONTOUR_RECORD_PARAMETERS_MAP = Object.fromEntries(
  CONTOUR_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof CONTOUR_RECORD_PARAMETERS)[number]]: number
}
export const SURFACE_RECORD_PARAMETERS_MAP = Object.fromEntries(
  SURFACE_RECORD_PARAMETERS.map((key, i) => [key, i])
) as {
  [key in (typeof SURFACE_RECORD_PARAMETERS)[number]]: number
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

  public get length(): number {
    return PAD_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return PAD_RECORD_PARAMETERS.map((key) => this[key])
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

  public get length(): number {
    return LINE_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return LINE_RECORD_PARAMETERS.map((key) => this[key])
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

  public get length(): number {
    return ARC_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return ARC_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get object(): TArc_Record {
    return Object.fromEntries(ARC_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TArc_Record
  }
}

export type TContour = typeof CONTOUR_RECORD_PARAMETERS_MAP
export type TContourSegment = typeof CONTOUR_SEGMENT_RECORD_PARAMETERS_MAP
export type TContourArc = typeof CONTOUR_ARC_RECORD_PARAMETERS_MAP
export type TSurface = typeof SURFACE_RECORD_PARAMETERS_MAP

export class Contour_Arc_Segment_Record implements TContourArc, IPlotRecord {
  public type = 'arc' as const
  public id = 555
  public x = 0
  public y = 0
  public xc = 0
  public yc = 0
  public clockwise = 0

  constructor(segment: Partial<TContourArc>) {
    Object.assign(this, segment)
  }

  public get length(): number {
    return CONTOUR_ARC_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return CONTOUR_ARC_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get object(): TContourArc {
    return Object.fromEntries(
      CONTOUR_ARC_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TContourArc
  }
}

export class Contour_Line_Segment_Record implements TContourSegment, IPlotRecord {
  public type = 'line' as const
  public id = 444
  public x = 0
  public y = 0

  constructor(segment: Partial<TContourSegment>) {
    Object.assign(this, segment)
  }

  public get length(): number {
    return CONTOUR_SEGMENT_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return CONTOUR_SEGMENT_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get object(): TContourSegment {
    return Object.fromEntries(
      CONTOUR_SEGMENT_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TContourSegment
  }
}

export class Contour_Record implements TContour, IPlotRecord {
  // 1 == island, 0 == hole
  public type = 'contour' as const
  public poly_type: 1 | 0 = 1
  public id = 333
  public segments: (Contour_Arc_Segment_Record | Contour_Line_Segment_Record)[] = []

  constructor(contour: Partial<TContour>) {
    Object.assign(this, contour)
  }

  public get array(): number[] {
    return CONTOUR_RECORD_PARAMETERS.map((key) => this[key]).concat(
      this.segments.flatMap((segment) => segment.array)
    )
  }

  public get length(): number {
    return CONTOUR_RECORD_PARAMETERS.length + this.segments.reduce((acc, segment) => acc + segment.length, 0)
  }

  public get object(): TContour {
    return Object.fromEntries(CONTOUR_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TContour
  }

  public addSegments(segments: (Contour_Arc_Segment_Record | Contour_Line_Segment_Record)[]): this {
    this.segments = this.segments.concat(segments)
    return this
  }
}

export class Surface_Record implements TSurface, IPlotRecord {
  public type = 'surface' as const
  public id = 222
  public xs = 0
  public ys = 0
  public index = 0
  public polarity = 0
  public contours: Contour_Record[] = []

  constructor(record: Partial<TSurface>) {
    Object.assign(this, record)
  }

  public get length(): number {
    return SURFACE_RECORD_PARAMETERS.length + this.contours.reduce((acc, contour) => acc + contour.length, 0)
  }

  public get array(): number[] {
    return SURFACE_RECORD_PARAMETERS.map((key) => this[key]).concat(
      this.contours.flatMap((contour) => contour.array)
    )
  }

  public get object(): TSurface {
    return Object.fromEntries(SURFACE_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TSurface
  }

  public addContours(contour: Contour_Record[]): this {
    this.contours = this.contours.concat(contour)
    return this
  }
}

export type Input_Record = Pad_Record | Line_Record | Arc_Record | Surface_Record
