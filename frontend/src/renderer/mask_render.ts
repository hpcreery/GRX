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
  Position,
  ArcPosition,
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
import * as Tess2 from 'tess2-ts'
import type { ViewBox } from './types'

// const darkColor = 0x00000f
let darkColor = Math.floor(Math.random() * 16777215)
const clearColor = 0x000000
const alpha: number = 1
const scale: number = 100

export function sizeToViewBox(size: SizeEnvelope): ViewBox {
  return BoundingBox.isEmpty(size)
    ? [0, 0, 0, 0]
    : [size[0], size[1], size[2] - size[0], size[3] - size[1]]
}

/**
 * @deprecated Use chromaKeyFilter instead
 * @param tree ImageTree
 * @returns PIXI.Container
 */
export function renderTreeGraphicsContainer(tree: ImageTree): PIXI.Container {
  darkColor = Math.floor(Math.random() * 16777215)
  const { size, children } = tree
  const viewBox = sizeToViewBox(size)

  let mainContainer: PIXI.Container = new PIXI.Container()
  const layerChildren: CustomGraphics[] = []
  const layerHoles: ImageGraphic[] = []

  for (const [index, child] of children.entries()) {
    if (child.polarity === DARK) {
      mainContainer.addChild(renderGraphic(child))
    } else if (child.polarity === CLEAR) {
      if (child.type === IMAGE_SHAPE && child.shape.type === LAYERED_SHAPE) {
        for (const [index, shape] of child.shape.shapes.entries()) {
          const mask = new CustomGraphics()
          // mask.interactive = false
          mask.beginFill(0x00ffff, 1)
          mask.drawRect(
            viewBox[0] * scale,
            viewBox[1] * scale,
            viewBox[2] * scale,
            viewBox[3] * scale
          )
          mask.beginHole()
          mask.shapeToElement(shape)
          mask.endHole()
          mainContainer.addChild(mask)
          mainContainer.mask = mask
          let mainContainerNew = new PIXI.Container()
          mainContainerNew.addChild(mainContainer)
          mainContainer = mainContainerNew
        }
      } else {
        layerHoles.push(child)
      }
      if (index >= children.length - 1 || children[index + 1].polarity === DARK) {
        const mask = new CustomGraphics()
        // mask.interactive = false
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
        let mainContainerNew = new PIXI.Container()
        mainContainerNew.addChild(mainContainer)
        mainContainer = mainContainerNew
        layerChildren.length = 0
        layerHoles.length = 0
      }
    }
  }
  console.log('Done rendering')
  return mainContainer
}

export function renderGraphic(node: ImageGraphic): CustomGraphics {
  const graphic = new CustomGraphics()
  graphic.renderGraphic(node)
  return graphic
}

export class CustomGraphics extends PIXI.Graphics {
  constructor() {
    super()
    // this.interactive = true
    // this.on('pointerdown', (event) => onClickDown(this))
    // this.on('pointerup', (event) => onClickUp(this))
    // this.on('pointerover', (event) => onPointerOver(this))
    // this.on('pointerout', (event) => onPointerOut(this))
  }

  renderGraphic(node: ImageGraphic): this {
    this.beginFill(node.polarity == DARK ? darkColor : clearColor, alpha)
    if (node.type === IMAGE_SHAPE) {
      this.renderShape(node)
    } else {
      if (node.type === IMAGE_PATH && this._holeMode) {
        for (const segment of node.segments) {
          this.segmentToOutline(segment, node.width)
        }
        return this
      }
      // this.beginFill(
      //   node.polarity == DARK ? darkColor : clearColor,
      //   node.type === IMAGE_PATH ? 0 : alpha
      // )
      // this.lineStyle({
      //   width: node.type === IMAGE_PATH ? node.width * scale : 0,
      //   color: node.polarity == DARK ? darkColor : clearColor,
      //   alpha: node.type === IMAGE_PATH ? alpha : 0,
      //   cap: PIXI.LINE_CAP.ROUND,
      //   join: PIXI.LINE_JOIN.ROUND,
      // })
      // this.drawPath(node.segments)
      if (node.type === IMAGE_PATH) {
        this.beginFill(node.polarity == DARK ? darkColor : clearColor, 0)
        this.lineStyle({
          width: node.width * scale,
          color: node.polarity == DARK ? darkColor : clearColor,
          alpha: alpha,
          cap: PIXI.LINE_CAP.ROUND,
          join: PIXI.LINE_JOIN.ROUND,
        })
        this.drawPolyLine(node.segments)
      } else {
        this.beginFill(node.polarity == DARK ? darkColor : clearColor, alpha)
        this.lineStyle({
          width: 0,
          color: node.polarity == DARK ? darkColor : clearColor,
          alpha: 0,
          cap: PIXI.LINE_CAP.ROUND,
          join: PIXI.LINE_JOIN.ROUND,
        })
        this.drawContour(node.segments)
      }
    }
    this.endFill()
    return this
  }

  renderShape(node: ImageShape): this {
    const { shape } = node
    return this.shapeToElement(shape)
  }

  shapeToElement(shape: Shape): this {
    switch (shape.type) {
      case CIRCLE: {
        const { cx, cy, r } = shape
        // TODO: use conic. https://www.npmjs.com/package/@pixi-essentials/conic
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
        this.drawContour(shape.segments)
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
            const mask = new CustomGraphics()
            mask.beginFill(0x000000, 1)
            mask.drawRect(
              boundingBox[0] * scale,
              boundingBox[1] * scale,
              (boundingBox[2] - boundingBox[0]) * scale,
              (boundingBox[3] - boundingBox[1]) * scale
            )
            mask.endFill()
            mask.beginHole()
            mask.shapeToElement(layerShape)
            mask.endHole()
            container.mask = mask
            container.addChild(mask)
            let containernew = new PIXI.Container()
            containernew.addChild(container)
            container = containernew
          } else {
            let graphic = new CustomGraphics()
            graphic.beginFill(darkColor, alpha)
            graphic.shapeToElement(layerShape)
            graphic.endFill()
            container.addChild(graphic)
          }
        }
        this.addChild(container)
        return this
      }

      default: {
        console.log('RENDERING (UNKNOWN): ', shape)
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
    let lastHome: Position | ArcPosition = [0, 0]
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next

      if (this._lineStyle.width != 0) {
        if (previous === undefined) {
          this.moveTo(start[0] * scale, start[1] * scale)
        } else if (!positionsEqual(previous.end, start)) {
          this.moveTo(start[0] * scale, start[1] * scale)
        }
      } else {
        if (previous === undefined) {
          this.moveTo(0, 0)
          this.lineTo(start[0] * scale, start[1] * scale)
          lastHome = start
        } else if (!positionsEqual(previous.end, start)) {
          this.lineTo(lastHome[0] * scale, lastHome[1] * scale)
          this.lineTo(0, 0)
          this.lineTo(start[0] * scale, start[1] * scale)
          lastHome = start
        }
      }
      if (next.type === LINE) {
        this.lineTo(end[0] * scale, end[1] * scale)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * scale, center[1] * scale, radius * scale, start[2], end[2], c > 0)
      }
    }
    if (this._lineStyle.width == 0) {
      this.lineTo(lastHome[0] * scale, lastHome[1] * scale)
    }
    return this
  }

  public drawPolyLine(segments: PathSegment[]): this {
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
      if (previous === undefined || !positionsEqual(previous.end, start)) {
        this.moveTo(start[0] * scale, start[1] * scale)
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

  public drawContour(segments: PathSegment[]): this {
    let lastHome: Position | ArcPosition = [0, 0]
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
        if (previous === undefined) {
          this.moveTo(0, 0)
          this.lineTo(start[0] * scale, start[1] * scale)
          lastHome = start
        } else if (!positionsEqual(previous.end, start)) {
          this.lineTo(lastHome[0] * scale, lastHome[1] * scale)
          this.lineTo(0, 0)
          this.lineTo(start[0] * scale, start[1] * scale)
          lastHome = start
        }
      if (next.type === LINE) {
        this.lineTo(end[0] * scale, end[1] * scale)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * scale, center[1] * scale, radius * scale, start[2], end[2], c > 0)
      }
    }
    this.lineTo(lastHome[0] * scale, lastHome[1] * scale)
    return this
  }

  // render(r: PIXI.Renderer) {
  //   super.render(r)
  // }
}

// This is a hack to get PIXI to use the Tess2 library for triangulation. REQUIRED
// implemented by extending the graphics library and overriding the triangulate function
// ``` js
// PIXI.graphicsUtils.buildPoly.triangulate = triangulate
// ```
PIXI.graphicsUtils.buildPoly.triangulate = triangulate
function triangulate(graphicsData: PIXI.GraphicsData, graphicsGeometry: PIXI.GraphicsGeometry) {
  let points = graphicsData.points
  const holes = graphicsData.holes
  const verts = graphicsGeometry.points
  const indices = graphicsGeometry.indices

  const holeArray = []

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
