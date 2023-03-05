// import {s} from 'hastscript'

// import {random as createId} from '@tracespace/xml-id'
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

import * as Tess2 from 'tess2-ts'

import type { SvgElement, PathProps } from './types'

export function renderGraphic(node: ImageGraphic): PIXI.Graphics {
  if (node.type === IMAGE_SHAPE) {
    console.log('RENDERING IMAGE_SHAPE: ', node)
    return renderShape(node)
  }

  return renderPath(node)
}

export function renderShape(node: ImageShape): PIXI.Graphics {
  const { shape } = node
  return shapeToElement(shape)
}

export function shapeToElement(shape: Shape): PIXI.Graphics {
  switch (shape.type) {
    case CIRCLE: {
      const { cx, cy, r } = shape
      console.log('RENDERING CIRCLE: ', shape)
      const graphics = new PIXI.Graphics()
      graphics.beginFill(0xffffff, 0.3)
      graphics.drawCircle(cx * 100, cy * 100, r * 100)
      graphics.endFill()
      return graphics
    }

    case RECTANGLE: {
      const { x, y, xSize: width, ySize: height, r } = shape
      console.log('RENDERING RECTANGLE: ', shape)
      const graphics = new PIXI.Graphics()
      graphics.beginFill(0xffffff, 0.3)
      graphics.drawRoundedRect(x * 100, y * 100, width * 100, height * 100, r ? r * 100 : 0)
      graphics.endFill()
      return graphics
    }

    case POLYGON: {
      console.log('RENDERING POLYGON: ', shape)
      const graphics = new PIXI.Graphics()
      graphics.beginFill(0xffffff, 0.3)
      graphics.drawPolygon(shape.points.flat().map((point) => point * 100))
      graphics.endFill()
      return graphics
    }

    case OUTLINE: {
      console.log('RENDERING OUTLINE (development): ', shape)
      const graphics = new CustomGraphics()
      graphics.drawPath(shape.segments, { strokeWidth: 0, fill: '' })
      return graphics
    }

    case LAYERED_SHAPE: {
      // const boundingBox = BoundingBox.fromShape(shape)
      // const clipIdBase = '1'
      // const defs: PIXI.Graphics[] = []
      // let children: PIXI.Graphics[] = []

      // for (const [index, layerShape] of shape.shapes.entries()) {
      //   if (layerShape.erase === true && !BoundingBox.isEmpty(boundingBox)) {
      //     const clipId = `${clipIdBase}__${index}`

      //     defs.push(s('clipPath', {id: clipId}, [shapeToElement(layerShape)]))
      //     children = [s('g', {clipPath: `url(#${clipId})`}, children)]
      //   } else {
      //     children.push(shapeToElement(layerShape))
      //   }
      // }

      // if (defs.length > 0) children.unshift(s('defs', defs))
      // if (children.length === 1) return children[0]
      // return s('g', children)

      // TODO: Implement this
      console.log('RENDERING LAYERED_SHAPE (development): ', shape)
      // const graphics = new CustomGraphics()
      // graphics.drawLayeredShape(shape)
      const boundingBox = BoundingBox.fromShape(shape)
      console.log('boundingBox: ', boundingBox)
      // if (BoundingBox.isEmpty(boundingBox)) {
      //   return new PIXI.Graphics()
      // }
      const mainGraphics = new PIXI.Graphics()
      let graphics: PIXI.Graphics[] = []
      let shapes: PIXI.Graphics[] = []
      let masks: PIXI.Container = new PIXI.Container()

      // for (const [index, layerShape] of shape.shapes.entries()) {
      //   if (layerShape.erase === true && !BoundingBox.isEmpty(boundingBox)) {
      //     const clipId = `${clipIdBase}__${index}`

      //     defs.push(s('clipPath', {id: clipId}, [shapeToElement(layerShape)]))
      //     children = [s('g', {clipPath: `url(#${clipId})`}, children)]
      //   } else {
      //     children.push(shapeToElement(layerShape))
      //   }
      // }

      if (BoundingBox.isEmpty(boundingBox)) {
        return new PIXI.Graphics()
      }
      let maskGraphic = new PIXI.Graphics()
      maskGraphic.beginFill(0xffffff, 0.3)
      maskGraphic.drawRect(
        boundingBox[0] * 100,
        boundingBox[1] * 100,
        (boundingBox[2] - boundingBox[0]) * 100,
        (boundingBox[3] - boundingBox[1]) * 100
      )
      maskGraphic.endFill()

      let newMask = true

      for (const [index, layerShape] of shape.shapes.entries()) {
        if (layerShape.erase === true) {
          newMask = true
          maskGraphic.addChild(shapeToElement(layerShape))
        } else {
          if (newMask) {
            shapes.map((shape) => {
              shape.mask = maskGraphic
            })
            graphics = [...graphics, ...shapes, maskGraphic]
            shapes = []
            maskGraphic = new PIXI.Graphics()
            maskGraphic.beginFill(0xffffff, 0.3)
            maskGraphic.drawRect(
              boundingBox[0] * 100,
              boundingBox[1] * 100,
              (boundingBox[2] - boundingBox[0]) * 100,
              (boundingBox[3] - boundingBox[1]) * 100
            )
            maskGraphic.endFill()
          }
          newMask = false
          shapes.push(shapeToElement(layerShape))
          
        }
      }
      graphics = [...graphics, ...shapes, maskGraphic]
      mainGraphics.addChild(...graphics)
      return mainGraphics
    }

    default: {
      // return s('g')

      // TODO: Implement this
      console.log('RENDERING DEFAULT (development): ', shape)
      const graphics = new PIXI.Graphics()
      graphics.beginFill(0xffffff)
      graphics.drawRect(50, 50, 100, 100)
      graphics.endFill()
      return graphics
    }
  }
}

export function renderPath(node: ImagePath | ImageRegion): PIXI.Graphics {
  // const pathData = segmentsToPathData(node.segments)
  const props: PathProps =
    node.type === IMAGE_PATH
      ? { strokeWidth: node.width, fill: 'none' }
      : { strokeWidth: 0, fill: '' }

  // return s('path', {...props, d: pathData})

  console.log('RENDERING PATH (development): ', node)
  const graphics = new CustomGraphics()
  graphics.drawPath(node.segments, props)
  return graphics
}

class CustomGraphics extends PIXI.Graphics {
  constructor() {
    super()
    console.log('CustomGraphicsFill: ', this.fill)
  }

  star() {
    this.beginFill(0xff00ff)
      .lineStyle(0, 0)
      .moveTo(0, 0)
      .lineTo(100, 50)
      .lineTo(0, 50)
      .lineTo(100, 0)
      .lineTo(50, 100)
      .lineTo(0, 0)
      .closePath()
      .endFill()
  }

  render(r: PIXI.Renderer) {
    PIXI.graphicsUtils.buildPoly.triangulate = triangulate
    super.render(r)
  }

  public drawLayeredShape(shape: LayeredShape): this {
    // if (defs.length > 0) children.unshift(s('defs', defs))
    // if (children.length === 1) return children[0]
    return this
  }

  public drawPath(segments: PathSegment[], props: PathProps): this {
    const { strokeWidth, fill } = props
    if (fill != 'none') {
      this.beginFill(0xffffff, 0.5)
    }
    if (strokeWidth != 0) {
      this.lineStyle({
        width: strokeWidth * 100,
        color: 0xffffff,
        alpha: 1,
        cap: PIXI.LINE_CAP.ROUND,
      })
    }
    for (const [index, next] of segments.entries()) {
      // console.log("DRAWING PATH SEGMENT: ", next)
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next

      if (previous === undefined || strokeWidth != 0) {
        // console.log("DRAWING MOVING TO: ", next, this)
        this.moveTo(start[0] * 100, start[1] * 100)
      } else if (!positionsEqual(previous.end, start)) {
        // NEED TO MOVE TO SO TESSELLATION WORKS WITH ODD EVEN RULE
        this.lineTo(start[0] * 100, start[1] * 100)
      }

      if (next.type === LINE) {
        // this.lineStyle(1, 0x00ff00)
        // console.log("DRAWING LINE: ", next, this)
        this.lineTo(end[0] * 100, end[1] * 100)
      } else {
        // this.lineStyle(1, 0xff00ff)
        // console.log("DRAWING ARC: ", next, this)
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        // console.log("DRAWING ARC: ", next, this, c)
        this.arc(center[0] * 100, center[1] * 100, radius * 100, start[2], end[2], c > 0)
      }
    }
    // this.closePath()
    this.endFill()
    return this
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

  // if (points.length >= 6) {
  const holeArray = []
  // Comming soon
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i]

    holeArray.push(points.length / 2)
    points = points.concat(hole.points)
  }

  console.log(points)
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
  // }
}

// function segmentsToPathData(segments: PathSegment[]): string {
//   const pathCommands: string[] = []

//   for (const [index, next] of segments.entries()) {
//     const previous = index > 0 ? segments[index - 1] : undefined
//     const {start, end} = next

//     if (previous === undefined || !positionsEqual(previous.end, start)) {
//       pathCommands.push(`M${start[0]} ${-start[1]}`)
//     }

//     if (next.type === LINE) {
//       pathCommands.push(`L${end[0]} ${-end[1]}`)
//     } else {
//       const {start: nextStart, end: nextEnd} = next
//       const sweep = nextEnd[2] - nextStart[2]
//       const absSweep = Math.abs(sweep)
//       const {center, radius} = next

//       // Sweep flag flipped from SVG value because Y-axis is positive-down
//       const sweepFlag = sweep < 0 ? '1' : '0'
//       let largeFlag = absSweep <= Math.PI ? '0' : '1'

//       // A full circle needs two SVG arcs to draw
//       if (absSweep === 2 * Math.PI) {
//         const [mx, my] = [2 * center[0] - end[0], -(2 * center[1] - end[1])]
//         largeFlag = '0'
//         pathCommands.push(`A${radius} ${radius} 0 0 ${sweepFlag} ${mx} ${my}`)
//       }

//       pathCommands.push(
//         `A${radius} ${radius} 0 ${largeFlag} ${sweepFlag} ${end[0]} ${-end[1]}`
//       )
//     }
//   }

//   return pathCommands.join('')
// }

// ordered pairs of [x, y] to form a 5 point star
// const starPoints = [
//   [0, 0.5],
//   [0.2, 0.2],
//   [0.5, 0],
//   [0.8, 0.2],
//   [1, 0.5],
//   [0.8, 0.8],
//   [0.5, 1],
//   [0.2, 0.8],
//   [0, 0.5],
// ]
