// Plot a tool macro as shapes
import type { MacroPrimitiveCode, MacroValue } from '@hpcreery/tracespace-parser'
import {
  MACRO_VARIABLE,
  MACRO_PRIMITIVE,
  MACRO_CIRCLE,
  MACRO_VECTOR_LINE_DEPRECATED,
  MACRO_VECTOR_LINE,
  MACRO_CENTER_LINE,
  MACRO_LOWER_LEFT_LINE_DEPRECATED,
  MACRO_OUTLINE,
  MACRO_POLYGON,
  MACRO_MOIRE_DEPRECATED,
  MACRO_THERMAL
} from '@hpcreery/tracespace-parser'

import { rotateAndShift } from '../coordinate-math'

import * as Tree from '../tree'
import type { MacroTool } from '../tool-store'


import * as Symbols from '@src/rendererv2/symbols'
import * as Shapes from '@src/rendererv2/shapes'

type VariableValues = Record<string, number>

export function createMacro(tool: MacroTool): Symbols.MacroSymbol {
  const shapes: Shapes.Shape[] = []
  const variableValues: VariableValues = Object.fromEntries(
    tool.variableValues.map((value, index) => [`$${index + 1}`, value])
  )

  for (const block of tool.macro) {
    if (block.type === MACRO_VARIABLE) {
      variableValues[block.name] = solveExpression(block.value, variableValues)
    }

    if (block.type === MACRO_PRIMITIVE) {
      const parameters = block.parameters.map((p) => {
        return solveExpression(p, variableValues)
      })

      shapes.push(createMacroPrimitive(block.code, parameters))
    }
  }

  return new Symbols.MacroSymbol({
    id: `${tool.name}-D${tool.dcode}`,
    shapes,
    flatten: true
  })
}

const rotate = (p: Tree.Position, angle: number): Tree.Position => rotateAndShift(p, [0, 0], angle)

function solveExpression(expression: MacroValue, variables: VariableValues): number {
  if (typeof expression === 'number') return expression
  if (typeof expression === 'string') return variables[expression]

  const left = solveExpression(expression.left, variables)
  const right = solveExpression(expression.right, variables)

  switch (expression.operator) {
    case '+': {
      return left + right
    }

    case '-': {
      return left - right
    }

    case 'x': {
      return left * right
    }

    case '/': {
      return left / right
    }
  }
}

function createMacroPrimitive(code: MacroPrimitiveCode, parameters: number[]): Shapes.Shape {
  switch (code) {
    case MACRO_CIRCLE: {
      return plotCircle(parameters)
    }

    case MACRO_VECTOR_LINE:
    case MACRO_VECTOR_LINE_DEPRECATED: {
      return plotVectorLine(parameters)
    }

    case MACRO_CENTER_LINE: {
      return plotCenterLine(parameters)
    }

    case MACRO_LOWER_LEFT_LINE_DEPRECATED: {
      return plotLowerLeftLine(parameters)
    }

    case MACRO_OUTLINE: {
      return plotOutline(parameters)
    }

    case MACRO_POLYGON: {
      return plotPolygon(parameters)
    }

    case MACRO_MOIRE_DEPRECATED: {
      return plotMoire(parameters)
    }

    case MACRO_THERMAL: {
      return plotThermal(parameters)
    }
  }
}

function plotCircle(parameters: number[]): Shapes.Primitive {
  const [exposure, diameter, cx0, cy0, degrees] = parameters
  const [cx, cy] = rotate([cx0, cy0], degrees)

  return new Shapes.Pad({
    polarity: exposure,
    x: cx,
    y: cy,
    symbol: new Symbols.RoundSymbol({
      outer_dia: diameter,
      inner_dia: 0
    })
  })
}

function plotVectorLine(parameters: number[]): Shapes.Primitive {
  const [exposure, width, sx, sy, ex, ey, degrees] = parameters
  const [xs, ys] = rotate([sx, sy], degrees)
  const [xe, ye] = rotate([ex, ey], degrees)

  return new Shapes.Line({
    polarity: exposure,
    xs: xs,
    ys: ys,
    xe: xe,
    ye: ye,
    symbol: new Symbols.SquareSymbol({
      width: width,
      height: 0,
      inner_dia: 0
    })
  })
}

function plotCenterLine(parameters: number[]): Shapes.Primitive {
  const [exposure, width, height, cx, cy, degrees] = parameters
  const [x, y] = rotate([cx, cy], degrees)

  return new Shapes.Pad({
    polarity: exposure,
    rotation: degrees,
    x: x,
    y: y,
    symbol: new Symbols.RectangleSymbol({
      width: height,
      height: width,
      inner_dia: 0
    })
  })
}

function plotLowerLeftLine(parameters: number[]): Shapes.Primitive {
  const [exposure, width, height, x, y, degrees] = parameters
  const [xs, ys] = rotate([x, y], degrees)

  return new Shapes.Pad({
    polarity: exposure,
    rotation: degrees,
    x: xs,
    y: ys,
    symbol: new Symbols.RectangleSymbol({
      width: width,
      height: height,
      inner_dia: 0
    })
  })
}

function plotOutline(parameters: number[]): Shapes.Surface {
  const [exposure, , ...coords] = parameters.slice(0, -1)
  const degrees = parameters[parameters.length - 1]
  const [xs, ys] = rotate([coords[0], coords[1]], degrees)

  const segments = coords
    .map((p, i) => {
      if (i % 2 === 0 && i >= 2) {
        const [x, y] = rotate([p, coords[i + 1]], degrees)
        return new Shapes.Contour_Line_Segment({
          x: x,
          y: y
        })
      }
      return undefined
    })
    .filter((s): s is Shapes.Contour_Line_Segment => s !== undefined)
  return new Shapes.Surface({
    polarity: exposure
  }).addContour(
    new Shapes.Contour({
      xs: xs,
      ys: ys
    }).addSegments(segments)
  )
}

function plotPolygon(parameters: number[]): Shapes.Primitive {
  const [exposure, vertices, cx, cy, diameter, degrees] = parameters

  const [x, y] = rotate([cx, cy], degrees)

  return new Shapes.Pad({
    polarity: exposure,
    x: x,
    y: y,
    rotation: degrees,
    symbol: new Symbols.PolygonSymbol({
      outer_dia: diameter,
      corners: vertices,
      inner_dia: 0,
      line_width: 0,
      angle: 0
    })
  })
}

function plotMoire(parameters: number[]): Shapes.Primitive {
  const [cx0, cy0, d, ringThx, ringGap, ringN, lineThx, lineLength, degrees] = parameters
  const [cx, cy] = rotate([cx0, cy0], degrees)

  return new Shapes.Pad({
    polarity: 1,
    x: cx,
    y: cy,
    rotation: degrees,
    symbol: new Symbols.MoireSymbol({
      outer_dia: d,
      ring_gap: ringGap,
      ring_width: ringThx,
      num_rings: ringN,
      line_width: lineThx,
      line_length: lineLength,
      angle: 0
    })
  })
}

function plotThermal(parameters: number[]): Shapes.Primitive {
  const [cx0, cy0, od, id, gap, degrees] = parameters
  const [x, y] = rotate([cx0, cy0], degrees)

  return new Shapes.Pad({
    polarity: 1,
    x: x,
    y: y,
    rotation: degrees,
    symbol: new Symbols.SquareRoundThermalSymbol({
      outer_dia: od,
      inner_dia: id,
      gap: gap,
      num_spokes: 4,
      angle: 0
    })
  })
}
