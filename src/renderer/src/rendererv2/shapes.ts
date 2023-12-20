import { IPlotRecord, FeatureTypeIdentifyer, toMap } from './types'
import * as Symbols from './symbols'

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
export const CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS = ['id', 'x', 'y'] as const
export const CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS = [
  'id',
  'x',
  'y',
  'xc',
  'yc',
  'clockwise'
] as const
export const CONTOUR_RECORD_PARAMETERS = ['id', 'xs', 'ys', 'poly_type'] as const
export const SURFACE_RECORD_PARAMETERS = [
  'index',
  'polarity',
  'top',
  'right',
  'bottom',
  'left',
  'segmentsCount'
] as const

// =================

export const PAD_RECORD_PARAMETERS_MAP = toMap(PAD_RECORD_PARAMETERS)
export const LINE_RECORD_PARAMETERS_MAP = toMap(LINE_RECORD_PARAMETERS)
export const ARC_RECORD_PARAMETERS_MAP = toMap(ARC_RECORD_PARAMETERS)
export const CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP = toMap(
  CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS
)
export const CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP = toMap(
  CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS
)
export const CONTOUR_RECORD_PARAMETERS_MAP = toMap(CONTOUR_RECORD_PARAMETERS)
export const SURFACE_RECORD_PARAMETERS_MAP = toMap(SURFACE_RECORD_PARAMETERS)

export type TPad_Record = typeof PAD_RECORD_PARAMETERS_MAP

export class Pad implements TPad_Record, IPlotRecord {
  public type = FeatureTypeIdentifyer.PAD
  public index = 0
  public x = 0
  public y = 0
  public symbol: Symbols.Symbol = new Symbols.StandardSymbol({})
  public get sym_num(): number {
    return this.symbol.sym_num
  }
  public resize_factor = 0
  public polarity = 0
  public rotation = 0
  public mirror = 0

  constructor(record: Partial<Omit<TPad_Record, 'sym_num'> & { symbol: Symbols.Symbol }>) {
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

export class Line implements TLine_Record, IPlotRecord {
  public type = FeatureTypeIdentifyer.LINE
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({})
  public get sym_num(): number {
    return this.symbol.sym_num
  }
  public polarity = 0

  constructor(record: Partial<Omit<TLine_Record, 'sym_num'> & { symbol: Symbols.StandardSymbol }>) {
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

export class Arc implements TArc_Record, IPlotRecord {
  public type = FeatureTypeIdentifyer.ARC
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public xc = 0
  public yc = 0
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({})
  public get sym_num(): number {
    return this.symbol.sym_num
  }
  public polarity = 0
  public clockwise = 0

  constructor(record: Partial<Omit<TArc_Record, 'sym_num'> & { symbol: Symbols.StandardSymbol }>) {
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

export type TSurface = typeof SURFACE_RECORD_PARAMETERS_MAP
export type TContour = typeof CONTOUR_RECORD_PARAMETERS_MAP
export type TContourLineSegment = typeof CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
export type TContourArcSegment = typeof CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP

export const CONTOUR_ARC_SEGMENT_ID = Math.random() * 1000000
export class Contour_Arc_Segment implements TContourArcSegment, IPlotRecord {
  public type = FeatureTypeIdentifyer.ARCSEGMENT
  public id = CONTOUR_ARC_SEGMENT_ID
  public x = 0
  public y = 0
  public xc = 0
  public yc = 0
  public clockwise = 0

  constructor(segment: Partial<Omit<TContourArcSegment, 'id'>>) {
    Object.assign(this, segment)
  }

  public get length(): number {
    return CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get object(): TContourArcSegment {
    return Object.fromEntries(
      CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TContourArcSegment
  }
}

export const CONTOUR_LINE_SEGMENT_ID = Math.random() * 1000000
export class Contour_Line_Segment implements TContourLineSegment, IPlotRecord {
  public type = FeatureTypeIdentifyer.LINESEGMENT
  public id = CONTOUR_LINE_SEGMENT_ID
  public x = 0
  public y = 0

  constructor(segment: Partial<Omit<TContourLineSegment, 'id'>>) {
    Object.assign(this, segment)
  }

  public get length(): number {
    return CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS.length
  }

  public get array(): number[] {
    return CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get object(): TContourLineSegment {
    return Object.fromEntries(
      CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TContourLineSegment
  }
}

export const CONTOUR_ID = Math.random() * 1000000
export const END_CONTOUR_ID = Math.random() * 1000000
export class Contour implements TContour, IPlotRecord {
  // 1 == island, 0 == hole
  public type = FeatureTypeIdentifyer.CONTOUR
  public poly_type: 1 | 0 = 1
  public id = CONTOUR_ID
  public xs = 0
  public ys = 0
  public segments: (Contour_Arc_Segment | Contour_Line_Segment)[] = []

  constructor(contour: Partial<Omit<TContour, 'id'>>) {
    Object.assign(this, contour)
  }

  public get left(): number {
    let left = this.xs
    for (const segment of this.segments) {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        left = Math.min(left, segment.x)
      } else {
        // rewrite to consider true arc boundaries
        const r = Math.sqrt((segment.xc - segment.x) ** 2 + (segment.yc - segment.y) ** 2)
        left = Math.min(left, segment.xc - r)
      }
    }
    return left
  }

  public get right(): number {
    let right = this.xs
    for (const segment of this.segments) {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        right = Math.max(right, segment.x)
      } else {
        // rewrite to consider true arc boundaries
        const r = Math.sqrt((segment.xc - segment.x) ** 2 + (segment.yc - segment.y) ** 2)
        right = Math.max(right, segment.xc + r)
      }
    }
    return right
  }

  public get top(): number {
    let top = this.ys
    for (const segment of this.segments) {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        top = Math.max(top, segment.y)
      } else {
        // rewrite to consider true arc boundaries
        const r = Math.sqrt((segment.xc - segment.x) ** 2 + (segment.yc - segment.y) ** 2)
        top = Math.max(top, segment.yc + r)
      }
    }
    return top
  }

  public get bottom(): number {
    let bottom = this.ys
    for (const segment of this.segments) {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        bottom = Math.min(bottom, segment.y)
      } else {
        // rewrite to consider true arc boundaries
        const r = Math.sqrt((segment.xc - segment.x) ** 2 + (segment.yc - segment.y) ** 2)
        bottom = Math.min(bottom, segment.yc - r)
      }
    }
    return bottom
  }

  public get array(): number[] {
    return CONTOUR_RECORD_PARAMETERS.map((key) => this[key])
      .concat(this.segments.flatMap((segment) => segment.array))
      .concat(END_CONTOUR_ID)
  }

  public get length(): number {
    return (
      CONTOUR_RECORD_PARAMETERS.length +
      this.segments.reduce((acc, segment) => acc + segment.length, 0)
    )
  }

  public get object(): TContour {
    return Object.fromEntries(
      CONTOUR_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TContour
  }

  public addSegments(segments: (Contour_Arc_Segment | Contour_Line_Segment)[]): this {
    for (const segment of segments) {
      this.addSegment(segment)
    }
    return this
  }

  public addSegment(segment: Contour_Arc_Segment | Contour_Line_Segment): this {
    this.segments.push(segment)
    return this
  }
}

export const END_SURFACE_ID = Math.random() * 1000000
export class Surface implements TSurface, IPlotRecord {
  public type = FeatureTypeIdentifyer.SURFACE
  public index = 0
  public polarity = 0
  public contours: Contour[] = []

  public get left(): number {
    return Math.min(...this.contours.map((contour) => contour.left))
  }

  public get right(): number {
    return Math.max(...this.contours.map((contour) => contour.right))
  }

  public get top(): number {
    return Math.max(...this.contours.map((contour) => contour.top))
  }

  public get bottom(): number {
    return Math.min(...this.contours.map((contour) => contour.bottom))
  }

  constructor(record: Partial<Omit<TSurface, 'id'>>) {
    Object.assign(this, record)
  }

  public get length(): number {
    return (
      SURFACE_RECORD_PARAMETERS.length +
      this.contours.reduce((acc, contour) => acc + contour.length, 0)
    )
  }

  public get array(): number[] {
    return SURFACE_RECORD_PARAMETERS.map((key) => this[key])
  }

  public get contoursArray(): number[] {
    return this.contours.flatMap((contour) => contour.array).concat(END_SURFACE_ID)
  }

  public get segmentsCount(): number {
    return this.contours.reduce((acc, contour) => acc + contour.segments.length, 0)
  }

  public get object(): TSurface {
    return Object.fromEntries(
      SURFACE_RECORD_PARAMETERS.map((key) => [key, this[key]])
    ) as TSurface
  }

  public addContours(contour: Contour[]): this {
    for (const c of contour) {
      this.addContour(c)
    }
    return this
  }

  public addContour(contour: Contour): this {
    this.contours.push(contour)
    return this
  }
}

export type Primitive = Pad | Line | Arc
export type Shape = Pad | Line | Arc | Surface
