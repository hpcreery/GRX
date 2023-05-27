import { CLEAR, DARK, IN, MM, UnitsType } from '@hpcreery/tracespace-parser'
import {
  ImageTree,
  ImageGraphic,
  ImageShape,
  PathSegment,
  Shape,
  Position,
  ArcPosition,
  positionsEqual,
  IMAGE_SHAPE,
  IMAGE_PATH,
  CIRCLE,
  RECTANGLE,
  POLYGON,
  OUTLINE,
  LAYERED_SHAPE,
  LINE
} from '@hpcreery/tracespace-plotter'
import * as PIXI from '@pixi/webworker'
import chroma from 'chroma-js'
import * as Tess2 from 'tess2-ts'
import { TIntersectItem } from './types'

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

export interface GraphicsOptions {
  units: UnitsType
  polarity: string
  darkColor: number
  darkAlpha: number
  clearColor: number
  clearAlpha: number
  outlineWidth: number
  outlineMode: boolean
  scale: number
  index: number
  dcode?: string
}

const GraphicsOptionsDefaults: GraphicsOptions = {
  units: IN,
  polarity: DARK,
  darkColor: DARK_COLOR,
  darkAlpha: DARK_ALPHA,
  clearColor: CLEAR_COLOR,
  clearAlpha: CLEAR_ALPHA,
  outlineWidth: OUTLINE_WIDTH,
  outlineMode: OUTLINE_MODE,
  scale: SCALE,
  dcode: undefined,
  index: 0
}

export class Graphics extends PIXI.Graphics {
  public properties: GraphicsOptions
  constructor(options: Partial<GraphicsOptions> = {}) {
    super()

    this.properties = { ...GraphicsOptionsDefaults, ...options }

    if (this.properties.units === IN) {
      this.properties.scale = SCALE
    } else if (this.properties.units === MM) {
      this.properties.scale = SCALE / 25.4
    } else {
      throw new Error(`Unknown units: ${this.properties.units}`)
    }
  }

  public renderGraphic(node: ImageGraphic): this {
    this.properties.polarity = node.polarity

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
    } else {
      if (node.type === IMAGE_PATH) {
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
  constructor(tree: ImageTree) {
    super({ units: tree.units })
    this.filters = [ChromaFilter]
    this.tint = randomColor()
    this.uid = uid()
    this.renderImageTree(tree)
  }

  public renderImageTree(tree: ImageTree): this {
    const { children } = tree
    for (const [index, child] of children.entries()) {
      this.renderGraphic(child)
      this.moveTo(0, 0)
      const childGraphic = new Graphics({
        units: this.properties.units,
        darkColor: DARK_COLOR,
        darkAlpha: 0.5,
        clearColor: DARK_COLOR,
        clearAlpha: 0.5,
        index,
        dcode: child.dcode
      })
      childGraphic.visible = false
      childGraphic.renderGraphic(child)
      this.addChild(childGraphic)
    }
    return this
  }

  public featuresAtPosition(clientX: number, clientY: number): TIntersectItem[] {
    const checkintersect = (obj: Graphics): Graphics[] => {
      const intersected: Graphics[] = []
      obj.visible = true
      obj.updateTransform()
      if (obj.containsPoint(new PIXI.Point(clientX, clientY))) {
        intersected.push(obj)
        console.log(obj.properties.dcode, obj.properties.index)
      } else {
        obj.visible = false
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
        dcode: obj.properties.dcode,
        index: obj.properties.index
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
