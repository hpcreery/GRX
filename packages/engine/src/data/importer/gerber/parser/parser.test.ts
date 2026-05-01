import { MACRO_PRIMITIVE, MACRO_VARIABLE } from "@hpcreery/tracespace-parser"
import { FeatureTypeIdentifier } from "@src/types"
import { describe, expect, it } from "vitest"
import blockApertureNestedGerber from "../testdata/gerbers/block-apertures/nested.gbr?raw"
import circleToolZeroLengthGerber from "../testdata/gerbers/strokes/circle-tool-zero-length.gbr?raw"
import fullCircleGerber from "../testdata/gerbers/arc-strokes/full-circle.gbr?raw"
import outlinePrimitiveGerber from "../testdata/gerbers/macro-primitives/outline-primitive.gbr?raw"
import thermalPrimitiveGerber from "../testdata/gerbers/macro-primitives/thermal-primitive.gbr?raw"
import vectorPrimitiveGerber from "../testdata/gerbers/macro-primitives/vector-primitive.gbr?raw"
import regionWithLinesGerber from "../testdata/gerbers/regions/region-with-lines.gbr?raw"
import stepRepeatMultiPolarityGerber from "../testdata/gerbers/step-repeats/multi-polarity.gbr?raw"
import stepRepeatGerber from "../testdata/gerbers/step-repeats/one-polarity.gbr?raw"
import singleSegmentGerber from "../testdata/gerbers/strokes/circle-tool-single-segment.gbr?raw"
import { GerberLexer, GerberToTreeVisitor, parse, parser } from "./parser"

function parseAndPlot(input: string) {
  return parse(input)
}

function parseAndVisit(input: string) {
  const lexing = GerberLexer.tokenize(input)
  expect(lexing.errors).toHaveLength(0)

  parser.input = lexing.tokens
  const cst = parser.program()
  expect(parser.errors.map((error) => error.message)).toEqual([])

  const visitor = new GerberToTreeVisitor()
  const image = visitor.visit(cst) as ReturnType<typeof parse>
  return { visitor, image }
}

function parseLoose(input: string) {
  const lexing = GerberLexer.tokenize(input)
  parser.input = lexing.tokens
  const cst = parser.program()
  const parserErrors = [...parser.errors]
  const visitor = new GerberToTreeVisitor()
  let image: ReturnType<typeof parse> = []
  let visitorException: unknown

  try {
    image = visitor.visit(cst) as ReturnType<typeof parse>
  } catch (error) {
    visitorException = error
  }

  return {
    lexingErrors: lexing.errors,
    parserErrors,
    visitor,
    image,
    visitorException,
  }
}

function messageIncludes(visitor: GerberToTreeVisitor, text: string) {
  return visitor.errors.some((error) => error.message.includes(text))
}

describe("Gerber parser (Chevrotain)", () => {
  it("parses a block aperture fixture and emits geometry", () => {
    const image = parseAndPlot(blockApertureNestedGerber)
    expect(image.length).toBeGreaterThan(0)
  })

  it("parses a single-segment stroke and emits a line", () => {
    const image = parseAndPlot(singleSegmentGerber)
    const lines = image.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(lines.length).toBeGreaterThan(0)
  })

  it("parses a zero-length stroke fixture", () => {
    const image = parseAndPlot(circleToolZeroLengthGerber)
    const lines = image.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(lines.length).toBeGreaterThan(0)
  })

  it("parses full-circle arc fixture and emits arcs", () => {
    const image = parseAndPlot(fullCircleGerber)
    const arcs = image.filter((shape) => shape.type === FeatureTypeIdentifier.ARC)
    expect(arcs.length).toBeGreaterThan(0)
  })

  it("parses region fixture and emits surfaces", () => {
    const image = parseAndPlot(regionWithLinesGerber)
    const surfaces = image.filter((shape) => shape.type === FeatureTypeIdentifier.SURFACE)
    expect(surfaces.length).toBeGreaterThan(0)
  })

  it("parses step-repeat fixture and emits step-and-repeat", () => {
    const image = parseAndPlot(stepRepeatGerber)
    const repeats = image.filter((shape) => shape.type === FeatureTypeIdentifier.STEP_AND_REPEAT)
    expect(repeats.length).toBeGreaterThan(0)
  })

  it("parses multi-polarity step-repeat fixture", () => {
    const image = parseAndPlot(stepRepeatMultiPolarityGerber)
    const repeats = image.filter((shape) => shape.type === FeatureTypeIdentifier.STEP_AND_REPEAT)
    expect(repeats.length).toBeGreaterThan(0)
  })

  it("parses macro aperture fixtures and emits geometry", () => {
    const image = parseAndPlot(vectorPrimitiveGerber)
    expect(image.length).toBeGreaterThan(0)
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
    expect(outlineImage.length).toBeGreaterThan(0)
    expect(thermalImage.length).toBeGreaterThan(0)
  })

  it("supports modal D01 operation when operation code is omitted", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
D10*
X0Y0D02*
G01*
X1000Y0D01*
X2000Y0*
M02*`

    const { image } = parseAndVisit(gerber)
    const lines = image.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(lines.length).toBe(2)
  })

  it("supports modal D03 flash at current point", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
D10*
X1234Y5678D02*
D03*
M02*`

    const { image } = parseAndVisit(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD) as Array<{ x: number; y: number }>
    expect(pads.length).toBe(1)
    expect(pads[0].x).toBeCloseTo(0.1234)
    expect(pads[0].y).toBeCloseTo(0.5678)
  })

  it("supports inline interpolation command style", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
D10*
X0Y0D02*
G01X1000Y0D01*
M02*`

    const { image } = parseAndVisit(gerber)
    const lines = image.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(lines.length).toBe(1)
  })

  it("parses FS trailing-zero absolute form (FSTA)", () => {
    const gerber = `%FSTAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
D10*
X1Y1D03*
M02*`

    const { image } = parseAndVisit(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD)
    expect(pads.length).toBe(1)
  })

  it("applies LP/LM/LR/LS transforms to flashed pads", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
%LPC*%
%LMXY*%
%LR90*%
%LS2*%
D10*
X1000Y2000D03*
M02*`

    const { image } = parseAndVisit(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD) as Array<{
      polarity: number
      mirror_x: number
      mirror_y: number
      rotation: number
      resize_factor: number
    }>

    expect(pads.length).toBe(1)
    expect(pads[0].polarity).toBe(0)
    expect(pads[0].mirror_x).toBe(1)
    expect(pads[0].mirror_y).toBe(1)
    expect(pads[0].rotation).toBe(90)
    expect(pads[0].resize_factor).toBe(2)
  })

  it("applies and deletes file/aperture/object attributes", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%TF.FileFunction,Copper,L1*%
%TA.AperFunction,ComponentPad*%
%ADD10C,0.01*%
%TO.N,NET1*%
D10*
X0Y0D03*
%TD.N*%
X1000Y0D03*
M02*`

    const { image, visitor } = parseAndVisit(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD) as Array<{
      attributes: Record<string, string | undefined>
      symbol: { attributes: Record<string, string | undefined> }
    }>

    expect(visitor.fileAttributes[".FileFunction"]).toBe("Copper,L1")
    expect(pads.length).toBe(2)
    expect(pads[0].attributes[".N"]).toBe("NET1")
    expect(pads[1].attributes[".N"]).toBeUndefined()
    expect(pads[0].symbol.attributes[".AperFunction"]).toBe("ComponentPad")
  })

  it("deletes all attribute dictionaries with TD and no name", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%TF.ProjectId,ID,REV,GUID*%
%TA.AperFunction,ViaPad*%
%TO.N,NET2*%
%TD*%
M02*`

    const { visitor } = parseAndVisit(gerber)
    expect(Object.keys(visitor.fileAttributes)).toHaveLength(0)
    expect(Object.keys(visitor.apertureAttributes)).toHaveLength(0)
    expect(Object.keys(visitor.objectAttributes)).toHaveLength(0)
  })

  it("parses deprecated command families and records warnings where expected", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
G70*
G71*
G90*
G91*
%IPNEG*%
%ASAXBY*%
%IR0*%
%MIA1B0*%
%OFA0B0*%
%SFA1B1*%
%INOLDNAME*%
%LNSTEP1*%
%ADD10C,0.01*%
G54D10*
X0Y0D02*
G55D03*
X1000Y1000D03*
M01*
M00*`

    const { lexingErrors, parserErrors, visitor, image } = parseLoose(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD)

    expect(lexingErrors).toHaveLength(0)
    expect(parserErrors).toHaveLength(0)
    expect(pads.length).toBeGreaterThan(0)
    expect(messageIncludes(visitor, "Incremental notation is deprecated")).toBe(true)
    expect(messageIncludes(visitor, "Negative images are not fully supported")).toBe(true)
  })

  it("records a mismatch error for step-repeat close without matching open", () => {
    const gerber = `%SR*%
M02*`

    const { lexingErrors, parserErrors, visitor } = parseLoose(gerber)
    expect(lexingErrors).toHaveLength(0)
    expect(parserErrors).toHaveLength(0)
    expect(messageIncludes(visitor, "Mismatched step and repeat close command")).toBe(true)
  })

  it("parses deprecated macro primitive codes into macro definitions", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%AMDEPRIMS*
2,1,0.1,0,0,1,0*
6,0,0,1.0,0.1,0.1,3,0.2,0*
22,1,0.2,0.1,0,0,0*
%
%ADD10DEPRIMS*%
D10*
X0Y0D03*
M02*`

    const { visitor } = parseAndVisit(gerber)
    const macro = visitor.macroDefinitions.DEPRIMS
    const primitiveCodes = (macro ?? []).filter((node) => node.type === MACRO_PRIMITIVE).map((node) => node.code)

    expect(primitiveCodes).toContain("2")
    expect(primitiveCodes).toContain("6")
    expect(primitiveCodes).toContain("22")
  })

  it("auto-finalizes parsing when M02 is omitted", () => {
    const gerber = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*%
D10*
X0Y0D03*`

    const { image } = parseAndVisit(gerber)
    const pads = image.filter((shape) => shape.type === FeatureTypeIdentifier.PAD)
    expect(pads.length).toBe(1)
  })

  it("reports parser or lexer issues for malformed syntax", () => {
    const malformed = `%FSLAX24Y24*%
%MOIN*%
%ADD10C,0.01*
D10*
X0Y0D03*
M02*`

    const { lexingErrors, parserErrors } = parseLoose(malformed)
    expect(lexingErrors.length + parserErrors.length).toBeGreaterThan(0)
  })

  it.todo("should validate strict spec constraints for deprecated commands ordering and single-use semantics")
  it.todo("should validate unknown command warning behavior mandated by spec conformance rules")
})
