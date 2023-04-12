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
import * as PIXI from '@pixi/webworker'
import * as Tess2 from 'tess2-ts'

const darkColor = 0xffffff
// let darkColor = Math.floor(Math.random() * 16777215)
const darkAlpha: number = 1
const clearColor = 0x000000
const clearAlpha: number = 1

const scale: number = 100
const outlineMode = false

const randomColor = () => Math.floor(Math.random() * 16777215)
const uid = () =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

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
    '}',
  ].join('\n')
)
ChromaFilter.uniforms.thresholdSensitivity = 0
ChromaFilter.uniforms.smoothing = 0.2
ChromaFilter.uniforms.colorToReplace = [0, 0, 0]

export function renderGraphics(tree: ImageTree): GerberGraphics {
  // darkColor = Math.floor(Math.random() * 16777215)
  const { size, children } = tree

  const graphic = new GerberGraphics()
  graphic.filters = [ChromaFilter]

  for (const [index, child] of children.entries()) {
    graphic.renderGraphic(child)
    graphic.moveTo(0, 0)
  }

  console.log('Done rendering')
  return graphic
}

export class GerberGraphics extends PIXI.Graphics {
  uid: string
  constructor() {
    super()
    this.tint = randomColor()
    this.uid = uid()
    // @ts-ignore
    // console.log(this.curves)
  }

  renderGraphic(node: ImageGraphic): this {
    if (node.type === IMAGE_SHAPE) {
      if (outlineMode) {
        this.beginFill(darkColor, 0)
        this.lineStyle({
          color: darkColor,
          width: 0.05,
          alpha: 1,
        })
      } else {
        if (node.polarity == DARK) {
          this.beginFill(darkColor, darkAlpha)
        } else {
          this.beginFill(clearColor, clearAlpha)
        }
        this.lineStyle({
          width: 0,
          alpha: 0,
        })
      }
      this.renderShape(node)
    } else {
      if (node.type === IMAGE_PATH) {
        if (node.polarity == DARK) {
          this.beginFill(darkColor, 0)
        } else {
          this.beginFill(clearColor, 0)
        }
        this.lineStyle({
          width: node.width * scale,
          color: node.polarity == DARK ? darkColor : clearColor,
          alpha: node.polarity == DARK ? darkAlpha : clearAlpha,
          cap: PIXI.LINE_CAP.ROUND,
          join: PIXI.LINE_JOIN.ROUND,
        })
        this.drawPolyLine(node.segments)
      } else {
        if (node.polarity == DARK) {
          this.beginFill(darkColor, darkAlpha)
        } else {
          this.beginFill(clearColor, clearAlpha)
        }
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
        const parentColor = this._fillStyle.color
        for (const [index, layerShape] of shape.shapes.entries()) {
          const color =
            parentColor == darkColor
              ? layerShape.erase === true
                ? clearColor
                : darkColor
              : layerShape.erase === true
              ? darkColor
              : clearColor
          this.beginFill(color, parentColor == darkColor ? darkAlpha : clearAlpha)
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
    // this.geometry.bounds
    this.lineTo(lastHome[0] * scale, lastHome[1] * scale)
    return this
  }

  render(r: PIXI.Renderer) {
    super.render(r)
  }
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

  // TODO: offload this to a worker
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
