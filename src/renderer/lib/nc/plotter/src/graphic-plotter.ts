// Graphic plotter
// Takes nodes and turns them into graphics to be added to the image
// import * as Tree from '../tree'

import {
  GraphicType,
  InterpolateModeType
} from '../../parser/types'

import {
  ChildNode,
  DONE,
  GRAPHIC,
  INTERPOLATE_MODE,
  STEP_REPEAT_OPEN,
  STEP_REPEAT_CLOSE,
} from '../../parser/tree'

import {
  SHAPE,
  SEGMENT,
  MOVE,
  LINE,
  CCW_ARC,
  CW_ARC,
} from '../../parser/constants'

import type { Tool } from './tool-store'
import type { Location, Point } from './location-store'

import { FeatureTypeIdentifier } from '@src/renderer/types'

export const CW = 'cw'
export const CCW = 'ccw'

export type ArcDirection = typeof CW | typeof CCW

import * as Shapes from '@src/renderer/shapes'
import { ApertureTransform } from './aperture-transform-store'
import { vec2 } from 'gl-matrix'

export interface GraphicPlotter {
  plot: (
    node: ChildNode,
    tool: Tool,
    location: Location,
    transform: ApertureTransform
  ) => Shapes.Shape[]
}

export function createGraphicPlotter(): GraphicPlotter {
  const plotter = Object.create(GraphicPlotterPrototype)
  return plotter
}

interface GraphicPlotterImpl extends GraphicPlotter {
  _currentSurface: Shapes.Surface | undefined
  _arcDirection: ArcDirection | undefined
  // _ambiguousArcCenter: boolean
  _defaultGraphic: GraphicType | undefined
  _stepRepeats: Shapes.StepAndRepeat[]

  _setGraphicState: (node: ChildNode) => void

}


const GraphicPlotterPrototype: GraphicPlotterImpl = {
  _currentSurface: undefined,
  _arcDirection: undefined,
  // _ambiguousArcCenter: false,
  _defaultGraphic: undefined,
  _stepRepeats: [],

  plot(
    node: ChildNode,
    tool: Tool,
    location: Location,
    transform: ApertureTransform
  ): Shapes.Shape[] {
    const graphics: Shapes.Shape[] = []

    let nextGraphicType: GraphicType | undefined
    if (node.type !== GRAPHIC) {
      nextGraphicType = undefined
    } else if (node.graphic !== undefined) {
      nextGraphicType = node.graphic
    } else if (this._defaultGraphic !== undefined) {
      nextGraphicType = this._defaultGraphic
    }

    this._setGraphicState(node)



    // ** PAD
    if (nextGraphicType === SHAPE) {
      graphics.push(new Shapes.Pad({
        symbol: tool,
        x: location.endPoint.x,
        y: location.endPoint.y,
      }))
    }

    if (
      node.type === DONE ||
      (nextGraphicType === MOVE && this._currentSurface !== undefined) ||
      nextGraphicType === SHAPE ||
      node.type === STEP_REPEAT_OPEN ||
      node.type === STEP_REPEAT_CLOSE
    ) {
      if (this._currentSurface !== undefined) {
        graphics.push(this._currentSurface)
        this._currentSurface = undefined
      }
    }

    // ** LINE AND ARC
    if (nextGraphicType === SEGMENT) {
        if (this._arcDirection === undefined) {
          graphics.push(new Shapes.Line({
            symbol: tool,
            xs: location.startPoint.x,
            ys: location.startPoint.y,
            xe: location.endPoint.x,
            ye: location.endPoint.y,
          }))
        } else {
          const center: Point = {
            x: location.startPoint.x + location.arcOffsets.i,
            y: location.startPoint.y + location.arcOffsets.j,
          }
          // if (this._ambiguousArcCenter) {
          //   center = getAmbiguousArcCenter(location, this._arcDirection as ArcDirection)
          // }
          graphics.push(new Shapes.Arc({
            symbol: tool,
            xs: location.startPoint.x,
            ys: location.startPoint.y,
            xe: location.endPoint.x,
            ye: location.endPoint.y,
            xc: center.x,
            yc: center.y,
            clockwise: this._arcDirection === CW ? 1 : 0,
          }))
        }
    }

    if (this._stepRepeats.length > 0) {
      this._stepRepeats[0].shapes.push(...graphics)
      graphics.length = 0
    }
    if (node.type === STEP_REPEAT_CLOSE || node.type === DONE) {
      if (this._stepRepeats.length > 0) {
        graphics.push(this._stepRepeats.shift()!)
      }
    }
    if (node.type === STEP_REPEAT_OPEN) {
      if (this._stepRepeats.length > 0) {
        graphics.push(this._stepRepeats.shift()!)
      }
      if (location.stepRepeat.x > 1 || location.stepRepeat.y > 1 || location.stepRepeat.i != 0 || location.stepRepeat.j != 0) {
        this._stepRepeats.unshift(new Shapes.StepAndRepeat({
          shapes: [],
          repeats: new Array(location.stepRepeat.x * location.stepRepeat.y).fill(0).map((_, i) => {
            return {
              datum: vec2.fromValues(location.stepRepeat.i * Math.floor(i / location.stepRepeat.y), location.stepRepeat.j * (i % location.stepRepeat.y)),
              rotation: 0,
              mirror_x: 0,
              mirror_y: 0,
              scale: 1,
            }
          }),
        }))
      }
    }

    return graphics
  },

  // _setGraphicState(node: ChildNode) {
  //   if (node.type === INTERPOLATE_MODE) {
  //     const { mode } = node
  //     if (mode === CCW_ARC) this._arcDirection = CCW
  //     if (mode === CW_ARC) this._arcDirection = CW
  //     if (mode === LINE) this._arcDirection = undefined
  //   }

  //   // if (node.type === QUADRANT_MODE) {
  //   //   this._ambiguousArcCenter = node.quadrant === SINGLE
  //   // }

  //   if (node.type === GRAPHIC) {
  //     switch (node.graphic) {
  //       case SEGMENT: {
  //         this._defaultGraphic = SEGMENT
  //         break
  //       }
  //       case MOVE: {
  //         this._defaultGraphic = MOVE
  //         break
  //       }
  //       case SHAPE: {
  //         this._defaultGraphic = SHAPE
  //         break
  //       }
  //       default: {
  //         break
  //       }
  //     }
  //   }
  // },

  _setGraphicState(node: ChildNode): GraphicType | undefined {
    if (node.type === INTERPOLATE_MODE) {
      const {mode} = node
      this._arcDirection = arcDirectionFromMode(mode)

      if (mode === CW_ARC || mode === CCW_ARC || mode === LINE) {
        this._defaultGraphic = SEGMENT
      } else if (mode === MOVE) {
        this._defaultGraphic = MOVE
      } else {
        this._defaultGraphic = SHAPE
      }
    }

    if (node.type !== GRAPHIC) {
      return undefined
    }

    return node.graphic ?? this._defaultGraphic
  },

}

function arcDirectionFromMode(
  mode: InterpolateModeType | undefined
): ArcDirection | undefined {
  if (mode === CCW_ARC) return CCW
  if (mode === CW_ARC) return CW
  return undefined
}


// export function getAmbiguousArcCenter(location: Location, arcDirection: ArcDirection): Point {
//   const { startPoint, endPoint, arcOffsets } = location
//   const radius =
//     arcOffsets.a > 0
//       ? arcOffsets.a
//       : (arcOffsets.i ** 2 + arcOffsets.j ** 2) ** 0.5
//   // Get the center candidates and select the candidate with the smallest arc
//   const [_start, _end, center] = findCenterCandidates(location, radius)
//     .map(centerPoint => {
//       return getArcPositions(startPoint, endPoint, centerPoint, arcDirection)
//     })
//     .sort(([startA, endA], [startB, endB]) => {
//       const absSweepA = Math.abs(endA[2] - startA[2])
//       const absSweepB = Math.abs(endB[2] - startB[2])
//       return absSweepA - absSweepB
//     })[0]

//   return {
//     x: center[0],
//     y: center[1],
//   }
// }



// export function getArcPositions(
//   startPoint: Point,
//   endPoint: Point,
//   centerPoint: Point,
//   arcDirection: ArcDirection
// ): [start: Tree.ArcPosition, end: Tree.ArcPosition, center: Tree.Position] {
//   let startAngle = Math.atan2(
//     startPoint.y - centerPoint.y,
//     startPoint.x - centerPoint.x
//   )
//   let endAngle = Math.atan2(
//     endPoint.y - centerPoint.y,
//     endPoint.x - centerPoint.x
//   )

//   // If counter-clockwise, end angle should be greater than start angle
//   if (arcDirection === CCW) {
//     endAngle = endAngle > startAngle ? endAngle : endAngle + (Math.PI * 2)
//   } else {
//     startAngle = startAngle > endAngle ? startAngle : startAngle + (Math.PI * 2)
//   }

//   return [
//     [startPoint.x, startPoint.y, startAngle],
//     [endPoint.x, endPoint.y, endAngle],
//     [centerPoint.x, centerPoint.y],
//   ]
// }

// // Find arc center candidates by finding the intersection points
// // of two circles with `radius` centered on the start and end points
// // https://math.stackexchange.com/a/1367732
// function findCenterCandidates(location: Location, radius: number): Point[] {
//   // This function assumes that start and end are different points
//   const { x: x1, y: y1 } = location.startPoint
//   const { x: x2, y: y2 } = location.endPoint

//   // Distance between the start and end points
//   const [dx, dy] = [x2 - x1, y2 - y1]
//   const [sx, sy] = [x2 + x1, y2 + y1]
//   const distance = Math.sqrt(dx ** 2 + dy ** 2)

//   // If the distance to the midpoint equals the arc radius, then there is
//   // exactly one intersection at the midpoint; if the distance to the midpoint
//   // is greater than the radius, assume we've got a rounding error and just use
//   // the midpoint
//   if (radius <= distance / 2) {
//     return [{ x: x1 + dx / 2, y: y1 + dy / 2 }]
//   }

//   // No good name for these variables, but it's how the math works out
//   const factor = Math.sqrt((4 * radius ** 2) / distance ** 2 - 1)
//   const [xBase, yBase] = [sx / 2, sy / 2]
//   const [xAddend, yAddend] = [(dy * factor) / 2, (dx * factor) / 2]

//   return [
//     { x: xBase + xAddend, y: yBase - yAddend },
//     { x: xBase - xAddend, y: yBase + yAddend },
//   ]
// }

