// https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf

import { vec3 } from 'gl-matrix'
import { Vector4 } from './vec'

import * as DxfParser from 'dxf-parser'
import * as Shapes from '../../src/renderer/shapes'

import { NURBSCurve } from './curves/NURBSCurve'

type LayerHierarchy = {
  [layerName: string]: {
    shapes: Shapes.Shape[]
    color: vec3
    visible?: boolean
  }
}

function toColor(num: number): vec3 {
  num >>>= 0
  const b = num & 0xff
  const g = (num & 0xff00) >>> 8
  const r = (num & 0xff0000) >>> 16
  // const a = ( (num & 0xFF000000) >>> 24 ) / 255
  // return "rgba(" + [r, g, b, a].join(",") + ")";
  return vec3.fromValues(r, g, b)
}

function addLayer(
  layerHierarchy: LayerHierarchy,
  layerName: string,
  color: number,
  visible: boolean
): void {
  if (!layerHierarchy[layerName]) {
    layerHierarchy[layerName] = {
      shapes: [],
      color: toColor(color),
      visible: visible
    }
  }
}

function ensureLayer(layerHierarchy: LayerHierarchy, layerName: string): void {
  if (!layerHierarchy[layerName]) {
    layerHierarchy[layerName] = {
      shapes: [],
      color: vec3.fromValues(0, 0, 0)
      // color: color
    }
  }
}

export function convert(dxf: DxfParser.IDxf): LayerHierarchy {
  const layerHierarchy: LayerHierarchy = {}

  if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
    for (const [layerName, layer] of Object.entries(dxf.tables.layer.layers)) {
      addLayer(layerHierarchy, layer.name, layer.color, layer.visible)
    }
  }

  for (const entity of dxf.entities) {
    // console.log('entity', JSON.stringify(entity))
    // EntityName = 'POINT' | '3DFACE' | 'ARC' | 'ATTDEF' | 'CIRCLE' | 'DIMENSION' | 'ELLIPSE' | 'INSERT' | 'LINE' | 'LWPOLYLINE' | 'MTEXT' | 'POLYLINE' | 'SOLID' | 'SPLINE' | 'TEXT' | 'VERTEX';
    if (entity.type === 'ARC') {
      const arc = entity as DxfParser.IArcEntity
      if (
        arc.extrusionDirectionX &&
        arc.extrusionDirectionX &&
        (arc.extrusionDirectionX !== 0 || arc.extrusionDirectionY !== 0)
      ) {
        console.warn('ARC extrusionDirection not supported', arc)
        continue
      }
      let cw: 0 | 1 = 0 // Default
      if (!arc.extrusionDirectionZ) {
        cw = 0 // Assume default
      } else if (arc.extrusionDirectionZ === 1) {
        cw = 0
      } else if (arc.extrusionDirectionZ === -1) {
        cw = 1
      } else {
        console.warn('ARC extrusionDirectionZ not supported', arc)
        continue
      }
      const shape = new Shapes.Arc({
        xc: arc.center.x,
        yc: arc.center.y,
        xs: arc.center.x + arc.radius * Math.cos(arc.startAngle),
        ys: arc.center.y + arc.radius * Math.sin(arc.startAngle),
        xe: arc.center.x + arc.radius * Math.cos(arc.endAngle),
        ye: arc.center.y + arc.radius * Math.sin(arc.endAngle),
        clockwise: cw
      })
      ensureLayer(layerHierarchy, entity.layer)
      layerHierarchy[entity.layer].shapes.push(shape)
    } else if (entity.type === 'CIRCLE') {
      const circle = entity as DxfParser.ICircleEntity
      const shape = new Shapes.Arc({
        xc: circle.center.x,
        yc: circle.center.y,
        xs: circle.center.x + circle.radius * Math.cos(0),
        ys: circle.center.y + circle.radius * Math.sin(0),
        xe: circle.center.x + circle.radius * Math.cos(2 * Math.PI),
        ye: circle.center.y + circle.radius * Math.sin(2 * Math.PI)
      })
      ensureLayer(layerHierarchy, entity.layer)
      layerHierarchy[entity.layer].shapes.push(shape)
    } else if (entity.type === 'LINE') {
      const line = entity as DxfParser.ILineEntity
      if (line.vertices.length !== 2) {
        console.warn('LINE vertices.length not supported', line)
        continue
      }
      const shape = new Shapes.Line({
        xs: line.vertices[0].x,
        ys: line.vertices[0].y,
        xe: line.vertices[1].x,
        ye: line.vertices[1].y
      })
      ensureLayer(layerHierarchy, entity.layer)
      layerHierarchy[entity.layer].shapes.push(shape)
    } else if (entity.type === 'SPLINE') {
      const spline = entity as DxfParser.ISplineEntity

      // NURBS curve

      const nurbsControlPoints: Vector4[] = []
      const nurbsKnots: number[] = []
      const nurbsDegree = spline.degreeOfSplineCurve

      for (const nurbsKnot of spline.knotValues) {
        nurbsKnots.push(nurbsKnot)
      }

      if (spline.controlPoints) {
        for (const controlPoint of spline.controlPoints) {
          if (controlPoint.z === undefined || controlPoint.z != 0) {
            console.warn('controlPoint.z not supported', controlPoint)
          }
          nurbsControlPoints.push(
            new Vector4(
              controlPoint.x,
              controlPoint.y,
              controlPoint.z,
              1 // weight of control point: higher means stronger attraction
            )
          )
        }
      }

      const nurbsCurve: NURBSCurve = new NURBSCurve(nurbsDegree, nurbsKnots, nurbsControlPoints)

      const points = nurbsCurve.getPoints(20)
      // console.log('nurbsGeometry', JSON.stringify(points))

      // convert 3d points to 2d points
      const lines: { x: number; y: number }[] = []
      for (const point of points) {
        lines.push({
          x: point.x,
          y: point.y
        })
      }
      const shape = new Shapes.PolyLine({
        // Start point.
        xs: lines[0].x,
        ys: lines[0].y,
        polarity: 1
        // width: width
      }).addLines(lines)

      ensureLayer(layerHierarchy, entity.layer)
      layerHierarchy[entity.layer].shapes.push(shape)
    } else if (entity.type === 'POLYLINE') {
      const polyline = entity as DxfParser.IPolylineEntity
      if (polyline.vertices.length < 2) {
        console.warn('POLYLINE vertices.length not supported', polyline)
        continue
      }
      const lines: { x: number; y: number }[] = []
      for (const vertex of polyline.vertices) {
        lines.push({
          x: vertex.x,
          y: vertex.y
        })
      }
      const shape = new Shapes.PolyLine({
        // Start point.
        xs: lines[0].x,
        ys: lines[0].y,
        polarity: 1
        // width: width
      }).addLines(lines)
      ensureLayer(layerHierarchy, entity.layer)
      layerHierarchy[entity.layer].shapes.push(shape)
    } else if (entity.type === 'POINT') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === '3DFACE') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'ATTDEF') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'DIMENSION') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'ELLIPSE') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'INSERT') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'LWPOLYLINE') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'MTEXT') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'SOLID') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'TEXT') {
      console.warn('entity type not supported', entity) // TODO: support
    } else if (entity.type === 'VERTEX') {
      console.warn('entity type not supported', entity) // TODO: support
    } else {
      console.warn('entity type not supported', entity)
    }
  }

  return layerHierarchy
}
