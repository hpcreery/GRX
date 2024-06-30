// https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf

import { vec2 } from 'gl-matrix'

import * as DxfParser from 'dxf-parser';
import * as Shapes from '../../src/renderer/shapes'

type LayerHierarchy = {
  [layer: string]: {
    shapes: Shapes.Shape[]
  }
}

function ensureLayer(layerHierarchy: LayerHierarchy, layer: string): void {
  if (!layerHierarchy[layer]) {
    layerHierarchy[layer] = {
      shapes: []
    }
  }
}

export function convert(dxf: DxfParser.IDxf): LayerHierarchy {

  const layerHierarchy: LayerHierarchy = {}

  for (const entity of dxf.entities) {
    console.log('entity', JSON.stringify(entity))
    // EntityName = 'POINT' | '3DFACE' | 'ARC' | 'ATTDEF' | 'CIRCLE' | 'DIMENSION' | 'ELLIPSE' | 'INSERT' | 'LINE' | 'LWPOLYLINE' | 'MTEXT' | 'POLYLINE' | 'SOLID' | 'SPLINE' | 'TEXT' | 'VERTEX';
    if (entity.type === 'ARC') {
      const arc = entity as DxfParser.IArcEntity
      if (arc.extrusionDirectionX && arc.extrusionDirectionX && (arc.extrusionDirectionX !== 0 || arc.extrusionDirectionY !== 0)) {
        console.warn('ARC extrusionDirection not supported', arc)
        continue
      }
      let cw: 0|1 = 0 // Default
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
        ye: circle.center.y + circle.radius * Math.sin(2 * Math.PI),
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
    // } else if (entity.type === 'SPLINE') {
    //   const spline = entity as DxfParser.ISplineEntity
      // const control_points = spline.controlPoints.map((cp) => {
      //   return new Shapes.ControlPoint({
      //     x: cp.x,
      //     y: cp.y
      //   })
      // })
      // const shape = new Shapes.Spline({
      //   control_points: control_points
      // })
      // ensureLayer(layerHierarchy, entity.layer)
      // layerHierarchy[entity.layer].shapes.push(shape)
    } else {
      console.warn('entity type not supported', entity)
    }
  }


  return layerHierarchy
}
