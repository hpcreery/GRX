import { CLEAR, DARK, IN, MM, UnitsType } from '@hpcreery/tracespace-parser'
import type {
  ImageTree,
  ImageGraphic,
  ImageShape,
  PathSegment,
  Shape,
  Position,
  ArcPosition
} from '@hpcreery/tracespace-plotter'
import {
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
// import geometry from './geometry_math'

const DARK_COLOR = 0xffffff
const DARK_ALPHA = 1

const CLEAR_COLOR = 0x000000
const CLEAR_ALPHA = 1

const OUTLINE_MODE = false

let scale = 100

const randomColor = (): number => Math.floor(Math.random() * 16777215)
const uid = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

export class Graphics extends PIXI.Graphics {
  units: UnitsType
  unitScale: number
  constructor(units: UnitsType) {
    super()
    this.units = units
    if (units === IN) {
      this.unitScale = scale
    } else if (units === MM) {
      this.unitScale = scale / 25.4
    } else {
      throw new Error(`Unknown units: ${units}`)
    }
  }

  public renderGraphic(node: ImageGraphic): this {
    const SCALE = this.unitScale
    if (node.type === IMAGE_SHAPE) {
      if (OUTLINE_MODE) {
        this.beginFill(DARK_COLOR, 0)
        this.lineStyle({
          color: DARK_COLOR,
          width: 0.05,
          alpha: 1
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
        this.drawPolyLine(node.segments)
      } else {
        if (node.polarity == DARK) {
          this.beginFill(DARK_COLOR, DARK_ALPHA)
        } else {
          this.beginFill(CLEAR_COLOR, CLEAR_ALPHA)
        }
        this.lineStyle({
          width: 0,
          color: node.polarity == DARK ? DARK_COLOR : CLEAR_COLOR,
          alpha: 0,
          cap: PIXI.LINE_CAP.ROUND,
          join: PIXI.LINE_JOIN.ROUND
        })
        this.drawContour(node.segments)
      }
    }
    this.endFill()
    return this
  }

  private renderShape(node: ImageShape): this {
    const { shape } = node
    return this.shapeToElement(shape)
  }

  private shapeToElement(shape: Shape): this {
    const SCALE = this.unitScale
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

  private drawPolyLine(segments: PathSegment[]): this {
    const SCALE = this.unitScale
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
    const SCALE = this.unitScale
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
    // this.geometry.bounds
    this.lineTo(lastHome[0] * SCALE, lastHome[1] * SCALE)
    return this
  }
}

export class GerberGraphics extends Graphics {
  uid: string
  constructor(tree: ImageTree) {
    super(tree.units)
    this.filters = [ChromaFilter]
    this.tint = randomColor()
    this.uid = uid()
    this.renderImageTree(tree)
  }

  public renderImageTree(tree: ImageTree): this {
    const { children } = tree
    for (const child of children) {
      this.renderGraphic(child)
      this.moveTo(0, 0)
      const childGraphic = new Graphics(this.units)
      childGraphic.visible = false
      childGraphic.renderGraphic(child)
      this.addChild(childGraphic)
    }
    return this
  }

  public featuresAtPosition(
    clientX: number,
    clientY: number
  ): { bounds: { minX: number; minY: number; maxX: number; maxY: number } }[] {
    const checkintersect = (obj: Graphics): Graphics[] => {
      let intersected: Graphics[] = []
      obj.visible = true
      obj.updateTransform()
      if (obj.containsPoint(new PIXI.Point(clientX, clientY))) {
        intersected.push(obj)
      } else {
        obj.visible = false
      }
      // TODO: check if point is inside lines
      // if (obj.line.width != 0) {
      //   let point = obj.worldTransform.applyInverse(new PIXI.Point(clientX, clientY))
      //   let intersect = geometry.pointInsidePolygon(point.x, point.y, obj.geometry.points)
      //   if (intersect) {
      //     intersected.push(obj)
      //   }
      // }
      return intersected
    }
    let intersected: { bounds: { minX: number; minY: number; maxX: number; maxY: number } }[] = []
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
        }
      }
    })
    return intersected
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
