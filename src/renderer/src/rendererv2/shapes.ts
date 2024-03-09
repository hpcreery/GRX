import { IPlotRecord, FeatureTypeIdentifyer, toMap, Transform, Binary } from './types'
import * as Symbols from './symbols'
import earcut from 'earcut'


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
// export const BRUSHED_LINE_RECORD_PARAMETERS = [
//   'index',
//   'xs',
//   'ys',
//   'xe',
//   'ye',
//   'sym_num',
//   'resize_factor',
//   'polarity',
//   'rotation',
//   'mirror_x',
//   'mirror_y'
// ] as const
// export const BRUSHED_ARC_RECORD_PARAMETERS = [
//   'index',
//   'xs',
//   'ys',
//   'xe',
//   'ye',
//   'xc',
//   'yc',
//   'clockwise',
//   'sym_num',
//   'resize_factor',
//   'polarity',
//   'rotation',
//   'mirror_x',
//   'mirror_y'
// ] as const
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

export const SURFACE_RECORD_PARAMETERS_V2 = [
  'index',
  'polarity',
  // 'contour_index',
  // 'contour_count',
  // 'contour_polarity',
  'indicies',
  'offset'
] as const

// =================

export const PAD_RECORD_PARAMETERS_MAP = toMap(PAD_RECORD_PARAMETERS)
export const LINE_RECORD_PARAMETERS_MAP = toMap(LINE_RECORD_PARAMETERS)
export const ARC_RECORD_PARAMETERS_MAP = toMap(ARC_RECORD_PARAMETERS)
// export const BRUSHED_LINE_RECORD_PARAMETERS_MAP = toMap(BRUSHED_LINE_RECORD_PARAMETERS)
// export const BRUSHED_ARC_RECORD_PARAMETERS_MAP = toMap(BRUSHED_ARC_RECORD_PARAMETERS)
export const CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP = toMap(
  CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS
)
export const CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP = toMap(
  CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS
)
export const CONTOUR_RECORD_PARAMETERS_MAP = toMap(CONTOUR_RECORD_PARAMETERS)
export const SURFACE_RECORD_PARAMETERS_MAP = toMap(SURFACE_RECORD_PARAMETERS)
export const SURFACE_RECORD_PARAMETERS_V2_MAP = toMap(SURFACE_RECORD_PARAMETERS_V2)

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

// export type TBrushedLine_Record = typeof BRUSHED_LINE_RECORD_PARAMETERS_MAP

// export class BrushedLine implements TBrushedLine_Record, IPlotRecord {
//   public readonly type = FeatureTypeIdentifyer.BRUSHED_LINE
//   public index = 0
//   public xs = 0
//   public ys = 0
//   public xe = 0
//   public ye = 0
//   public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({outer_dia: 0})
//   public get sym_num(): number {
//     return this.symbol.sym_num.value
//   }
//   public resize_factor = 1
//   public polarity = 1
//   public rotation = 0
//   public mirror_x = 0
//   public mirror_y = 0

//   constructor(record: Partial<Omit<TBrushedLine_Record, 'sym_num' | 'type'> & { symbol: Symbols.Symbol }>) {
//     Object.assign(this, record)
//   }

//   public get length(): number {
//     return BRUSHED_LINE_RECORD_PARAMETERS.length
//   }

//   public get array(): number[] {
//     return BRUSHED_LINE_RECORD_PARAMETERS.map((key) => this[key])
//   }

//   public get object(): TPad_Record {
//     return Object.fromEntries(BRUSHED_LINE_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TPad_Record
//   }
// }

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

// =================

// export type TBrushedArc_Record = typeof BRUSHED_ARC_RECORD_PARAMETERS_MAP

// export class BrushedArc implements TBrushedArc_Record, IPlotRecord {
//   public readonly type = FeatureTypeIdentifyer.BRUSHED_ARC
//   public index = 0
//   public xs = 0
//   public ys = 0
//   public xe = 0
//   public ye = 0
//   public xc = 0
//   public yc = 0
//   public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({outer_dia: 0})
//   public get sym_num(): number {
//     return this.symbol.sym_num.value
//   }
//   public clockwise = 0
//   public resize_factor = 1
//   public polarity = 1
//   public rotation = 0
//   public mirror_x = 0
//   public mirror_y = 0

//   constructor(record: Partial<Omit<TBrushedArc_Record, 'sym_num' | 'type'> & { symbol: Symbols.Symbol }>) {
//     Object.assign(this, record)
//   }

//   public get length(): number {
//     return BRUSHED_ARC_RECORD_PARAMETERS.length
//   }

//   public get array(): number[] {
//     return BRUSHED_ARC_RECORD_PARAMETERS.map((key) => this[key])
//   }

//   public get object(): TBrushedArc_Record {
//     return Object.fromEntries(BRUSHED_ARC_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TBrushedArc_Record
//   }
// }

// =================

export type TSurface = typeof SURFACE_RECORD_PARAMETERS_MAP
export type TContour = typeof CONTOUR_RECORD_PARAMETERS_MAP
export type TContourLineSegment = typeof CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
export type TContourArcSegment = typeof CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP

export const CONTOUR_ARC_SEGMENT_ID = Math.random()
export class Contour_Arc_Segment implements TContourArcSegment, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.ARCSEGMENT
  public id = CONTOUR_ARC_SEGMENT_ID
  public x = 0
  public y = 0
  public xc = 0
  public yc = 0
  public clockwise: Binary = 0

  constructor(segment: Partial<Omit<TContourArcSegment, 'id' | 'type'>>) {
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

export const CONTOUR_LINE_SEGMENT_ID = Math.random()
export class Contour_Line_Segment implements TContourLineSegment, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.LINESEGMENT
  public id = CONTOUR_LINE_SEGMENT_ID
  public x = 0
  public y = 0

  constructor(segment: Partial<Omit<TContourLineSegment, 'id' | 'type'>>) {
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

export const CONTOUR_ID = Math.random()
export const END_CONTOUR_ID = Math.random()
export class Contour implements TContour, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.CONTOUR
  /**
   * 1 == island, 0 == hole
   */
  public poly_type: Binary = 1
  public id = CONTOUR_ID
  public xs = 0
  public ys = 0
  public segments: (Contour_Arc_Segment | Contour_Line_Segment)[] = []

  constructor(contour: Partial<Omit<TContour, 'id' | 'type'>>) {
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
    return Object.fromEntries(CONTOUR_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TContour
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

  public getVertices(): number[] {
    let previous: { x: number; y: number } = { x: this.xs, y: this.ys }
    const vertices = this.segments.flatMap((segment) => {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        previous = { x: segment.x, y: segment.y }
        return [segment.x, segment.y]
      } else {
        const start_angle = Math.atan2(previous.y - segment.yc, previous.x - segment.xc)
        const dot = (x1: number, y1: number, x2: number, y2: number): number => x1 * x2 + y1 * y2
        const det = (x1: number, y1: number, x2: number, y2: number): number => x1 * y2 - y1 * x2
        const v2 = { x: previous.x - segment.xc, y: previous.y - segment.yc }
        const v1 = { x: segment.x - segment.xc, y: segment.y - segment.yc }

        const dotComp = dot(v1.x, v1.y, v2.x, v2.y)
        const detComp = det(v1.x, v1.y, v2.x, v2.y)
        let angle = Math.atan2(detComp, dotComp)
        angle = Math.abs(angle)
        if (angle == 0) {
          angle = Math.PI * 2
        }
        const radius = Math.sqrt((segment.x - segment.xc) ** 2 + (segment.y - segment.yc) ** 2)
        const segments: number[] = []
        const steps = 100
        // const steps = Math.abs(Math.ceil((angle / (Math.PI * 2)) * 100 ))
        // console.log('angle1', angle1)
        // console.log('angle2', angle2)
        // console.log('start_angle', start_angle)
        // console.log('angle', angle)
        // console.log('steps', steps)
        if (segment.clockwise === 1) {
          angle = -angle
        }
        for (let i = 1; i <= steps; i++) {
          const a = angle * (i / steps) + start_angle
          segments.push(segment.xc + Math.cos(a) * radius, segment.yc + Math.sin(a) * radius)
        }
        segments.push(segment.x, segment.y)
        previous = { x: segment.x, y: segment.y }
        return segments
      }
    })
    vertices.unshift(this.xs, this.ys)
    return vertices
  }
}

export const END_SURFACE_ID = Math.random()
export class Surface implements TSurface, IPlotRecord {
  public readonly type = FeatureTypeIdentifyer.SURFACE
  public index = 0
  public polarity: Binary = 0
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

  constructor(record: Partial<Omit<TSurface, 'id' | 'type'>>) {
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
    return Object.fromEntries(SURFACE_RECORD_PARAMETERS.map((key) => [key, this[key]])) as TSurface
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
// export type Brushes = BrushedLine | BrushedArc
export type Shape = Primitive | Surface | PolyLine | StepAndRepeat // | Brushes
