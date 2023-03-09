import type {
  ImageGraphic,
  ImageShape,
  ImagePath,
  ImageRegion,
  PathSegment,
  Shape,
  LayeredShape,
} from '@tracespace/plotter'
import {
  BoundingBox,
  positionsEqual,
  IMAGE_SHAPE,
  IMAGE_PATH,
  CIRCLE,
  RECTANGLE,
  POLYGON,
  OUTLINE,
  LAYERED_SHAPE,
  LINE,
} from '@tracespace/plotter'

import * as PIXI from 'pixi.js'
import { mas } from 'process'

import * as Tess2 from 'tess2-ts'

import type { PathProps } from './types'

let alpha: number = 0.7

export function renderGraphic(node: ImageGraphic): CustomGraphics {
  if (node.type === IMAGE_SHAPE) {
    const graphic = new CustomGraphics()
    graphic.beginFill(0xffffff, alpha)
    // console.log('RENDERING IMAGE_SHAPE: ', node)
    graphic.renderShape(node)
    graphic.endFill()
    return graphic
  } else {
    const graphic = new CustomGraphics()
    const props: PathProps =
      node.type === IMAGE_PATH
        ? { strokeWidth: node.width, fill: 'none' }
        : { strokeWidth: 0, fill: '' }
    // console.log('RENDERING PATH: ', node, props)
    const { strokeWidth, fill } = props
    if (fill != 'none') {
      graphic.beginFill(0xffffff, alpha)
    } else {
      graphic.beginFill(0xffffff, 0)
    }
    if (strokeWidth != 0) {
      graphic.lineStyle({
        width: strokeWidth,
        color: 0xffffff,
        alpha: alpha,
        cap: PIXI.LINE_CAP.ROUND,
      })
    } else {
      graphic.lineStyle({
        width: 0,
        color: 0xffffff,
        alpha: 0,
        cap: PIXI.LINE_CAP.ROUND,
      })
    }
    graphic.drawPath(node.segments, props)
    return graphic
  }
}

export class CustomGraphics extends PIXI.Graphics {
  constructor() {
    super()
    this.scale = new PIXI.Point(3, -3)
    this.interactive = true
    // TODO: Draw featuers with more vertices
  }

  renderShape(node: ImageShape): this {
    const { shape } = node
    return this.shapeToElement(shape)
  }

  shapeToElement(shape: Shape): this {
    switch (shape.type) {
      case CIRCLE: {
        // console.log('RENDERING CIRCLE: ', shape)
        const { cx, cy, r } = shape
        this.drawCircle(cx, cy, r)
        return this
      }

      case RECTANGLE: {
        // console.log('RENDERING RECTANGLE: ', shape)
        const { x, y, xSize: width, ySize: height, r } = shape
        this.drawRoundedRect(x, y, width, height, r ? r : 0)
        return this
      }

      case POLYGON: {
        // console.log('RENDERING POLYGON: ', shape)
        this.drawPolygon(shape.points.flat().map((point) => point))
        return this
      }

      case OUTLINE: {
        // console.log('RENDERING OUTLINE (development): ', shape)
        this.drawPath(shape.segments, { strokeWidth: 0, fill: '' })
        return this
      }

      case LAYERED_SHAPE: {
        // console.log('RENDERING LAYERED_SHAPE (development): ', shape)
        const boundingBox = BoundingBox.fromShape(shape)
        let container: PIXI.Container = new PIXI.Container()

        if (BoundingBox.isEmpty(boundingBox)) {
          return this
        }

        for (const [index, layerShape] of shape.shapes.entries()) {
          if (layerShape.erase === true) {
            let maskGraphic = new CustomGraphics()
            maskGraphic.beginFill(0xffffff, 1)
            maskGraphic.drawRect(
              boundingBox[0],
              boundingBox[1],
              boundingBox[2] - boundingBox[0],
              boundingBox[3] - boundingBox[1]
            )
            maskGraphic.beginHole()
            maskGraphic.shapeToElement(layerShape)
            maskGraphic.endHole()
            maskGraphic.endFill()
            container.mask = maskGraphic
            container.addChild(maskGraphic)
            let containernew = new PIXI.Container()
            containernew.addChild(container)
            container = containernew
          } else {
            let graphic = new CustomGraphics()
            graphic.beginFill(0xffffff, alpha)
            graphic.shapeToElement(layerShape)
            graphic.endFill()
            container.addChild(graphic)
          }
        }
        this.addChild(container)
        return this
      }

      default: {
        // TODO: Implement this
        console.log('RENDERING DEFAULT (development): ', shape)
        // this.drawRect(50, 50, 100, 100)
        return this
      }
    }
  }

  public drawPath(segments: PathSegment[], props: PathProps): this {
    for (const [index, next] of segments.entries()) {
      // console.log("DRAWING PATH SEGMENT: ", next)
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next

      if (previous === undefined || this._lineStyle.width != 0) {
        // console.log("DRAWING MOVING TO: ", next, this)
        this.moveTo(start[0], start[1])
      } else if (!positionsEqual(previous.end, start)) {
        // NEED TO MOVE TO SO TESSELLATION WORKS WITH ODD EVEN RULE
        this.lineTo(start[0], start[1])
      }

      if (next.type === LINE) {
        // this.lineStyle(1, 0x00ff00)
        // console.log("DRAWING LINE: ", next, this)
        this.lineTo(end[0], end[1])
      } else {
        // this.lineStyle(1, 0xff00ff)
        // console.log("DRAWING ARC: ", next, this)
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        // console.log("DRAWING ARC: ", next, this, c)
        this.arc(center[0], center[1], radius, start[2], end[2], c > 0)
      }
    }
    return this
  }

  render(r: PIXI.Renderer) {
    PIXI.graphicsUtils.buildPoly.triangulate = triangulate
    super.render(r)
  }
}

// This is a hack to get PIXI to use the Tess2 library for triangulation. REQUIRED
// implemented by extending the graphics library and overriding the triangulate function
// ``` js
// render(r: PIXI.Renderer) {
//   PIXI.graphicsUtils.buildPoly.triangulate = triangulate
//   super.render(r)
// }
// ```
function triangulate(graphicsData: PIXI.GraphicsData, graphicsGeometry: PIXI.GraphicsGeometry) {
  let points = graphicsData.points
  const holes = graphicsData.holes
  const verts = graphicsGeometry.points
  const indices = graphicsGeometry.indices

  const holeArray = []

  // Comming soon
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i]
    holeArray.push(points.length / 2)
    points.push(points[0], points[1])
    points = points.concat(hole.points)
    points.push(hole.points[0], hole.points[1])
  }

  // console.log(points)
  // Tesselate
  const res = Tess2.tesselate({
    contours: [points],
    windingRule: Tess2.WINDING_ODD,
    elementType: Tess2.POLYGONS,
    polySize: 3,
    vertexSize: 2,
  })

  if (res == undefined) {
    return
  }
  if (!res.elements.length) {
    return
  }

  const vrt = res.vertices
  const elm = res.elements

  const vertPos = verts.length / 2

  for (var i = 0; i < res.elements.length; i++) {
    indices.push(res.elements[i] + vertPos)
  }

  for (let i = 0; i < vrt.length; i++) {
    verts.push(vrt[i])
  }
}
