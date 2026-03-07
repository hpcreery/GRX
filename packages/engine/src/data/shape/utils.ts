import { type BoundingBox, ContourSegmentTypeIdentifier, FeatureTypeIdentifier, type Units } from "@src/types"
import { baseUnitsConversionFactor } from "@src/utils"
import { vec2 } from "gl-matrix"
import type { Contour_Arc_Segment, Contour_Line_Segment, Shape } from "./shape"
import * as SymbolUtils from "./symbol/utils"
import { convertSymbolUnits } from "./symbol/utils"

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
 * Gets the bounding box of a shape or contour segment. Units are not converted from the shape's units.
 * Ensure the shape and its symbols are in the same units before calling this function.
 * @param record shape or contour segment
 * @returns bounding box of the shape or contour segment
 */
export function getBoundingBoxOfShape(record: Shape | Contour_Arc_Segment | Contour_Line_Segment): BoundingBox {
  let min = vec2.fromValues(Infinity, Infinity)
  let max = vec2.fromValues(-Infinity, -Infinity)
  switch (record.type) {
    case FeatureTypeIdentifier.PAD: {
      const symbolbox = SymbolUtils.getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(record.x, record.y)
      max = vec2.fromValues(record.x, record.y)
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.LINE: {
      const symbolbox = SymbolUtils.getBoundingBoxOfSymbol(record.symbol)
      min = vec2.fromValues(Math.min(record.xs, record.xe), Math.min(record.ys, record.ye))
      max = vec2.fromValues(Math.max(record.xs, record.xe), Math.max(record.ys, record.ye))
      vec2.add(min, symbolbox.min, min)
      vec2.add(max, symbolbox.max, max)
      break
    }
    case FeatureTypeIdentifier.ARC: {
      // TODO: better arc bounding box
      const symbolbox = SymbolUtils.getBoundingBoxOfSymbol(record.symbol)
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
    case ContourSegmentTypeIdentifier.LINESEGMENT: {
      // TODO: better line segment bounding box
      min = vec2.fromValues(record.x, record.y)
      max = vec2.fromValues(record.x, record.y)
      break
    }
    // } else if (record.type === FeatureTypeIdentifier.ARCSEGMENT) {
    case ContourSegmentTypeIdentifier.ARCSEGMENT:
      {
        // TODO: better arc segment bounding box
        min = vec2.fromValues(Math.min(record.x, record.xc), Math.min(record.y, record.yc))
        max = vec2.fromValues(Math.max(record.x, record.xc), Math.max(record.y, record.yc))
      }
      break
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
