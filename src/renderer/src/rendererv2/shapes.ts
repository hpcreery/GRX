import { IPlotRecord, FeatureTypeIdentifyer, toMap, Transform, Binary } from './types'
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
  'clockwise',
  'sym_num',
  'polarity',
] as const

export const SURFACE_RECORD_PARAMETERS = [
  'index',
  'polarity',
  'indicies',
  'offset'
] as const

// =================

export const PAD_RECORD_PARAMETERS_MAP = toMap(PAD_RECORD_PARAMETERS)
export const LINE_RECORD_PARAMETERS_MAP = toMap(LINE_RECORD_PARAMETERS)
export const ARC_RECORD_PARAMETERS_MAP = toMap(ARC_RECORD_PARAMETERS)
export const SURFACE_RECORD_PARAMETERS_MAP = toMap(SURFACE_RECORD_PARAMETERS)

// =================

export type TPad_Record = typeof PAD_RECORD_PARAMETERS_MAP

export class Pad implements TPad_Record, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.PAD
  public index = 0
  public x = 0
  public y = 0
  public symbol: Symbols.Symbol = new Symbols.StandardSymbol({outer_dia: 0})
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  public resize_factor = 1
  public rotation = 0
  public polarity: Binary = 1
  public mirror: Binary = 0

  constructor(record: Partial<Omit<TPad_Record, 'sym_num' | 'type'> & { symbol: Symbols.Symbol }>) {
    Object.assign(this, record)
  }
}

// =================

export type TLine_Record = typeof LINE_RECORD_PARAMETERS_MAP

export class Line implements TLine_Record, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.LINE
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({outer_dia: 0})
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  public polarity: Binary = 0

  constructor(
    record: Partial<Omit<TLine_Record, 'sym_num' | 'type'> & { symbol: Symbols.StandardSymbol }>
  ) {
    Object.assign(this, record)
  }
}

// =================

export type TArc_Record = typeof ARC_RECORD_PARAMETERS_MAP

export class Arc implements TArc_Record, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.ARC
  public index = 0
  public xs = 0
  public ys = 0
  public xe = 0
  public ye = 0
  public xc = 0
  public yc = 0
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({outer_dia: 0})
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  public polarity: Binary = 0
  public clockwise: Binary = 0

  constructor(
    record: Partial<Omit<TArc_Record, 'sym_num' | 'type'> & { symbol: Symbols.StandardSymbol }>
  ) {
    Object.assign(this, record)
  }

}

// =================

type TSurface = {
  index: number;
  polarity: number;
}
type TContour = {
  xs: number;
  ys: number;
  poly_type: number;
}
type TContourLineSegment = {
  x: number;
  y: number;
}
type TContourArcSegment = {
  x: number;
  y: number;
  xc: number;
  yc: number;
  clockwise: number;
}

export class Contour_Arc_Segment implements TContourArcSegment {
  public readonly type = FeatureTypeIdentifyer.ARCSEGMENT
  public x = 0
  public y = 0
  public xc = 0
  public yc = 0
  public clockwise: Binary = 0

  constructor(segment: Partial<Omit<TContourArcSegment, 'id' | 'type'>>) {
    Object.assign(this, segment)
  }
}

export class Contour_Line_Segment implements TContourLineSegment {
  public readonly type = FeatureTypeIdentifyer.LINESEGMENT
  public x = 0
  public y = 0

  constructor(segment: Partial<Omit<TContourLineSegment, 'id' | 'type'>>) {
    Object.assign(this, segment)
  }
}

export class Contour implements TContour {
  public readonly type = FeatureTypeIdentifyer.CONTOUR
  /**
   * 1 == island, 0 == hole
   */
  public poly_type: Binary = 1
  public xs = 0
  public ys = 0
  public segments: (Contour_Arc_Segment | Contour_Line_Segment)[] = []

  constructor(contour: Partial<Omit<TContour, 'id' | 'type'>>) {
    Object.assign(this, contour)
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

export class Surface implements TSurface {
  public readonly type = FeatureTypeIdentifyer.SURFACE
  public index = 0
  public polarity: Binary = 0
  public contours: Contour[] = []

  constructor(record: Partial<Omit<TSurface, 'id' | 'type'>>) {
    Object.assign(this, record)
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

export class PolyLine {
  public readonly type = FeatureTypeIdentifyer.POLYLINE
  public index = 0
  public width = 0
  public polarity: Binary = 0
  public pathtype: 'round' | 'square' | 'none' = 'round'
  public cornertype: 'chamfer' | 'round' | 'miter' = 'chamfer'
  public xs = 0
  public ys = 0
  public lines: { x: number; y: number }[] = []

  constructor(props: Partial<Omit<PolyLine, 'type'>>) {
    Object.assign(this, props)
  }

  public addLines(lines: { x: number; y: number }[]): this {
    for (const line of lines) {
      this.addLine(line)
    }
    return this
  }

  public addLine(line: { x: number; y: number }): this {
    this.lines.push(line)
    return this
  }
}

export class StepAndRepeat {
  public readonly type = FeatureTypeIdentifyer.STEP_AND_REPEAT
  public index = 0
  public id = ''
  public shapes: Shape[] = []
  public repeats: Transform[] = []

  constructor(props: Partial<Omit<StepAndRepeat, 'type'>>) {
    Object.assign(this, props)
  }
}

export type Primitive = Pad | Line | Arc
export type Shape = Primitive | Surface | PolyLine | StepAndRepeat
