import { FeatureTypeIdentifier } from "@src/types"
import { describe, expect, it } from "vitest"
import { MACRO_PRIMITIVE, MACRO_VARIABLE } from "@hpcreery/tracespace-parser"
import { GerberLexer, GerberToTreeVisitor, parseGerberWithChevrotain, parser } from "./parser"

import fullCircleGerber from "../testdata/gerbers/arc-strokes/full-circle.gbr?raw"
import outlinePrimitiveGerber from "../testdata/gerbers/macro-primitives/outline-primitive.gbr?raw"
import thermalPrimitiveGerber from "../testdata/gerbers/macro-primitives/thermal-primitive.gbr?raw"
import vectorPrimitiveGerber from "../testdata/gerbers/macro-primitives/vector-primitive.gbr?raw"
import regionWithLinesGerber from "../testdata/gerbers/regions/region-with-lines.gbr?raw"
import stepRepeatGerber from "../testdata/gerbers/step-repeats/one-polarity.gbr?raw"
import singleSegmentGerber from "../testdata/gerbers/strokes/circle-tool-single-segment.gbr?raw"

function parseAndPlot(input: string) {
  return parseGerberWithChevrotain(input)
}

function parseAndVisit(input: string) {
  const lexing = GerberLexer.tokenize(input)
  expect(lexing.errors).toHaveLength(0)

  parser.input = lexing.tokens
  const cst = parser.program()
  expect(parser.errors.map((error) => error.message)).toEqual([])

  const visitor = new GerberToTreeVisitor()
  const image = visitor.visit(cst)
  return { visitor, image }
}

describe("Gerber parser (Chevrotain)", () => {
  it("parses a single-segment stroke and emits a line", () => {
    const image = parseAndPlot(singleSegmentGerber)
    const lines = image.children.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(lines.length).toBeGreaterThan(0)
  })

  it("parses full-circle arc fixture and emits arcs", () => {
    const image = parseAndPlot(fullCircleGerber)
    const arcs = image.children.filter((shape) => shape.type === FeatureTypeIdentifier.ARC)
    expect(arcs.length).toBeGreaterThan(0)
  })

  it("parses region fixture and emits surfaces", () => {
    const image = parseAndPlot(regionWithLinesGerber)
    const surfaces = image.children.filter((shape) => shape.type === FeatureTypeIdentifier.SURFACE)
    expect(surfaces.length).toBeGreaterThan(0)
  })

  it("parses step-repeat fixture and emits step-and-repeat", () => {
    const image = parseAndPlot(stepRepeatGerber)
    const repeats = image.children.filter((shape) => shape.type === FeatureTypeIdentifier.STEP_AND_REPEAT)
    expect(repeats.length).toBeGreaterThan(0)
  })

  it("parses macro aperture fixtures and emits geometry", () => {
    const image = parseAndPlot(vectorPrimitiveGerber)
    expect(image.children.length).toBeGreaterThan(0)
  })

  it("parses AM variable expressions into macro blocks", () => {
    const variableExpressionMacroGerber = `%FSLAX34Y34*%
%MOIN*%
%AMVARTEST*
$1=0.5*
$2=$1x2+0.1*
1,1,$2,0,0*
%
%ADD10VARTEST*%
D10*
X0Y0D03*
M02*`

    const { visitor } = parseAndVisit(variableExpressionMacroGerber)
    const macroNode = visitor.macroDefinitions.VARTEST

    expect(macroNode).toBeDefined()

    const variableBlocks = macroNode?.filter((child) => child.type === MACRO_VARIABLE) ?? []
    expect(variableBlocks.length).toBe(2)
    expect(variableBlocks[0].name).toBe("$1")
    expect(variableBlocks[0].value).toBe(0.5)
    expect(variableBlocks[1].name).toBe("$2")
    expect(variableBlocks[1].value).toEqual({
      left: { left: "$1", operator: "x", right: 2 },
      operator: "+",
      right: 0.1,
    })

    const primitiveBlocks = macroNode?.filter((child) => child.type === MACRO_PRIMITIVE) ?? []
    expect(primitiveBlocks.length).toBe(1)
    expect(primitiveBlocks[0].code).toBe("1")
    expect(primitiveBlocks[0].parameters?.[1]).toBe("$2")
  })

  it("parses outline and thermal AM primitive families", () => {
    const outlineMacro = parseAndVisit(outlinePrimitiveGerber).visitor.macroDefinitions["OUTLINE"]
    const thermalMacro = parseAndVisit(thermalPrimitiveGerber).visitor.macroDefinitions["THERMAL"]

    expect(outlineMacro).toBeDefined()
    expect(thermalMacro).toBeDefined()

    const outlinePrimitive = outlineMacro?.find((child) => child.type === MACRO_PRIMITIVE)
    const thermalPrimitive = thermalMacro?.find((child) => child.type === MACRO_PRIMITIVE)

    expect(outlinePrimitive?.code).toBe("4")
    expect(thermalPrimitive?.code).toBe("7")

    const outlineImage = parseAndPlot(outlinePrimitiveGerber)
    const thermalImage = parseAndPlot(thermalPrimitiveGerber)
    expect(outlineImage.children.length).toBeGreaterThan(0)
    expect(thermalImage.children.length).toBeGreaterThan(0)
  })
})
