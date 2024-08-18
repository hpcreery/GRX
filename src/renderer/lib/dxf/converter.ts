// https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf

import { vec2, vec3 } from "gl-matrix"
import { Vector4 } from "./vec"

import * as DxfParser from "dxf-parser"
import * as Shapes from "../../src/renderer/shapes"

import { NURBSCurve } from "./curves/NURBSCurve"

type Layers = {
  [layerName: string]: {
    shapes: Shapes.Shape[]
    color: vec3
    visible?: boolean
  }
}

type Blocks = {
  [blockName: string]: {
    shapes: Shapes.Shape[]
    position: vec2
    // color: vec3
    // layer: string
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

function addLayer(layers: Layers, layerName: string, color: number, visible: boolean): void {
  if (!layers[layerName]) {
    layers[layerName] = {
      shapes: [],
      color: toColor(color),
      visible: visible,
    }
  }
}

function ensureLayer(layers: Layers, layerName: string): void {
  if (!layers[layerName]) {
    layers[layerName] = {
      shapes: [],
      color: vec3.fromValues(0, 0, 0),
    }
  }
}

// function unsupported(
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   attribute: any,
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   check: (a: any) => boolean,
//   message: string
// ): boolean {
//   if (check(attribute)) {
//     console.warn('DXF entity/attribute not supported:', message, attribute)
//     return true
//   }
//   return false
// }

function parseEntity(entity: DxfParser.IEntity, blocks: Blocks): Shapes.Shape | undefined {
  // console.log('entity', JSON.stringify(entity))
  // EntityName = 'POINT' | '3DFACE' | 'ARC' | 'ATTDEF' | 'CIRCLE' | 'DIMENSION' | 'ELLIPSE' | 'INSERT' | 'LINE' | 'LWPOLYLINE' | 'MTEXT' | 'POLYLINE' | 'SOLID' | 'SPLINE' | 'TEXT' | 'VERTEX';
  if (entity.type === "ARC") {
    const arc = entity as DxfParser.IArcEntity
    if (arc.extrusionDirectionX && arc.extrusionDirectionX && (arc.extrusionDirectionX !== 0 || arc.extrusionDirectionY !== 0)) {
      console.warn("ARC extrusionDirection not supported", arc)
      // return
    }
    let cw: 0 | 1 = 0 // Default
    if (!arc.extrusionDirectionZ) {
      cw = 0 // Assume default
    } else if (arc.extrusionDirectionZ === 1) {
      cw = 0
    } else if (arc.extrusionDirectionZ === -1) {
      cw = 1
    } else {
      console.warn("ARC extrusionDirectionZ not supported. Flattening to 0.", arc)
      // return
    }
    const shape = new Shapes.Arc({
      xc: arc.center.x,
      yc: arc.center.y,
      xs: arc.center.x + arc.radius * Math.cos(arc.startAngle),
      ys: arc.center.y + arc.radius * Math.sin(arc.startAngle),
      xe: arc.center.x + arc.radius * Math.cos(arc.endAngle),
      ye: arc.center.y + arc.radius * Math.sin(arc.endAngle),
      clockwise: cw,
    })
    return shape
  } else if (entity.type === "CIRCLE") {
    const circle = entity as DxfParser.ICircleEntity
    const shape = new Shapes.Arc({
      xc: circle.center.x,
      yc: circle.center.y,
      xs: circle.center.x + circle.radius * Math.cos(0),
      ys: circle.center.y + circle.radius * Math.sin(0),
      xe: circle.center.x + circle.radius * Math.cos(2 * Math.PI),
      ye: circle.center.y + circle.radius * Math.sin(2 * Math.PI),
    })
    return shape
  } else if (entity.type === "LINE") {
    const line = entity as DxfParser.ILineEntity
    if (line.vertices.length !== 2) {
      console.warn("LINE vertices.length not supported", line)
      return
    }
    const shape = new Shapes.Line({
      xs: line.vertices[0].x,
      ys: line.vertices[0].y,
      xe: line.vertices[1].x,
      ye: line.vertices[1].y,
    })
    return shape
  } else if (entity.type === "SPLINE") {
    const spline = entity as DxfParser.ISplineEntity

    // Fit Points Spline

    // console.log('spline', JSON.stringify(spline))
    if (spline.numberOfKnots === 0 || spline.numberOfFitPoints !== 0) {
      console.warn("fit point SPLINE not supported", spline)
      // TODO: spline from fit points only
      // https://github.com/mrdoob/three.js/blob/master/src/extras/curves/SplineCurve.js
      return
    }

    // Control Points Spline (NURBS)

    const nurbsControlPoints: Vector4[] = []
    const nurbsKnots: number[] = []
    const nurbsDegree = spline.degreeOfSplineCurve

    if (spline.controlPoints) {
      for (const nurbsKnot of spline.knotValues) {
        nurbsKnots.push(nurbsKnot)
      }
      for (const controlPoint of spline.controlPoints) {
        if (controlPoint.z === undefined || controlPoint.z != 0) {
          console.warn("controlPoint.z not supported. Flattening to 0.", controlPoint)
          // continue
        }
        nurbsControlPoints.push(
          new Vector4(
            controlPoint.x,
            controlPoint.y,
            0, // controlPoint.z,
            1, // weight of control point: higher means stronger attraction
          ),
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
        y: point.y,
      })
    }
    const shape = new Shapes.PolyLine({
      // Start point.
      xs: lines[0].x,
      ys: lines[0].y,
      polarity: 1,
      // width: width
    }).addLines(lines)

    return shape
  } else if (entity.type === "POLYLINE") {
    const polyline = entity as DxfParser.IPolylineEntity
    if (polyline.vertices.length < 2) {
      console.warn("POLYLINE vertices.length < 2 not supported", polyline)
      return
    }
    if (
      polyline.is3dPolyline ||
      polyline.is3dPolygonMesh ||
      polyline.is3dPolygonMeshClosed ||
      polyline.extrusionDirection ||
      polyline.isPolyfaceMesh
    ) {
      console.warn("POLYLINE 3D not supported", polyline)
      // return
    }
    if (polyline.hasContinuousLinetypePattern) {
      // Linetype pattern is continuous but is not supported. Silently ignore.
      // console.warn('POLYLINE Shape not supported', polyline)
      // continue
    }
    const lines: { x: number; y: number }[] = []
    for (const vertex of polyline.vertices) {
      if (vertex.z === undefined || vertex.z != 0) {
        console.warn("vertex.z != 0 not supported. Flattening to 0.", vertex)
      }
      if (vertex.curveFitTangent || vertex.curveFittingVertex || vertex.splineVertex || vertex.splineControlPoint || vertex.bulge) {
        console.warn("advanced vertex not supported", vertex)
        // continue
      }
      if (vertex.threeDPolylineMesh || vertex.threeDPolylineVertex || vertex.polyfaceMeshVertex) {
        console.warn("3D vertex not supported", vertex)
        // continue
      }
      lines.push({
        x: vertex.x,
        y: vertex.y,
      })
    }
    const shape = new Shapes.PolyLine({
      // Start point.
      xs: lines[0].x,
      ys: lines[0].y,
      polarity: 1,
      width: polyline.thickness || 0, // TODO: verify
    }).addLines(lines)
    return shape
  } else if (entity.type === "INSERT") {
    const insert = entity as DxfParser.IInsertEntity
    const referenceBlock = blocks[insert.name]
    if (!referenceBlock) {
      console.warn("DXF INSERT referenceBlock not found", insert)
      return
    }
    if (insert.xScale !== insert.yScale) {
      console.warn("DXF INSERT xScale !== yScale not supported", insert)
      return
    }

    const origin = vec2.fromValues(insert.position.x, insert.position.y)
    const cols = insert.columnCount || 1
    const rows = insert.rowCount || 1

    const repeats: Shapes.StepAndRepeat["repeats"] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        repeats.push({
          datum: vec2.add(vec2.create(), origin, vec2.fromValues(i * insert.columnSpacing || 0, j * insert.rowSpacing || 0)),
          rotation: insert.rotation || 0,
          scale: insert.xScale || 1,
          mirror_x: 0,
          mirror_y: 0,
          // order: ['mirror', 'translate', 'rotate', 'scale']
        })
      }
    }

    const shape = new Shapes.StepAndRepeat({
      shapes: referenceBlock.shapes,
      repeats: repeats,
    })

    return shape
  } else if (entity.type === "LWPOLYLINE") {
    const lwpolyline = entity as DxfParser.ILwpolylineEntity
    if (lwpolyline.vertices.length < 2) {
      console.warn("LWPOLYLINE vertices.length < 2 not supported", lwpolyline)
      return
    }
    if (lwpolyline.elevation !== 0) {
      console.warn("LWPOLYLINE elevation not supported", lwpolyline)
    }
    const lines: { x: number; y: number }[] = []
    for (const vertex of lwpolyline.vertices) {
      if (vertex.z === undefined || vertex.z != 0) {
        console.warn("vertex.z != 0 not supported. Flattening to 0.", vertex)
      }
      if (vertex.bulge) {
        console.warn("advanced vertex not supported", vertex)
        // continue
      }
      if (vertex.startWidth || vertex.endWidth || vertex.startWidth !== vertex.endWidth) {
        console.warn("vertex.startWidth !== vertex.endWidth not supported", vertex)
        // continue
      }
      lines.push({
        x: vertex.x,
        y: vertex.y,
      })
    }
    const shape = new Shapes.PolyLine({
      // Start point.
      xs: lines[0].x,
      ys: lines[0].y,
      polarity: 1,
      width: lwpolyline.width || 0, // TODO: verify
    }).addLines(lines)
    return shape
  } else if (entity.type === "POINT") {
    // console.warn('entity type not supported', entity)
  } else if (entity.type === "VERTEX") {
    // console.warn('DXF entity type not supported', entity)
  } else if (entity.type === "3DFACE") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else if (entity.type === "ATTDEF") {
    console.warn("DXF entity type not supported", entity) // TODO: support when GRX supports shape attrubutes
  } else if (entity.type === "DIMENSION") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else if (entity.type === "ELLIPSE") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else if (entity.type === "MTEXT") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else if (entity.type === "SOLID") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else if (entity.type === "TEXT") {
    console.warn("DXF entity type not supported", entity) // TODO: support
  } else {
    console.warn("DXF entity type not supported", entity)
  }
  return
  // }
}

export function convert(dxf: DxfParser.IDxf): Layers {
  const layers: Layers = {}
  const blocks: Blocks = {}

  // Parse layers
  if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
    for (const [_layerName, layer] of Object.entries(dxf.tables.layer.layers)) {
      addLayer(layers, layer.name, layer.color, layer.visible)
    }
  }

  // Parse blocks
  if (dxf.tables && dxf.blocks) {
    for (const [_blockName, block] of Object.entries(dxf.blocks)) {
      blocks[block.name] = {
        shapes: [],
        position: vec2.fromValues(block.position.x, block.position.y),
      }
      // console.log('block', JSON.stringify(block))
      if (!block.entities) continue
      for (const entity of block.entities) {
        const shape = parseEntity(entity, blocks)
        if (shape) {
          ensureLayer(layers, entity.layer)
          blocks[block.name].shapes.push(shape)
        }
      }
    }
  }

  // Parse entities
  if (dxf.entities) {
    for (const entity of dxf.entities) {
      const shape = parseEntity(entity, blocks)
      if (shape) {
        ensureLayer(layers, entity.layer)
        layers[entity.layer].shapes.push(shape)
      }
    }
  }

  return layers
}

export function getUnits(dxf: DxfParser.IDxf): "inch" | "mm" {
  let units: "inch" | "mm" = "inch"
  // check if $INSUNITS exists
  if (dxf.header && Object.keys(dxf.header).includes("$INSUNITS")) {
    units = dxf.header["$INSUNITS"] === 1 ? "inch" : dxf.header["$INSUNITS"] === 4 ? "mm" : "inch"
  } else {
    console.warn("No $INSUNITS found, defaulting to inches")
  }
  return units
}
