import { vec2 } from "gl-matrix"
import type { Contour_Arc_Segment, Contour_Line_Segment, Shape } from "./shape"
import type { MacroSymbol, StandardSymbol, Symbols } from "./symbol"
import { type BoundingBox, ContourSegmentTypeIdentifier, FeatureTypeIdentifier, SymbolTypeIdentifier, type Units } from "./types"

export type immutable = boolean | number | bigint | string | symbol | null | undefined

export type ptr<T extends immutable> = { value: T }

export function ptr<T extends immutable>(read: () => T, write: (v: T) => void): ptr<T> {
  return {
    get value(): T {
      return read()
    },
    set value(v) {
      write(v)
    },
  }
}

export function malloc<T extends immutable>(value: T): ptr<T> {
  let i: T = value
  return ptr(
    () => i,
    (v) => {
      i = v
    },
  )
}

export function getBoundingBoxOfSymbol(symbol: StandardSymbol | MacroSymbol): BoundingBox {
  const min: vec2 = vec2.fromValues(0, 0)
  const max: vec2 = vec2.fromValues(0, 0)
  if (symbol.type === SymbolTypeIdentifier.SYMBOL_DEFINITION) {
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
  return { min, max }
}

/**
 * Convert the units of a symbol to the specified units.
 * This modifies the symbol in place and also returns it.
 * @param symbol symbol to convert
 * @param units units to convert to
 * @returns converted symbol
 */
export function convertSymbolUnits(symbol: Symbols, units: Units): Symbols {
  if (symbol.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
    for (const shape of symbol.shapes) {
      convertShapeUnits(shape, units)
    }
  } else {
    const factor = baseUnitsConversionFactor(symbol.units) / baseUnitsConversionFactor(units)
    if (factor === 1) return symbol
    symbol.width *= factor
    symbol.height *= factor
    symbol.corner_radius *= factor
    // "corners",
    symbol.outer_dia *= factor
    symbol.inner_dia *= factor
    symbol.line_width *= factor
    symbol.line_length *= factor
    // "angle",
    symbol.gap *= factor
    // "num_spokes",
    // "round",
    symbol.cut_size *= factor
    symbol.ring_width *= factor
    symbol.ring_gap *= factor
    // "num_rings",
    symbol.units = units
  }
  return symbol
}

/**
 * Convert the units of a shape and its symbols to the specified units.
 * This modifies the shape in place and also returns it.
 * @param shape shape to convert
 * @param units units to convert to
 */
export function convertShapeUnits(shape: Shape, units: Units): Shape {
  const factor = baseUnitsConversionFactor(shape.units) / baseUnitsConversionFactor(units)
  switch (shape.type) {
    case FeatureTypeIdentifier.PAD:
      shape.x *= factor
      shape.y *= factor
      shape.units = units
      convertSymbolUnits(shape.symbol, units)
      break
    case FeatureTypeIdentifier.LINE:
      shape.xs *= factor
      shape.ys *= factor
      shape.xe *= factor
      shape.ye *= factor
      shape.units = units
      convertSymbolUnits(shape.symbol, units)
      break
    case FeatureTypeIdentifier.ARC:
      shape.xs *= factor
      shape.ys *= factor
      shape.xe *= factor
      shape.ye *= factor
      shape.xc *= factor
      shape.yc *= factor
      shape.units = units
      convertSymbolUnits(shape.symbol, units)
      break
    case FeatureTypeIdentifier.SURFACE:
      for (const contour of shape.contours) {
        contour.xs *= factor
        contour.ys *= factor
        for (const segment of contour.segments) {
          switch (segment.type) {
            case ContourSegmentTypeIdentifier.LINESEGMENT:
              segment.x *= factor
              segment.y *= factor
              break
            case ContourSegmentTypeIdentifier.ARCSEGMENT:
              segment.x *= factor
              segment.y *= factor
              segment.xc *= factor
              segment.yc *= factor
              break
          }
        }
      }
      shape.units = units
      break
    case FeatureTypeIdentifier.POLYLINE:
      shape.xs *= factor
      shape.ys *= factor
      for (const line of shape.lines) {
        line.x *= factor
        line.y *= factor
      }
      shape.width *= factor
      shape.units = units
      break
    case FeatureTypeIdentifier.STEP_AND_REPEAT:
      for (const repeat of shape.repeats) {
        repeat.datum[0] *= factor
        repeat.datum[1] *= factor
      }
      for (const s of shape.shapes) {
        convertShapeUnits(s, units)
      }
      shape.units = units
      break
    case FeatureTypeIdentifier.DATUM_POINT:
      shape.x *= factor
      shape.y *= factor
      shape.units = units
      break
    case FeatureTypeIdentifier.DATUM_TEXT:
      shape.x *= factor
      shape.y *= factor
      shape.units = units
      break
    case FeatureTypeIdentifier.DATUM_LINE:
      shape.xs *= factor
      shape.ys *= factor
      shape.xe *= factor
      shape.ye *= factor
      shape.units = units
      convertSymbolUnits(shape.symbol, units)
      break
    case FeatureTypeIdentifier.DATUM_ARC:
      shape.xs *= factor
      shape.ys *= factor
      shape.xe *= factor
      shape.ye *= factor
      shape.xc *= factor
      shape.yc *= factor
      shape.units = units
      convertSymbolUnits(shape.symbol, units)
      break
  }
  return shape
}

/**
 * Computes the exact bounding box of a circular arc (or full circle when start and end coincide).
 * @param center arc center
 * @param start arc start point
 * @param end arc end point
 * @param clockwise sweep direction, 1 = clockwise, 0 = counter-clockwise
 * @returns bounding box of the arc
 */
export function getArcBoundingBox(center: vec2, start: vec2, end: vec2, clockwise: 0 | 1): BoundingBox {
  const [xc, yc] = center
  const [xs, ys] = start
  const [xe, ye] = end

  const min = vec2.fromValues(Math.min(xs, xe), Math.min(ys, ye))
  const max = vec2.fromValues(Math.max(xs, xe), Math.max(ys, ye))

  const radius = Math.hypot(xs - xc, ys - yc)
  if (radius === 0) return { min, max }

  // start and end coincide: treat as a full circle
  if (Math.abs(xs - xe) < 1e-9 && Math.abs(ys - ye) < 1e-9) {
    return { min: vec2.fromValues(xc - radius, yc - radius), max: vec2.fromValues(xc + radius, yc + radius) }
  }

  const startAngle = Math.atan2(ys - yc, xs - xc)
  let endAngle = Math.atan2(ye - yc, xe - xc)

  // normalize so the sweep from startAngle to endAngle travels in the arc's direction
  if (clockwise) {
    if (endAngle > startAngle) endAngle -= 2 * Math.PI
  } else {
    if (endAngle < startAngle) endAngle += 2 * Math.PI
  }

  const isAngleSwept = (angle: number): boolean => {
    for (const candidate of [angle - 2 * Math.PI, angle, angle + 2 * Math.PI]) {
      if (clockwise ? candidate <= startAngle && candidate >= endAngle : candidate >= startAngle && candidate <= endAngle) return true
    }
    return false
  }

  // extremes of the circle at each cardinal direction, included only if the arc sweeps through them
  const cardinals: [angle: number, point: vec2][] = [
    [0, vec2.fromValues(xc + radius, yc)],
    [Math.PI / 2, vec2.fromValues(xc, yc + radius)],
    [Math.PI, vec2.fromValues(xc - radius, yc)],
    [-Math.PI / 2, vec2.fromValues(xc, yc - radius)],
  ]
  for (const [angle, point] of cardinals) {
    if (isAngleSwept(angle)) {
      vec2.min(min, min, point)
      vec2.max(max, max, point)
    }
  }

  return { min, max }
}

/**
 * Gets the bounding box of a shape or contour segment. Units are not converted from the shape's units.
 * Ensure the shape and its symbols are in the same units before calling this function.
 * @param record shape or contour segment
 * @param start start point of the segment, only used for contour arc segments
 * @returns bounding box of the shape or contour segment
 */
export function getBoundingBoxOfShape(record: Shape | Contour_Arc_Segment | Contour_Line_Segment, start?: vec2): BoundingBox {
  let min = vec2.fromValues(Infinity, Infinity)
  let max = vec2.fromValues(-Infinity, -Infinity)
  switch (record.type) {
    case FeatureTypeIdentifier.PAD: {
      const symbolbox = getBoundingBoxOfSymbol(record.symbol)
      const scale = record.resize_factor
      const mirrorX = record.mirror_x ? -1 : 1
      const mirrorY = record.mirror_y ? -1 : 1
      const angle = record.rotation * (Math.PI / 180)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      // symbol corners are transformed scale -> mirror -> rotate, matching the pad's render order
      const corners = [
        vec2.fromValues(symbolbox.min[0], symbolbox.min[1]),
        vec2.fromValues(symbolbox.max[0], symbolbox.min[1]),
        vec2.fromValues(symbolbox.max[0], symbolbox.max[1]),
        vec2.fromValues(symbolbox.min[0], symbolbox.max[1]),
      ]

      min = vec2.fromValues(Infinity, Infinity)
      max = vec2.fromValues(-Infinity, -Infinity)
      for (const corner of corners) {
        const x = corner[0] * scale * mirrorX
        const y = corner[1] * scale * mirrorY
        const rotated = vec2.fromValues(x * cos - y * sin, x * sin + y * cos)
        vec2.min(min, min, rotated)
        vec2.max(max, max, rotated)
      }

      vec2.add(min, min, vec2.fromValues(record.x, record.y))
      vec2.add(max, max, vec2.fromValues(record.x, record.y))
      break
    }
    case FeatureTypeIdentifier.LINE: {
      const symbolbox = getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(Math.min(record.xs, record.xe), Math.min(record.ys, record.ye))
      max = vec2.fromValues(Math.max(record.xs, record.xe), Math.max(record.ys, record.ye))
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.ARC: {
      const symbolbox = getBoundingBoxOfSymbol(record.symbol)
      const arcbox = getArcBoundingBox(
        vec2.fromValues(record.xc, record.yc),
        vec2.fromValues(record.xs, record.ys),
        vec2.fromValues(record.xe, record.ye),
        record.clockwise,
      )
      min = arcbox.min
      max = arcbox.max
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
        let current = vec2.fromValues(xs, ys)
        for (const segment of contour.segments) {
          const { min: segment_min, max: segment_max } = getBoundingBoxOfShape(segment, current)
          vec2.min(min, min, segment_min)
          vec2.max(max, max, segment_max)
          current = vec2.fromValues(segment.x, segment.y)
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
    case ContourSegmentTypeIdentifier.LINESEGMENT: {
      min = vec2.fromValues(record.x, record.y)
      max = vec2.fromValues(record.x, record.y)
      break
    }
    case ContourSegmentTypeIdentifier.ARCSEGMENT: {
      const segmentStart = start ?? vec2.fromValues(record.x, record.y)
      const arcbox = getArcBoundingBox(vec2.fromValues(record.xc, record.yc), segmentStart, vec2.fromValues(record.x, record.y), record.clockwise)
      min = arcbox.min
      max = arcbox.max
      break
    }
    case FeatureTypeIdentifier.DATUM_LINE:
    case FeatureTypeIdentifier.DATUM_POINT:
    case FeatureTypeIdentifier.DATUM_TEXT:
    case FeatureTypeIdentifier.DATUM_ARC:
      break
    default:
      console.warn("Unknown record type", record)
      break
  }
  if (Number.isNaN(min[0]) || Number.isNaN(min[1]) || Number.isNaN(max[0]) || Number.isNaN(max[1])) {
    console.warn("Corrupt Feature Bounding Box", record, min, max)
  }
  return { min, max }
}

/**
 * Converts various units to millimeters (mm)
 * @param units Units to convert from. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
 * @returns Conversion factor to mm
 */
export function baseUnitsConversionFactor(units: Units): number {
  switch (units) {
    case "mm":
      return 1
    case "inch":
      return 25.4
    case "cm":
      return 10
    case "mil":
      return 25.4 / 1000
    default:
      return units
  }
}
