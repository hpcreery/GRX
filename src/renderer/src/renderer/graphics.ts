import { CLEAR, DARK, IN, MM } from '@hpcreery/tracespace-parser'
import type {
  ImageTree,
  ImageGraphic,
  ImageShape,
  PathSegment,
  Shape,
  Position,
  ArcPosition,
  Tool
} from '@hpcreery/tracespace-plotter'
import {
  plotShape,
  plotMacro,
  MACRO_TOOL,
  SIMPLE_TOOL,
  positionsEqual,
  IMAGE_SHAPE,
  IMAGE_PATH,
  CIRCLE,
  RECTANGLE,
  POLYGON,
  OUTLINE,
  LAYERED_SHAPE,
  LINE,
  ARC
} from '@hpcreery/tracespace-plotter'
import * as PIXI from '@pixi/webworker'
import chroma from 'chroma-js'
import * as Tess2 from 'tess2-ts'
import type { TIntersectItem, TGraphicsOptions } from './types'

const DARK_COLOR = 0xffffff
const DARK_ALPHA = 1

const CLEAR_COLOR = 0x000000
const CLEAR_ALPHA = 1

const OUTLINE_WIDTH = 0.25
const OUTLINE_MODE = false

const SCALE = 100

const randomColor = (): number => Math.floor(Math.random() * 16777215)
const uid = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

const GraphicsOptionsDefaults: TGraphicsOptions = {
  units: IN,
  darkColor: DARK_COLOR,
  darkAlpha: DARK_ALPHA,
  clearColor: CLEAR_COLOR,
  clearAlpha: CLEAR_ALPHA,
  outlineWidth: OUTLINE_WIDTH,
  outlineMode: OUTLINE_MODE,
  scale: SCALE,
  index: 0,
  shape: undefined
}

export class Graphics extends PIXI.Graphics {
  public properties: TGraphicsOptions
  constructor(
    options: Partial<TGraphicsOptions> = {},
    geometry: PIXI.GraphicsGeometry | undefined = undefined
  ) {
    super(geometry)

    this.properties = { ...GraphicsOptionsDefaults, ...options }

    if (this.properties.units === IN) {
      this.properties.scale = SCALE
    } else if (this.properties.units === MM) {
      this.properties.scale = SCALE / 25.4
    } else {
      throw new Error(`Unknown units: ${this.properties.units}`)
    }
  }

  public renderGraphic(
    node: ImageGraphic,
    referenceGeometry: undefined | PIXI.GraphicsGeometry = undefined
  ): this {
    const {
      scale: SCALE,
      darkAlpha: DARK_ALPHA,
      clearAlpha: CLEAR_ALPHA,
      darkColor: DARK_COLOR,
      clearColor: CLEAR_COLOR,
      outlineMode: OUTLINE_MODE,
      outlineWidth: OUTLINE_WIDTH
    } = this.properties
    if (node.type === IMAGE_SHAPE) {
      if (referenceGeometry != undefined) {
        this.position.x = node.location[0] * SCALE
        this.position.y = node.location[1] * SCALE
        referenceGeometry = undefined
      } else {
        if (OUTLINE_MODE) {
          this.beginFill(DARK_COLOR, 0)
          this.lineStyle({
            color: DARK_COLOR,
            width: OUTLINE_WIDTH,
            alpha: 1,
            cap: PIXI.LINE_CAP.ROUND,
            join: PIXI.LINE_JOIN.ROUND
          })
        } else {
          if (node.polarity == DARK) {
            this.beginFill(DARK_COLOR, DARK_ALPHA)
          } else if (node.polarity == CLEAR) {
            this.beginFill(CLEAR_COLOR, CLEAR_ALPHA)
          } else {
            this.beginFill(CLEAR_COLOR, CLEAR_ALPHA)
          }
          this.lineStyle({
            width: 0,
            alpha: 0
          })
        }
        this.renderShape(node)
      }
    } else {
      if (node.type === IMAGE_PATH) {
        if (referenceGeometry != undefined) {
          for (const segment of node.segments) {
            const startCircle = new Graphics(this.properties, referenceGeometry)
            startCircle.x = segment.start[0] * SCALE
            startCircle.y = segment.start[1] * SCALE
            this.addChild(startCircle)
            const endCircle = new Graphics(this.properties, referenceGeometry)
            endCircle.x = segment.end[0] * SCALE
            endCircle.y = segment.end[1] * SCALE
            this.addChild(endCircle)
            const pathGraphic = new Graphics(this.properties)
            if (node.polarity == DARK) {
              pathGraphic.beginFill(DARK_COLOR, DARK_ALPHA)
            } else {
              pathGraphic.beginFill(CLEAR_COLOR, CLEAR_ALPHA)
            }
            pathGraphic.lineStyle({
              width: 0,
              color: node.polarity == DARK ? DARK_COLOR : CLEAR_COLOR,
              alpha: 0
            })
            const contour = pathGraphic.contourizeCirclePath(segment, node.width)
            pathGraphic.drawContour(contour)
            this.addChild(pathGraphic)
          }
          referenceGeometry = undefined
        } else {
          if (OUTLINE_MODE) {
            this.beginFill(DARK_COLOR, 0)
            this.lineStyle({
              color: DARK_COLOR,
              width: OUTLINE_WIDTH,
              alpha: 1,
              cap: PIXI.LINE_CAP.ROUND,
              join: PIXI.LINE_JOIN.ROUND
            })
          } else {
            if (node.polarity == DARK) {
              this.beginFill(DARK_COLOR, 0)
            } else {
              this.beginFill(CLEAR_COLOR, 0)
            }
            this.lineStyle({
              width: node.width * SCALE,
              color: node.polarity == DARK ? DARK_COLOR : CLEAR_COLOR,
              alpha: node.polarity == DARK ? DARK_ALPHA : CLEAR_ALPHA,
              cap: PIXI.LINE_CAP.ROUND,
              join: PIXI.LINE_JOIN.ROUND
            })
          }
          this.drawPolyLine(node.segments)
        }
      } else {
        if (OUTLINE_MODE) {
          this.beginFill(DARK_COLOR, 0)
          this.lineStyle({
            color: DARK_COLOR,
            width: OUTLINE_WIDTH,
            alpha: 1,
            cap: PIXI.LINE_CAP.ROUND,
            join: PIXI.LINE_JOIN.ROUND
          })
          this.drawPolyLine(node.segments).lineTo(
            node.segments[0].start[0] * SCALE,
            node.segments[0].start[1] * SCALE
          )
        } else {
          if (node.polarity == DARK) {
            this.beginFill(DARK_COLOR, DARK_ALPHA)
          } else {
            this.beginFill(CLEAR_COLOR, CLEAR_ALPHA)
          }
          this.lineStyle({
            width: 0,
            color: node.polarity == DARK ? DARK_COLOR : CLEAR_COLOR,
            alpha: 0
          })
          this.drawContour(node.segments)
        }
      }
    }
    this.endFill()
    return this
  }

  private renderShape(node: ImageShape): this {
    const { shape } = node
    const { outlineMode: OUTLINE_MODE } = this.properties
    if (OUTLINE_MODE) {
      return this.shapeToOutline(shape)
    } else {
      return this.shapeToElement(shape)
    }
  }

  private shapeToElement(shape: Shape): this {
    const {
      scale: SCALE,
      darkAlpha: DARK_ALPHA,
      clearAlpha: CLEAR_ALPHA,
      darkColor: DARK_COLOR,
      clearColor: CLEAR_COLOR
    } = this.properties
    switch (shape.type) {
      case CIRCLE: {
        const { cx, cy, r } = shape
        // TODO: use conic. https://www.npmjs.com/package/@pixi-essentials/conic
        this.drawCircle(cx * SCALE, cy * SCALE, r * SCALE)
        return this
      }

      case RECTANGLE: {
        const { x, y, xSize: width, ySize: height, r } = shape
        this.drawRoundedRect(x * SCALE, y * SCALE, width * SCALE, height * SCALE, r ? r * SCALE : 0)
        return this
      }

      case POLYGON: {
        this.drawPolygon(shape.points.flat().map((point) => point * SCALE))
        return this
      }

      case OUTLINE: {
        this.drawContour(shape.segments)
        return this
      }

      case LAYERED_SHAPE: {
        const parentColor = this._fillStyle.color
        for (const layerShape of shape.shapes) {
          const color =
            parentColor == DARK_COLOR
              ? layerShape.erase === true
                ? CLEAR_COLOR
                : DARK_COLOR
              : layerShape.erase === true
              ? DARK_COLOR
              : CLEAR_COLOR
          this.beginFill(color, parentColor == DARK_COLOR ? DARK_ALPHA : CLEAR_ALPHA)
          this.shapeToElement(layerShape)
          this.endFill()
          this.moveTo(0, 0)
        }
        return this
      }

      default: {
        console.log('RENDERING (UNKNOWN): ', shape)
        return this
      }
    }
  }

  private shapeToOutline(shape: Shape): this {
    const { scale: SCALE } = this.properties
    switch (shape.type) {
      case CIRCLE: {
        const { cx, cy, r } = shape
        this.moveTo(cx * SCALE + r * SCALE, cy * SCALE)
        this.arc(cx * SCALE, cy * SCALE, r * SCALE, 0, 2 * Math.PI)
        return this
      }

      case RECTANGLE: {
        const { x, y, xSize: width, ySize: height, r } = shape
        if (r) {
          this.moveTo(x * SCALE, y * SCALE + r * SCALE)
          this.arc(
            x * SCALE + r * SCALE,
            y * SCALE + r * SCALE,
            r * SCALE,
            Math.PI,
            (3 * Math.PI) / 2
          )
          this.lineTo(x * SCALE + width * SCALE - r * SCALE, y * SCALE)
          this.arc(
            x * SCALE + width * SCALE - r * SCALE,
            y * SCALE + r * SCALE,
            r * SCALE,
            (3 * Math.PI) / 2,
            2 * Math.PI
          )
          this.lineTo(x * SCALE + width * SCALE, y * SCALE + height * SCALE - r * SCALE)
          this.arc(
            x * SCALE + width * SCALE - r * SCALE,
            y * SCALE + height * SCALE - r * SCALE,
            r * SCALE,
            0,
            Math.PI / 2
          )
          this.lineTo(x * SCALE + r * SCALE, y * SCALE + height * SCALE)
          this.arc(
            x * SCALE + r * SCALE,
            y * SCALE + height * SCALE - r * SCALE,
            r * SCALE,
            Math.PI / 2,
            Math.PI
          )
          this.lineTo(x * SCALE, y * SCALE + r * SCALE)
        } else {
          this.moveTo(x * SCALE, y * SCALE)
          this.lineTo(x * SCALE + width * SCALE, y * SCALE)
          this.lineTo(x * SCALE + width * SCALE, y * SCALE + height * SCALE)
          this.lineTo(x * SCALE, y * SCALE + height * SCALE)
          this.lineTo(x * SCALE, y * SCALE)
        }
        return this
      }

      case POLYGON: {
        const [firstPoint, ...restPoints] = shape.points
        this.moveTo(firstPoint[0] * SCALE, firstPoint[1] * SCALE)
        for (const point of restPoints) {
          this.lineTo(point[0] * SCALE, point[1] * SCALE)
        }
        this.lineTo(firstPoint[0] * SCALE, firstPoint[1] * SCALE)
        return this
      }

      case OUTLINE: {
        this.drawPolyLine(shape.segments)
        return this
      }

      case LAYERED_SHAPE: {
        for (const layerShape of shape.shapes) {
          this.shapeToOutline(layerShape)
        }
        return this
      }

      default: {
        console.log('RENDERING (UNKNOWN): ', shape)
        return this
      }
    }
  }

  private drawPolyLine(segments: PathSegment[]): this {
    const { scale: SCALE } = this.properties
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
      if (previous === undefined || !positionsEqual(previous.end, start)) {
        this.moveTo(start[0] * SCALE, start[1] * SCALE)
      }
      if (next.type === LINE) {
        this.lineTo(end[0] * SCALE, end[1] * SCALE)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * SCALE, center[1] * SCALE, radius * SCALE, start[2], end[2], c > 0)
      }
    }
    return this
  }

  private drawContour(segments: PathSegment[]): this {
    const { scale: SCALE } = this.properties
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
      if (previous === undefined) {
        this.moveTo(start[0] * SCALE, start[1] * SCALE)
      } else if (!positionsEqual(previous.end, start)) {
        this.moveTo(start[0] * SCALE, start[1] * SCALE)
      }
      if (next.type === LINE) {
        this.lineTo(end[0] * SCALE, end[1] * SCALE)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * SCALE, center[1] * SCALE, radius * SCALE, start[2], end[2], c > 0)
      }
    }
    return this
  }

  private contourizeCirclePath(segment: PathSegment, width: number): PathSegment[] {
    const { start, end } = segment
    if (segment.type === LINE) {
      const [x1, y1] = start
      const [x2, y2] = end
      const theta = Math.atan2(y2 - y1, x2 - x1)
      const dx = -(width / 2) * Math.sin(theta)
      const dy = (width / 2) * Math.cos(theta)
      return [
        {
          type: LINE,
          start: [x1 + dx, y1 + dy],
          end: [x2 + dx, y2 + dy]
        },
        // {
        //   type: ARC,
        //   start: [x2 + dx, y2 + dy, theta + Math.PI / 2],
        //   end: [x2 - dx, y2 - dy, theta - Math.PI / 2],
        //   center: [x2, y2],
        //   radius: width / 2,
        // },
        {
          type: LINE,
          start: [x2 + dx, y2 + dy],
          end: [x2 - dx, y2 - dy]
        },
        {
          type: LINE,
          start: [x2 - dx, y2 - dy],
          end: [x1 - dx, y1 - dy]
        },
        // {
        //   type: ARC,
        //   start: [x1 - dx, y1 - dy, theta + (Math.PI * 3) / 2],
        //   end: [x1 + dx, y1 + dy, theta + Math.PI / 2],
        //   center: [x1, y1],
        //   radius: width / 2,
        // },
        {
          type: LINE,
          start: [x1 - dx, y1 - dy],
          end: [x1 + dx, y1 + dy]
        }
      ]
    } else {
      const { start, end, radius, center } = segment
      const [x1, y1] = start
      const [x2, y2] = end
      const [cx, cy] = center
      const theta1 = start[2]
      const theta2 = end[2]
      const dx = -(width / 2) * Math.sin(theta1 - Math.PI / 2)
      const dy = (width / 2) * Math.cos(theta1 - Math.PI / 2)
      const dx2 = -(width / 2) * Math.sin(theta2 - Math.PI / 2)
      const dy2 = (width / 2) * Math.cos(theta2 - Math.PI / 2)
      if (theta1 > theta2) {
        return [
          {
            type: ARC,
            start: [x1 + dx, y1 + dy, theta1],
            end: [x2 + dx2, y2 + dy2, theta2],
            center: [cx, cy],
            radius: radius + width / 2
          },
          // {
          //   type: ARC,
          //   start: [x2 + dx2, y2 + dy2, theta2],
          //   end: [x2 - dx2, y2 - dy2, theta2 - Math.PI],
          //   center: [x2, y2],
          //   radius: width / 2,
          // },
          {
            type: LINE,
            start: [x2 + dx2, y2 + dy2],
            end: [x2 - dx2, y2 - dy2]
          },
          {
            type: ARC,
            start: [x2 - dx2, y2 - dy2, theta2],
            end: [x1 - dx, y1 - dy, theta1],
            center: [cx, cy],
            radius: radius - width / 2
          },
          // {
          //   type: ARC,
          //   start: [x1 - dx, y1 - dy, theta1 + Math.PI],
          //   end: [x1 + dx, y1 + dy, theta1],
          //   center: [x1, y1],
          //   radius: width / 2,
          // },
          {
            type: LINE,
            start: [x1 - dx, y1 - dy],
            end: [x1 + dx, y1 + dy]
          }
        ]
      } else {
        return [
          {
            type: ARC,
            start: [x1 + dx, y1 + dy, theta1],
            end: [x2 + dx2, y2 + dy2, theta2],
            center: [cx, cy],
            radius: radius + width / 2
          },
          // {
          //   type: ARC,
          //   start: [x2 + dx2, y2 + dy2, theta2],
          //   end: [x2 - dx2, y2 - dy2, theta2 + Math.PI],
          //   center: [x2, y2],
          //   radius: width / 2,
          // },
          {
            type: LINE,
            start: [x2 + dx2, y2 + dy2],
            end: [x2 - dx2, y2 - dy2]
          },
          {
            type: ARC,
            start: [x2 - dx2, y2 - dy2, theta2],
            end: [x1 - dx, y1 - dy, theta1],
            center: [cx, cy],
            radius: radius - width / 2
          },
          // {
          //   type: ARC,
          //   start: [x1 - dx, y1 - dy, theta1 - Math.PI],
          //   end: [x1 + dx, y1 + dy, theta1],
          //   center: [x1, y1],
          //   radius: width / 2,
          // },
          {
            type: LINE,
            start: [x1 - dx, y1 - dy],
            end: [x1 + dx, y1 + dy]
          }
        ]
      }
    }
  }

  /**
   * @deprecated Use drawContour instead
   */
  // @ts-ignore - unused param.
  private drawTesselatedContour(segments: PathSegment[]): this {
    const { scale: SCALE } = this.properties
    let lastHome: Position | ArcPosition = [0, 0]
    for (const [index, next] of segments.entries()) {
      const previous = index > 0 ? segments[index - 1] : undefined
      const { start, end } = next
      if (previous === undefined) {
        this.moveTo(0, 0)
        this.lineTo(start[0] * SCALE, start[1] * SCALE)
        lastHome = start
      } else if (!positionsEqual(previous.end, start)) {
        this.lineTo(lastHome[0] * SCALE, lastHome[1] * SCALE)
        this.lineTo(0, 0)
        this.lineTo(start[0] * SCALE, start[1] * SCALE)
        lastHome = start
      }
      if (next.type === LINE) {
        this.lineTo(end[0] * SCALE, end[1] * SCALE)
      } else {
        const { start, end, radius, center } = next
        const c = start[2] - end[2]
        this.arc(center[0] * SCALE, center[1] * SCALE, radius * SCALE, start[2], end[2], c > 0)
      }
    }
    this.lineTo(lastHome[0] * SCALE, lastHome[1] * SCALE)
    return this
  }
}

export class GerberGraphics extends Graphics {
  uid: string
  geometryStore: { [dcode: string]: PIXI.GraphicsGeometry }
  toolStore: Partial<Record<string, Tool>>
  constructor(tree: ImageTree) {
    super({ units: tree.units })
    this.filters = [ChromaFilter]
    this.tint = randomColor()
    this.uid = uid()
    this.geometryStore = {}
    this.toolStore = {}
    this.renderImageTree(tree)
  }

  private saveGeometry(dcode: string, tool: Tool) {
    const graphicProps = {
      units: this.properties.units,
      darkColor: 0xffff00,
      darkAlpha: 0.5,
      clearColor: 0xffff00,
      clearAlpha: 0.5
    }
    const originLocation = {
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
      arcOffsets: { i: 0, j: 0, a: 0 }
    }
    const newGraphic = new Graphics(graphicProps)
    if (tool.type === MACRO_TOOL) {
      const imageGraphic: ImageGraphic = {
        type: IMAGE_SHAPE,
        shape: plotMacro(tool, originLocation),
        polarity: DARK,
        dcode: tool.dcode,
        location: [originLocation.endPoint.x, originLocation.endPoint.y]
      }
      newGraphic.renderGraphic(imageGraphic)
    } else if (tool.type === SIMPLE_TOOL) {
      const imageGraphic: ImageGraphic = {
        type: IMAGE_SHAPE,
        shape: plotShape(tool, originLocation),
        polarity: DARK,
        dcode: tool.dcode,
        location: [originLocation.endPoint.x, originLocation.endPoint.y]
      }
      newGraphic.renderGraphic(imageGraphic)
    }
    this.geometryStore[dcode] = newGraphic.geometry
    newGraphic.destroy()
  }

  // @ts-ignore - unused param.
  private retrieveGraphic(child: ImageGraphic, index: number): Graphics {
    const { dcode } = child
    const graphicProps = {
      units: this.properties.units,
      darkColor: DARK_COLOR,
      darkAlpha: 0.5,
      clearColor: DARK_COLOR,
      clearAlpha: 0.5,
      index,
      shape: child
    }
    if (dcode != undefined && child.type == IMAGE_SHAPE) {
      const tool = this.toolStore[dcode]
      if (!(dcode in this.geometryStore) && tool) {
        this.saveGeometry(dcode, tool)
      }
      // const graphic = new Graphics(graphicProps, this.geometryStore[dcode])
      // graphic.renderGraphic(child)
      // graphic.position.x = child.location[0] * SCALE
      // graphic.position.y = child.location[1] * SCALE
      const graphic = new Graphics(graphicProps)
      graphic.renderGraphic(child, this.geometryStore[dcode])
      return graphic
    } else if (dcode != undefined && child.type == IMAGE_PATH) {
      const tool = this.toolStore[dcode]
      if (!(dcode in this.geometryStore) && tool) {
        this.saveGeometry(dcode, tool)
      }
      const graphic = new Graphics(graphicProps)
      graphic.renderGraphic(child, this.geometryStore[dcode])
      return graphic
    } else {
      const graphic = new Graphics(graphicProps)
      graphic.renderGraphic(child)
      return graphic
    }
  }

  public renderImageTree(tree: ImageTree): this {
    const { children, tools } = tree
    Object.assign(this.toolStore, tools)
    console.time('render')
    // @ts-ignore - unused param.
    for (const [index, child] of children.entries()) {
      //* BATCH GEOMETRY RENDERING
      this.renderGraphic(child)

      //* RENDERING GRAPHICS FROM GEOMETRY STORE TO SAVE GEOMETRY CREATING TIME
      // const childGraphic = new Graphics({
      //   units: this.properties.units,
      //   darkColor: DARK_COLOR,
      //   darkAlpha: 0.5,
      //   clearColor: DARK_COLOR,
      //   clearAlpha: 0.5,
      //   index
      // })
      // childGraphic.visible = true
      // childGraphic.renderGraphic(child)
      // this.addChild(childGraphic)

      //* RENDERING GRAPHICS FROM GEOMETRY STORE TO SAVE GEOMETRY CREATING TIME
      // const graphic = this.retrieveGraphic(child, index)
      // graphic.visible = true
      // this.addChild(graphic)
    }
    console.timeEnd('render')
    return this
  }

  public featuresAtPosition(clientX: number, clientY: number): TIntersectItem[] {
    const checkintersect = (obj: Graphics): Graphics[] => {
      const intersected: Graphics[] = []
      // obj.visible = true
      obj.updateTransform()
      if (obj.containsPoint(new PIXI.Point(clientX, clientY))) {
        intersected.push(obj)
      } else {
        // obj.visible = false
      }
      return intersected
    }
    let intersected: TIntersectItem[] = []
    let intersectedchildren: Graphics[] = []
    this.children.forEach((child) => {
      if (child instanceof Graphics) {
        intersectedchildren = intersectedchildren.concat(checkintersect(child))
      }
    })
    intersected = intersectedchildren.map((obj) => {
      return {
        bounds: {
          minX: obj._bounds.minX,
          minY: obj._bounds.minY,
          maxX: obj._bounds.maxX,
          maxY: obj._bounds.maxY
        },
        properties: obj.properties,
        position: { x: obj.x, y: obj.y }
      }
    })
    return intersected
  }

  getElementByIndex(index: number): Graphics | undefined {
    return this.children.find((child) => {
      return child instanceof Graphics && child.properties.index === index
    }) as Graphics
  }
}

// This is a hack to get PIXI to use the Tess2 library for triangulation.
// implemented by extending the graphics library and overriding the triangulate function
// ``` js
// PIXI.graphicsUtils.buildPoly.triangulate = triangulate
// ```
// PIXI.graphicsUtils.buildPoly.triangulate = triangulate
/**
 * @deprecated
 */
// @ts-ignore no longer need tess2
function triangulate(
  graphicsData: PIXI.GraphicsData,
  graphicsGeometry: PIXI.GraphicsGeometry
): void {
  let points = graphicsData.points
  const holes = graphicsData.holes
  const verts = graphicsGeometry.points
  const indices = graphicsGeometry.indices

  const holeArray: number[] = []

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i]
    holeArray.push(points.length / 2)
    points.push(points[0], points[1])
    points = points.concat(hole.points)
    points.push(hole.points[0], hole.points[1])
  }

  // TODO: offload this to a worker
  // Tesselate
  const res = Tess2.tesselate({
    contours: [points],
    windingRule: Tess2.WINDING_ODD,
    elementType: Tess2.POLYGONS,
    polySize: 3,
    vertexSize: 2
  })

  if (res == undefined) {
    return
  }
  if (!res.elements.length) {
    return
  }

  const vrt = res.vertices
  // const elm = res.elements

  const vertPos = verts.length / 2

  for (let i = 0; i < res.elements.length; i++) {
    indices.push(res.elements[i] + vertPos)
  }

  for (let i = 0; i < vrt.length; i++) {
    verts.push(vrt[i])
  }
}

// Custom filter to replace a color with transparency
const ChromaFilter = new PIXI.Filter(
  undefined,
  [
    'varying vec2 vTextureCoord;',
    'uniform float thresholdSensitivity;',
    'uniform float smoothing;',
    'uniform vec3 colorToReplace;',
    'uniform sampler2D uSampler;',
    'void main() {',
    'vec4 textureColor = texture2D(uSampler, vTextureCoord);',
    'float maskY = 0.2989 * colorToReplace.r + 0.5866 * colorToReplace.g + 0.1145 * colorToReplace.b;',
    'float maskCr = 0.7132 * (colorToReplace.r - maskY);',

    'float maskCb = 0.5647 * (colorToReplace.b - maskY);',
    'float Y = 0.2989 * textureColor.r + 0.5866 * textureColor.g + 0.1145 * textureColor.b;',
    'float Cr = 0.7132 * (textureColor.r - Y);',
    'float Cb = 0.5647 * (textureColor.b - Y);',
    'float blendValue = smoothstep(thresholdSensitivity, thresholdSensitivity + smoothing, distance(vec2(Cr, Cb), vec2(maskCr, maskCb)));',
    'gl_FragColor = vec4(textureColor.rgb, textureColor.a * blendValue);',
    '}'
  ].join('\n')
)
ChromaFilter.uniforms.thresholdSensitivity = 0
ChromaFilter.uniforms.smoothing = 0.2
ChromaFilter.uniforms.colorToReplace = chroma(CLEAR_COLOR).rgb() // [0, 0, 0] black
