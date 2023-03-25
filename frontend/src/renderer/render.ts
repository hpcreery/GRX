import { CLEAR, DARK } from '@hpcreery/tracespace-parser'
import type {
  ImageTree,
  ImageGraphic,
  ImageShape,
  ImagePath,
  ImageRegion,
  PathSegment,
  Shape,
  LayeredShape,
  SizeEnvelope,
  ErasableShape,
} from '@hpcreery/tracespace-plotter'
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
} from '@hpcreery/tracespace-plotter'
// import { sizeToViewBox } from '@hpcreery/tracespace-renderer'

import * as PIXI from 'pixi.js'
import { Container } from 'pixi.js'
import { mas } from 'process'

import * as Tess2 from 'tess2-ts'

import type { PathProps, ViewBox } from './types'

const alpha: number = 1
const scale: number = 300

export function sizeToViewBox(size: SizeEnvelope): ViewBox {
  return BoundingBox.isEmpty(size)
    ? [0, 0, 0, 0]
    : [size[0], size[1], size[2] - size[0], size[3] - size[1]]
}

export function renderTreeGraphicsContainer(tree: ImageTree): Container {
  const { size, children } = tree
  const viewBox = sizeToViewBox(size)

  let mainContainer: Container = new Container()
  const layerChildren: CustomGraphics[] = []
  const layerHoles: ImageGraphic[] = []

  for (const [index, child] of children.entries()) {
    if (child.polarity === DARK) {
      mainContainer.addChild(renderGraphic(child))
    } else if (child.polarity === CLEAR) {
      if (child.type === IMAGE_SHAPE && child.shape.type === LAYERED_SHAPE) {
        for (const [index, shape] of child.shape.shapes.entries()) {
          const mask = new CustomGraphics()
          mask.beginFill(0x00ffff, 1)
          mask.drawRect(
            viewBox[0] * scale,
            viewBox[1] * scale,
            viewBox[2] * scale,
            viewBox[3] * scale
          )
          mask.endFill()
          mask.beginHole()
          mask.shapeToElement(shape)
          mask.endHole()
          mainContainer.addChild(mask)
          mainContainer.mask = mask
          let mainContainerNew = new Container()
          mainContainerNew.addChild(mainContainer)
          mainContainer = mainContainerNew
        }
      } else {
        layerHoles.push(child)
      }
      if (index >= children.length - 1 || children[index + 1].polarity === DARK) {
        const mask = new CustomGraphics()
        mask.beginFill(0x00ffff, 1)
        mask.drawRect(
          viewBox[0] * scale,
          viewBox[1] * scale,
          viewBox[2] * scale,
          viewBox[3] * scale
        )
        mask.endFill()
        mask.beginHole()
        layerHoles.forEach((hole) => mask.renderGraphic(hole))
        mask.endHole()
        // rect.interactive = false
        mainContainer.addChild(mask)
        mainContainer.mask = mask
        let mainContainerNew = new Container()
        mainContainerNew.addChild(mainContainer)
        mainContainer = mainContainerNew
        layerChildren.length = 0
        layerHoles.length = 0
      }
    }
  }
  return mainContainer
}

export function renderGraphic(node: ImageGraphic): CustomGraphics {
  const graphic = new CustomGraphics()
  graphic.beginFill(0xffffff, alpha)
  graphic.renderGraphic(node)
  graphic.endFill()
  // graphic.interactive = true
  return graphic
}

export class CustomGraphics extends PIXI.Graphics {
  constructor() {
    super()
    // this.scale = new PIXI.Point(1, -1)
    // this.interactive = true
    this.on('pointerdown', (event) => onClickDown(this))
    this.on('pointerup', (event) => onClickUp(this))
    this.on('pointerover', (event) => onPointerOver(this))
    this.on('pointerout', (event) => onPointerOut(this))
    // TODO: Draw featuers with more vertices
  }

  renderGraphic(node: ImageGraphic): this {
    if (node.type === IMAGE_SHAPE) {
      this.renderShape(node)
      return this
    } else {
      const props: PathProps =
        node.type === IMAGE_PATH
          ? { strokeWidth: node.width, fill: 'none' }
          : { strokeWidth: 0, fill: '' }
      const { strokeWidth, fill } = props
      if (node.type === IMAGE_PATH && this._holeMode) {
        for (const segment of node.segments) {
          this.segmentToOutline(segment, node.width)
        }
      }
      if (fill != 'none') {
        this.beginFill(this.fill.color, alpha)
      } else {
        this.beginFill(this.fill.color, 0)
      }
      if (strokeWidth != 0) {
        this.lineStyle({
          width: strokeWidth * scale,
          color: this.fill.color,
          alpha: alpha,
          cap: PIXI.LINE_CAP.ROUND,
        })
      } else {
        this.lineStyle({
          width: 0,
          color: this.fill.color,
          alpha: 0,
          cap: PIXI.LINE_CAP.ROUND,
        })
      }
      this.drawPath(node.segments)
      return this
    }
  }

  renderShape(node: ImageShape): this {
    const { shape } = node
    return this.shapeToElement(shape)
  }

  shapeToElement(shape: Shape): this {
    switch (shape.type) {
      case CIRCLE: {
        const { cx, cy, r } = shape
        this.drawCircle(cx * scale, cy * scale, r * scale)
        return this
      }

      case RECTANGLE: {
        const { x, y, xSize: width, ySize: height, r } = shape
        this.drawRoundedRect(x * scale, y * scale, width * scale, height * scale, r ? r * scale : 0)
        return this
      }

      case POLYGON: {
        this.drawPolygon(shape.points.flat().map((point) => point * scale))
        return this
      }

      case OUTLINE: {
        this.lineStyle({
          width: 0,
          color: this.fill.color,
          alpha: 0,
          cap: PIXI.LINE_CAP.ROUND,
        })
        this.drawPath(shape.segments)
        return this
      }

      case LAYERED_SHAPE: {
        const boundingBox = BoundingBox.fromShape(shape)
        let container: PIXI.Container = new PIXI.Container()

        if (BoundingBox.isEmpty(boundingBox)) {
          return this
        }

        for (const [index, layerShape] of shape.shapes.entries()) {
          if (layerShape.erase === true) {
            let maskGraphic = new CustomGraphics()
            maskGraphic.beginFill(0x000000, 1)
            maskGraphic.drawRect(
              boundingBox[0] * scale,
              boundingBox[1] * scale,
              (boundingBox[2] - boundingBox[0]) * scale,
              (boundingBox[3] - boundingBox[1]) * scale
            )
            maskGraphic.endFill()
            maskGraphic.beginHole()
            maskGraphic.shapeToElement(layerShape)
            maskGraphic.endHole()
            container.mask = maskGraphic
            container.addChild(maskGraphic)
            let containernew = new PIXI.Container()
            containernew.addChild(container)
            container = containernew
          } else {
            let graphic = new CustomGraphics()
            graphic.beginFill(0xffffff, 1)
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
        console.log('RENDERING DEFAULT (UNKNOWN): ', shape)
        // this.drawRect(50, 50, 100, 100)
        return this
      }
    }
  }

  // Necessary as PIXI.Graphics.drawPath() does not support being holes
  public segmentToOutline(segment: PathSegment, width: number): this {
    const { start, end } = segment
    const [x1, y1] = start
    const [x2, y2] = end
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx ** 2 + dy ** 2)
    const nx = dx / length
    const ny = dy / length
    const px = -ny
    const py = nx
    const halfWidth = width / 2
    const x1p = x1 + px * halfWidth
    const y1p = y1 + py * halfWidth
    const x1n = x1 - px * halfWidth
    const y1n = y1 - py * halfWidth
    const x2p = x2 + px * halfWidth
    const y2p = y2 + py * halfWidth
    const angle = Math.atan2(dy, dx) + Math.PI / 2
    this.moveTo(x1p * scale, y1p * scale)
    this.lineTo(x2p * scale, y2p * scale)
    this.arc(x2 * scale, y2 * scale, halfWidth * scale, angle, angle + Math.PI, true)
    this.lineTo(x1n * scale, y1n * scale)
    this.arc(x1 * scale, y1 * scale, halfWidth * scale, angle + Math.PI, angle, true)
    return this
  }

  public drawPath(segments: PathSegment[]): this {
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
      if (this._lineStyle.width != 0) {
        this.moveTo(start[0] * scale, start[1] * scale)
      } else if (previous === undefined || this._lineStyle.width != 0) {
        this.lineTo(start[0] * scale, start[1] * scale)
      } else if (!positionsEqual(previous.end, start)) {
        // NEED TO MOVE TO SO TESSELLATION WORKS WITH ODD EVEN RULE]
        this.lineTo(0, 0)
        this.lineTo(start[0] * scale, start[1] * scale)
        // this.moveTo(start[0] * scale, start[1] * scale)
      }
      if (next.type === LINE) {
        this.lineTo(end[0] * scale, end[1] * scale)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * scale, center[1] * scale, radius * scale, start[2], end[2], c > 0)
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
}

function onClickDown(object: CustomGraphics) {
  console.log('CLICKED DOWN: ', object)
  object.tint = 0x333333
}

function onClickUp(object: CustomGraphics) {
  object.tint = 0x666666
}

function onPointerOver(object: CustomGraphics) {
  object.tint = 0x666666
}

function onPointerOut(object: CustomGraphics) {
  object.tint = 0xffffff
}
