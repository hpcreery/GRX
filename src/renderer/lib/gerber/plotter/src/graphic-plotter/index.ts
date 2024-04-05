// Graphic plotter
// Takes nodes and turns them into graphics to be added to the image
import {
  GerberNode,
  GraphicType,
  DARK,
  LOAD_POLARITY,
  GRAPHIC,
  SHAPE,
  SEGMENT,
  MOVE,
  DONE,
  LINE,
  CCW_ARC,
  CW_ARC,
  SINGLE,
  INTERPOLATE_MODE,
  QUADRANT_MODE,
  REGION_MODE,
  STEP_REPEAT_OPEN,
  STEP_REPEAT_CLOSE,
} from '@hpcreery/tracespace-parser'

import type { Tool } from '../tool-store'
import type { Location } from '../location-store'

import { FeatureTypeIdentifyer } from '@src/renderer/types'

export const CW = 'cw'
export const CCW = 'ccw'

export type ArcDirection = typeof CW | typeof CCW

import * as Shapes from '@src/renderer/shapes'
import { ApertureTransform } from '../aperture-transform-store'
import { vec2 } from 'gl-matrix'

export interface GraphicPlotter {
  plot: (
    node: GerberNode,
    tool: Tool | undefined,
    location: Location,
    transform: ApertureTransform
  ) => Shapes.Shape[]
}

export function createGraphicPlotter(): GraphicPlotter {
  const plotter = Object.create(GraphicPlotterPrototype)

  // return filetype === DRILL
  //   ? Object.assign(plotter, DrillGraphicPlotterTrait)
  //   : plotter
  return plotter
}

interface GraphicPlotterImpl extends GraphicPlotter {
  _currentSurface: Shapes.Surface | undefined
  _arcDirection: ArcDirection | undefined
  _ambiguousArcCenter: boolean
  _regionMode: boolean
  _defaultGraphic: GraphicType | undefined
  _stepRepeats: Shapes.StepAndRepeat[]

  _setGraphicState: (node: GerberNode) => void

}


const GraphicPlotterPrototype: GraphicPlotterImpl = {
  _currentSurface: undefined,
  _arcDirection: undefined,
  _ambiguousArcCenter: false,
  _regionMode: false,
  _defaultGraphic: undefined,
  _stepRepeats: [],

  plot(
    node: GerberNode,
    tool: Tool | undefined,
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
        rotation: transform.rotation,
        mirror_x: transform.mirror == 'x' || transform.mirror == 'xy' ? 1 : 0,
        mirror_y: transform.mirror == 'y' || transform.mirror == 'xy' ? 1 : 0,
        resize_factor: transform.scale,
        polarity: transform.polarity === DARK ? 1 : 0,
      }))
    }

    // ** SURFACE
    if (nextGraphicType === SEGMENT && this._regionMode) {

      if (this._currentSurface === undefined) {
        this._currentSurface = new Shapes.Surface({
          polarity: transform.polarity === DARK ? 1 : 0,
        })
        this._currentSurface.addContour(new Shapes.Contour({
          xs: location.startPoint.x,
          ys: location.startPoint.y,
        }))
      }
      if (this._arcDirection === undefined) {
        this._currentSurface.contours[0].addSegment(new Shapes.Contour_Line_Segment({
          x: location.endPoint.x,
          y: location.endPoint.y,
        }))
      } else {
        this._currentSurface.contours[0].addSegment(new Shapes.Contour_Arc_Segment({
          x: location.endPoint.x,
          y: location.endPoint.y,
          xc: location.startPoint.x + location.arcOffsets.i,
          yc: location.startPoint.y + location.arcOffsets.j,
          clockwise: this._arcDirection === CW ? 1 : 0,
        }))
      }
    }
    if (
      node.type === REGION_MODE ||
      node.type === DONE ||
      (nextGraphicType === MOVE && this._currentSurface !== undefined) ||
      nextGraphicType === SHAPE ||
      node.type === LOAD_POLARITY
    ) {
      if (this._currentSurface !== undefined) {
        graphics.push(this._currentSurface)
        this._currentSurface = undefined
      }
    }

    // ** LINE AND ARC
    if (nextGraphicType === SEGMENT && !this._regionMode) {
      if (tool?.type !== FeatureTypeIdentifyer.MACRO_DEFINITION) {
        if (this._arcDirection === undefined) {
          graphics.push(new Shapes.Line({
            symbol: tool,
            polarity: transform.polarity === DARK ? 1 : 0,
            xs: location.startPoint.x,
            ys: location.startPoint.y,
            xe: location.endPoint.x,
            ye: location.endPoint.y,
          }))
        } else {
          graphics.push(new Shapes.Arc({
            symbol: tool,
            polarity: transform.polarity === DARK ? 1 : 0,
            xs: location.startPoint.x,
            ys: location.startPoint.y,
            xe: location.endPoint.x,
            ye: location.endPoint.y,
            xc: location.startPoint.x + location.arcOffsets.i,
            yc: location.startPoint.y + location.arcOffsets.j,
            clockwise: this._arcDirection === CW ? 1 : 0,
          }))
        }
      }
    }

    if (node.type === STEP_REPEAT_OPEN) {
      this._stepRepeats.unshift(new Shapes.StepAndRepeat({
        shapes: [],
        repeats: new Array(location.stepRepeat.x * location.stepRepeat.y).fill(0).map((_, i) => {
          return {
            datum: vec2.fromValues(location.stepRepeat.i * Math.floor(i / location.stepRepeat.x), location.stepRepeat.j * (i % location.stepRepeat.x)),
            rotation: 0,
            mirror_x: 0,
            mirror_y: 0,
            scale: 1,
          }
        }),
      }))
    }
    if (this._stepRepeats.length > 0 && node.type === GRAPHIC) {
      this._stepRepeats[0].shapes.push(...graphics)
      graphics.length = 0
    }
    if (node.type === DONE) {
      if (this._stepRepeats.length > 0) {
        graphics.push(this._stepRepeats.shift()!)
      }
    }
    if (node.type === STEP_REPEAT_CLOSE) {
      if (this._stepRepeats.length > 0) {
        graphics.push(this._stepRepeats.shift()!)
      }
    }

    return graphics
  },

  _setGraphicState(node: GerberNode) {
    if (node.type === INTERPOLATE_MODE) {
      const { mode } = node
      if (mode === CCW_ARC) this._arcDirection = CCW
      if (mode === CW_ARC) this._arcDirection = CW
      if (mode === LINE) this._arcDirection = undefined
    }

    if (node.type === QUADRANT_MODE) {
      this._ambiguousArcCenter = node.quadrant === SINGLE
    }

    if (node.type === REGION_MODE) {
      this._regionMode = node.region
    }

    if (node.type === GRAPHIC) {
      switch (node.graphic) {
        case SEGMENT: {
          this._defaultGraphic = SEGMENT
          break
        }
        case MOVE: {
          this._defaultGraphic = MOVE
          break
        }
        case SHAPE: {
          this._defaultGraphic = SHAPE
          break
        }
        default: {
          break
        }
      }
    }
  },

}

// const DrillGraphicPlotterTrait: Partial<GraphicPlotterImpl> = {
//   _defaultGraphic: SHAPE,
//   _ambiguousArcCenter: true,

//   _setGraphicState(node: GerberNode): GraphicType | undefined {
//     if (node.type === INTERPOLATE_MODE) {
//       const {mode} = node
//       this._arcDirection = arcDirectionFromMode(mode)

//       if (mode === CW_ARC || mode === CCW_ARC || mode === LINE) {
//         this._defaultGraphic = SEGMENT
//       } else if (mode === MOVE) {
//         this._defaultGraphic = MOVE
//       } else {
//         this._defaultGraphic = SHAPE
//       }
//     }

//     if (node.type !== GRAPHIC) {
//       return undefined
//     }

//     return node.graphic ?? this._defaultGraphic
//   },
// }

