import { IPlotRecord, FeatureTypeIdentifier, toMap, Transform, Binary, IntersectingTypes, AttributeCollection, BoundingBox } from './types'
import * as Symbols from './symbols'
import { vec2 } from 'gl-matrix'


export const PAD_RECORD_PARAMETERS = [
  'index',
  'x',
  'y',
  'sym_num',
  'resize_factor',
  'polarity',
  'rotation',
  'mirror_x',
  'mirror_y',
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
  public readonly type = FeatureTypeIdentifier.PAD
  public attributes: AttributeCollection = {}
  /**
   * feature index ( order of appearance, 0 is first, reassigned on render )
   */
  public index = 0
  /**
   * x coordinate ( center of pad )
   */
  public x = 0
  /**
   * y coordinate ( center of pad )
   */
  public y = 0
  /**
   * symbol to flash @see Symbols.Symbol
   */
  public symbol: Symbols.Symbol = new Symbols.StandardSymbol({ outer_dia: 0 })
  /**
   * symbol number ( alias for symbol.sym_num.value )
   */
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  /**
   * resize factor ( 1 is normal size )
   */
  public resize_factor = 1
  /**
   * rotation in degrees ( clockwise )
   */
  public rotation = 0
  /**
   * 1 == positive, 0 == negative
   */
  public polarity: Binary = 1
  /**
   * 0 == no mirror, 1 == mirror
   */
  public mirror_x: Binary = 0
  /**
   * 0 == no mirror, 1 == mirror
   */
  public mirror_y: Binary = 0

  constructor(record: Partial<Omit<Pad, 'sym_num' | 'type'>>) {
    Object.assign(this, record)
  }
}

// =================

export type TLine_Record = typeof LINE_RECORD_PARAMETERS_MAP

export class Line implements TLine_Record, IPlotRecord {
  public readonly type = FeatureTypeIdentifier.LINE
  public attributes: AttributeCollection = {}
  /**
   * feature index ( order of appearance, 0 is first, reassigned on render )
   */
  public index = 0
  /**
   * start x
   */
  public xs = 0
  /**
   * start y
   */
  public ys = 0
  /**
   * end x
   */
  public xe = 0
  /**
   * end y
   */
  public ye = 0
  /**
   * symbol to flash @see Symbols.Symbol
   */
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({ outer_dia: 0 })
  /**
   * symbol number ( alias for symbol.sym_num.value )
   */
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  /**
   * 1 == positive, 0 == negative
   */
  public polarity: Binary = 1

  constructor(
    record: Partial<Omit<Line, 'sym_num' | 'type'>>
  ) {
    Object.assign(this, record)
  }
}

// =================

export type TArc_Record = typeof ARC_RECORD_PARAMETERS_MAP

export class Arc implements TArc_Record, IPlotRecord {
  public readonly type = FeatureTypeIdentifier.ARC
  public attributes: AttributeCollection = {}
  /**
   * feature index ( order of appearance, 0 is first, reassigned on render )
   */
  public index = 0
  /**
   * start x
   */
  public xs = 0
  /**
   * start y
   */
  public ys = 0
  /**
   * end x
   */
  public xe = 0
  /**
   * end y
   */
  public ye = 0
  /**
   * center x
   */
  public xc = 0
  /**
   * center y
   */
  public yc = 0
  /**
   * symbol to flash @see Symbols.Symbol
   */
  public symbol: Symbols.StandardSymbol = new Symbols.StandardSymbol({ outer_dia: 0 })
  /**
   * symbol number ( alias for symbol.sym_num.value )
   */
  public get sym_num(): number {
    return this.symbol.sym_num.value
  }
  /**
   * 1 == positive, 0 == negative
   */
  public polarity: Binary = 1
  /**
   * 0 == counter-clockwise, 1 == clockwise
   */
  public clockwise: Binary = 0

  constructor(
    record: Partial<Omit<Arc, 'sym_num' | 'type'>>
  ) {
    Object.assign(this, record)
  }

}

// =================

type TSurface = {
  index: number;
  polarity: number;
  contours: Contour[];
}
type TContour = {
  xs: number;
  ys: number;
  poly_type: number;
  segments: (Contour_Arc_Segment | Contour_Line_Segment)[];
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
  public readonly type = FeatureTypeIdentifier.ARCSEGMENT
  /**
   * end x
   */
  public x = 0
  /**
   * end y
   */
  public y = 0
  /**
   * center x
   */
  public xc = 0
  /**
   * center y
   */
  public yc = 0
  /**
   * 0 == counter-clockwise, 1 == clockwise
   */
  public clockwise: Binary = 0

  constructor(segment: Omit<TContourArcSegment, 'id' | 'type'>) {
    Object.assign(this, segment)
  }
}

export class Contour_Line_Segment implements TContourLineSegment {
  public readonly type = FeatureTypeIdentifier.LINESEGMENT
  /**
   * end x
   */
  public x = 0
  /**
   * end y
   */
  public y = 0

  constructor(segment: Omit<TContourLineSegment, 'id' | 'type'>) {
    Object.assign(this, segment)
  }
}

export class Contour implements TContour {
  public readonly type = FeatureTypeIdentifier.CONTOUR
  /**
   * 1 == island, 0 == hole
   */
  public poly_type: Binary = 1
  /**
   * start x
   */
  public xs = 0
  /**
   * start y
   */
  public ys = 0
  /**
   * contour segments
   */
  public segments: (Contour_Arc_Segment | Contour_Line_Segment)[] = []

  constructor(contour: Partial<IntersectingTypes<Contour, TContour>>) {
    Object.assign(this, contour)
  }

  /**
   * Adds segments to the contour
   * @param segments array of segments to add to the contour
   * @returns this
   */
  public addSegments(segments: (Contour_Arc_Segment | Contour_Line_Segment)[]): this {
    for (const segment of segments) {
      this.addSegment(segment)
    }
    return this
  }

  /**
   * Adds a segment to the contour
   * @param segment segment to add to the contour
   * @returns this
   */
  public addSegment(segment: Contour_Arc_Segment | Contour_Line_Segment): this {
    this.segments.push(segment)
    return this
  }
}

export class Surface implements TSurface, IPlotRecord {
  public readonly type = FeatureTypeIdentifier.SURFACE
  public attributes: AttributeCollection = {}
  public index = 0
  /**
   * 1 == positive, 0 == negative
   */
  public polarity: Binary = 1
  /**
   * contour indicies
   */
  public contours: Contour[] = []

  constructor(record: Partial<IntersectingTypes<Surface, TSurface>>) {
    Object.assign(this, record)
  }

  /**
   * Adds contours to this surface
   * @param contours array of contours
   * @returns this
   */
  public addContours(contours: Contour[]): this {
    for (const c of contours) {
      this.addContour(c)
    }
    return this
  }

  /**
   * Adds a contour to this surface
   * @param contour single contour
   * @returns this
   */
  public addContour(contour: Contour): this {
    this.contours.push(contour)
    return this
  }
}

export class PolyLine implements IPlotRecord {
  public readonly type = FeatureTypeIdentifier.POLYLINE
  public attributes: AttributeCollection = {}
  public index = 0
  /**
   * line width
   */
  public width = 0
  /**
   * 1 == positive, 0 == negative
   */
  public polarity: Binary = 1
  /**
   * line end style: 'round' | 'square' | 'none' ( default 'round' )
   */
  public pathtype: 'round' | 'square' | 'none' = 'round'
  /**
   * line corner style: 'chamfer' | 'round' | 'miter' ( default 'chamfer' )
   */
  public cornertype: 'chamfer' | 'round' | 'miter' = 'chamfer'
  /**
   * start x
   */
  public xs = 0
  /**
   * start y
   */
  public ys = 0
  /**
   * line segments
   */
  public lines: { x: number; y: number }[] = []

  constructor(props: Partial<Omit<PolyLine, 'type'>>) {
    Object.assign(this, props)
  }

  /**
   * adds lines to the polyline
   * @param lines array of line segments
   * @returns this
   */
  public addLines(lines: { x: number; y: number }[]): this {
    for (const line of lines) {
      this.addLine(line)
    }
    return this
  }

  /**
   * adds a line to the polyline
   * @param line line segment to add
   * @returns this
   */
  public addLine(line: { x: number; y: number }): this {
    this.lines.push(line)
    return this
  }
}

export class StepAndRepeat implements IPlotRecord {
  public readonly type = FeatureTypeIdentifier.STEP_AND_REPEAT
  public attributes: AttributeCollection = {}
  /**
   * feature index ( order of appearance, 0 is first, reassigned on render )
   */
  public index = 0
  /**
   * id of the step and repeat
   */
  public id = ''
  /**
   * shapes to repeat
   */
  public shapes: Shape[] = []
  /**
   * transforms to apply to the shapes, each record will copy the shapes and apply the transforms
   */
  public repeats: Transform[] = []

  constructor(props: Partial<Omit<StepAndRepeat, 'type'>>) {
    Object.assign(this, props)
  }
}

export interface TruncatedPad extends Omit<Pad, 'symbol'> {
  symbol: Pick<Symbols.Symbol, 'id'>
}

export type Primitive = Pad | Line | Arc
export type Shape = Primitive | Surface | PolyLine | StepAndRepeat
export type Parents = Omit<StepAndRepeat, 'shapes'> | TruncatedPad

export function getBoundingBoxOfShape(record: Shape | Contour_Arc_Segment | Contour_Line_Segment): BoundingBox {
  let min = vec2.fromValues(Infinity, Infinity)
  let max = vec2.fromValues(-Infinity, -Infinity)
  switch (record.type) {
    case FeatureTypeIdentifier.PAD: {
      const symbolbox = Symbols.getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(record.x, record.y)
      max = vec2.fromValues(record.x, record.y)
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.LINE: {
      const symbolbox = Symbols.getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(Math.min(record.xs, record.xe), Math.min(record.ys, record.ye))
      max = vec2.fromValues(Math.max(record.xs, record.xe), Math.max(record.ys, record.ye))
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.ARC: {
      // TODO: better arc bounding box
      const symbolbox = Symbols.getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(Math.min(record.xs, record.xe, record.xc), Math.min(record.ys, record.ye, record.yc))
      max = vec2.fromValues(Math.max(record.xs, record.xe, record.xc), Math.max(record.ys, record.ye, record.yc))
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.SURFACE: {
      min = vec2.fromValues(Infinity, Infinity)
      max = vec2.fromValues(-Infinity, -Infinity)
      for (const contour of record.contours) {
        const { xs, ys } = contour
        vec2.min(min, min, vec2.fromValues(xs, ys))
        vec2.max(max, max, vec2.fromValues(xs, ys))
        for (const segment of contour.segments) {
          const { min: segment_min, max: segment_max } = getBoundingBoxOfShape(segment)
          vec2.min(min, min, segment_min)
          vec2.max(max, max, segment_max)
        }
      }
      break
    }
    case FeatureTypeIdentifier.POLYLINE: {
      min = vec2.fromValues(Infinity, Infinity)
      max = vec2.fromValues(-Infinity, -Infinity)
      for (const line of record.lines) {
        const { x, y } = line
        vec2.min(min, min, vec2.fromValues(x, y))
        vec2.max(max, max, vec2.fromValues(x, y))
      }
      vec2.add(min, min, vec2.fromValues(-record.width, -record.width))
      vec2.add(max, max, vec2.fromValues(record.width, record.width))
      break
    }
    case FeatureTypeIdentifier.STEP_AND_REPEAT: {
      min = vec2.fromValues(Infinity, Infinity)
      max = vec2.fromValues(-Infinity, -Infinity)
      for (const shape of record.shapes) {
        const { min: shape_min, max: shape_max } = getBoundingBoxOfShape(shape)
        vec2.min(min, min, shape_min)
        vec2.max(max, max, shape_max)
      }
      const minDatum = vec2.fromValues(Infinity, Infinity)
      const maxDatum = vec2.fromValues(-Infinity, -Infinity)
      for (const repeat of record.repeats) {
        const { datum } = repeat
        vec2.min(minDatum, minDatum, datum)
        vec2.max(maxDatum, maxDatum, datum)
      }
      vec2.add(min, min, minDatum)
      vec2.add(max, max, maxDatum)
      break
    }
    case FeatureTypeIdentifier.LINESEGMENT: {
      // TODO: better line segment bounding box
      min = vec2.fromValues(record.x, record.y)
      max = vec2.fromValues(record.x, record.y)
      break
    }
    // } else if (record.type === FeatureTypeIdentifier.ARCSEGMENT) {
    case FeatureTypeIdentifier.ARCSEGMENT: {
      // TODO: better arc segment bounding box
      min = vec2.fromValues(Math.min(record.x, record.xc), Math.min(record.y, record.yc))
      max = vec2.fromValues(Math.max(record.x, record.xc), Math.max(record.y, record.yc))
    }
      break
    default:
      throw new Error('Unknown record type')
  }
  if (isNaN(min[0]) || isNaN(min[1]) || isNaN(max[0]) || isNaN(max[1])) {
    console.warn("Corrupt Feature Bounding Box", record, min, max)
  }
  return { min, max }

}
