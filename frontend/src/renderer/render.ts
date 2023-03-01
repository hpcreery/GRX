// import {s} from 'hastscript'

// import {random as createId} from '@tracespace/xml-id'
import type {
  ImageGraphic,
  ImageShape,
  ImagePath,
  ImageRegion,
  PathSegment,
  Shape,
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

import type {SvgElement} from './types'

export function renderGraphic(node: ImageGraphic): PIXI.Graphics {
  if (node.type === IMAGE_SHAPE) {
    return renderShape(node)
  }

  return renderPath(node)
}

export function renderShape(node: ImageShape): PIXI.Graphics {
  const {shape} = node

  return shapeToElement(shape)
}

export function shapeToElement(shape: Shape): PIXI.Graphics {
  switch (shape.type) {
    case CIRCLE: {
      const {cx, cy, r} = shape
      // return s('circle', {cx, cy: -cy, r})

      // TODO: Implement this
      console.log("RENDERING CIRCLE (development): ", shape)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xffffff);
      graphics.drawCircle(cx, cy, r);
      graphics.endFill();
      return graphics;
    }

    case RECTANGLE: {
      const {x, y, xSize: width, ySize: height, r} = shape
      // return s('rect', {
      //   x,
      //   y: -y - height,
      //   width,
      //   height,
      //   rx: r,
      //   ry: r,
      // })

      // TODO: Implement this
      console.log("RENDERING RECTANGLE (development): ", shape)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xffffff);
      graphics.drawRoundedRect(x, y, width, height, r || 0);
      graphics.endFill();
      return graphics;
    }

    case POLYGON: {
      // const points = shape.points.map(([x, y]) => `${x},${-y}`).join(' ')
      // return s('polygon', {points})

      // TODO: Implement this
      console.log("RENDERING POLYGON (development): ", shape)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xffffff);
      graphics.drawPolygon(shape.points.flat());
      graphics.endFill();
      return graphics;
    }

    case OUTLINE: {
      // return s('path', {d: segmentsToPathData(shape.segments)})
      
      // TODO: Implement this
      console.log("RENDERING OUTLINE (development): ", shape)
      const graphics = new CustomGraphics();
      graphics.beginFill(0xDE3249);
      graphics.drawPath(shape.segments);
      graphics.endFill();
      return graphics;
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
      console.log("RENDERING LAYERED_SHAPE (development): ", shape)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xDE3249);
      graphics.drawRect(50, 50, 100, 100);
      graphics.endFill();
      return graphics;

    }

    default: {
      // return s('g')

      // TODO: Implement this
      console.log("RENDERING DEFAULT (development): ", shape)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xDE3249);
      graphics.drawRect(50, 50, 100, 100);
      graphics.endFill();
      return graphics;
    }
  }
}

export function renderPath(node: ImagePath | ImageRegion): PIXI.Graphics {
  // const pathData = segmentsToPathData(node.segments)
  // const props =
  //   node.type === IMAGE_PATH ? {strokeWidth: node.width, fill: 'none'} : {}

  // return s('path', {...props, d: pathData})

  // TODO: Works but needs more testing. need to add if fill or not
  console.log("RENDERING PATH (development): ", node)
  const graphics = new CustomGraphics();
  // @ts-ignore
  // graphics._holeMode = true
  graphics.beginFill(0xDE3249);
  graphics.drawPath(node.segments);
  graphics.endFill();
  graphics.closePath();
  // graphics.stroke()
  // graphics.closePath();
  // graphics.
  return graphics;
}

class CustomGraphics extends PIXI.Graphics {
  constructor() {
    super();
    console.log("CustomGraphicsFill: ", this.fill)
  }

  public drawPath(segments: PathSegment[]): this {
    for (const [index, next] of segments.entries()) {
      // console.log("DRAWING PATH SEGMENT: ", next)
      const previous = index > 0 ? segments[index - 1] : undefined
      const {start, end} = next
      
  
      // TODO: WHAT IS THIS?
      if (previous === undefined || !positionsEqual(previous.end, start)) {
        // pathCommands.push(`M${start[0]} ${-start[1]}`)
        this.moveTo(start[0]*100, start[1]*100);
      }
  
      if (next.type === LINE) {
        this.lineStyle(1, 0x00FF00)
        // console.log("DRAWING LINE: ", next)
        this.lineTo(end[0]*100, end[1]*100);
      } else {
        this.lineStyle(1, 0xFFFFFF)
        // console.log("DRAWING ARC: ", next)
        const {start, end, radius, center} = next
        this.arc(center[0]*100, center[1]*100, radius*100, start[2], end[2]);
      }
    }
    return this;
  }
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

