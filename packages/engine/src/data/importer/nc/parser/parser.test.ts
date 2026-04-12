/** biome-ignore-all assist/source/organizeImports: grouped imports */
import type * as Shapes from "@src/data/shape/shape"
import { type RoundSymbol, STANDARD_SYMBOLS_MAP, type StandardSymbol } from "@src/data/shape/symbol"
import { FeatureTypeIdentifier } from "@src/types"
import { describe, expect, it } from "vitest"
import { NCLexer, NCToShapesVisitor, parser } from "./parser"

// ── Fixture imports (loaded as raw text strings by Vite) ─────────────────────

import arcRouteDrl from "../testdata/generic/arc-route.drl?raw"
import hitDrl from "../testdata/generic/hit.drl?raw"
import linearRouteDrl from "../testdata/generic/linear-route.drl?raw"
import slotDrl from "../testdata/generic/slot.drl?raw"

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseProgram(input: string) {
  const lexing = NCLexer.tokenize(input)
  parser.input = lexing.tokens
  const cst = parser.program()
  return { lexing, cst, parseErrors: [...parser.errors] }
}

/** Run lexer + parser + visitor on an inline program string. */
function parseAndVisit(input: string) {
  const { lexing, cst, parseErrors } = parseProgram(input)
  const visitor = new NCToShapesVisitor()
  visitor.visit(cst)
  return { lexing, parseErrors, visitor }
}

// ── Fixture tests ─────────────────────────────────────────────────────────────

describe("fixture: hit.drl — single drill hit", () => {
  it("lexes and parses without errors", () => {
    const { lexing, parseErrors } = parseProgram(hitDrl)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("produces exactly one PAD", () => {
    const { visitor } = parseAndVisit(hitDrl)
    const pads = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.PAD)
    expect(pads).toHaveLength(1)
  })

  it("PAD is positioned at (0, 0)", () => {
    const { visitor } = parseAndVisit(hitDrl)
    const pad = visitor.result.find((s) => s.type === FeatureTypeIdentifier.PAD) as Shapes.Pad
    expect(pad.x).toBeCloseTo(0)
    expect(pad.y).toBeCloseTo(0)
  })

  it("PAD symbol outer diameter is 0.5 inches", () => {
    const { visitor } = parseAndVisit(hitDrl)
    const pad = visitor.result.find((s) => s.type === FeatureTypeIdentifier.PAD) as Shapes.Pad
    expect(pad.symbol).toBeDefined()
    const symbol = pad.symbol as StandardSymbol
    expect(symbol.symbol).toBe(STANDARD_SYMBOLS_MAP.Round)
    expect((pad.symbol as RoundSymbol).outer_dia).toBeCloseTo(0.5)
  })

  it("final state is INCH units with TZ zero suppression", () => {
    const { visitor } = parseAndVisit(hitDrl)
    expect(visitor.state.units).toBe("inch")
    expect(visitor.state.zeros).toBe("trailing")
  })
})

describe("fixture: slot.drl — G85 canned slot", () => {
  it("lexes and parses without errors", () => {
    const { lexing, parseErrors } = parseProgram(slotDrl)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("produces exactly one canned-slot LINE", () => {
    const { visitor } = parseAndVisit(slotDrl)
    const lines = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot")
    expect(lines).toHaveLength(1)
  })

  it("slot LINE starts at (0, 0) and ends at (0.5, 0) in TZ inch mode", () => {
    // X5000 in TZ [2,4]: padStart → "005000" → 0.5000"
    const { visitor } = parseAndVisit(slotDrl)
    const slot = visitor.result.find(
      (s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot",
    ) as Shapes.Line
    expect(slot.xs).toBeCloseTo(0)
    expect(slot.ys).toBeCloseTo(0)
    expect(slot.xe).toBeCloseTo(0.5)
    expect(slot.ye).toBeCloseTo(0)
  })

  it("tool diameter from header is applied to slot LINE symbol", () => {
    const { visitor } = parseAndVisit(slotDrl)
    const slot = visitor.result.find(
      (s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot",
    ) as Shapes.Line
    expect(slot.symbol.outer_dia).toBeCloseTo(0.5)
  })
})

describe("fixture: linear-route.drl — G01 routing without plunge", () => {
  it("lexes and parses without errors", () => {
    const { lexing, parseErrors } = parseProgram(linearRouteDrl)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("produces no LINE shapes because there is no M15 plunge", () => {
    const { visitor } = parseAndVisit(linearRouteDrl)
    const lines = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE)
    expect(lines).toHaveLength(0)
  })

  it("final tool position is (0.5, 0) after two G01 moves in TZ inch mode", () => {
    // G00X0Y0, G01X2500Y2500 → (0.25, 0.25), G01X5000Y0 → (0.5, 0)
    const { visitor } = parseAndVisit(linearRouteDrl)
    expect(visitor.state.x).toBeCloseTo(0.5)
    expect(visitor.state.y).toBeCloseTo(0)
  })

  it("mode is ROUT after G00", () => {
    const { visitor } = parseAndVisit(linearRouteDrl)
    expect(visitor.state.mode).toBe("rout")
  })
})

describe("fixture: arc-route.drl — G02/G03 arc routing without plunge", () => {
  it("lexes and parses without errors", () => {
    const { lexing, parseErrors } = parseProgram(arcRouteDrl)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("produces no ARC shapes because there is no M15 plunge", () => {
    const { visitor } = parseAndVisit(arcRouteDrl)
    const arcs = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.ARC)
    expect(arcs).toHaveLength(0)
  })

  it("final tool position is (1.25, 0.5) after the full routing sequence", () => {
    // G03X12500Y5000I0J2500: X12500 → 1.25", Y5000 → 0.5" in TZ [2,4]
    const { visitor } = parseAndVisit(arcRouteDrl)
    expect(visitor.state.x).toBeCloseTo(1.25)
    expect(visitor.state.y).toBeCloseTo(0.5)
  })

  it("arc radius state is set after A# command", () => {
    // G02X2500Y2500A2500: A2500 → 0.25" in TZ [2,4]
    // (state is overwritten by later I#J# arcs, but arcRadius is undefined at end)
    const { visitor } = parseAndVisit(arcRouteDrl)
    // Final arc uses I#J#, so arcCenterOffset is set and arcRadius is cleared
    expect(visitor.state.arcCenterOffset).toBeDefined()
    expect(visitor.state.arcRadius).toBeUndefined()
  })

  it("arc center offset state is set after I#J# command", () => {
    // G03X12500Y5000I0J2500: I0 → 0, J2500 → 0.25"
    const { visitor } = parseAndVisit(arcRouteDrl)
    expect(visitor.state.arcCenterOffset?.i).toBeCloseTo(0)
    expect(visitor.state.arcCenterOffset?.j).toBeCloseTo(0.25)
  })
})

// ── Spec: Part program header ─────────────────────────────────────────────────

describe("spec: part program header (M48)", () => {
  it("M48 opens a header without error", () => {
    const { lexing, parseErrors } = parseProgram("M48\nINCH,TZ\n%\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M95 terminates the header (spec: end of header)", () => {
    const { lexing, parseErrors } = parseProgram("M48\nINCH,TZ\nM95\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("% terminates the header (spec: rewind stop)", () => {
    const { lexing, parseErrors } = parseProgram("M48\nINCH,TZ\n%\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("semicolon comment inside header is skipped", () => {
    const { lexing, parseErrors } = parseProgram("M48\n; this is a comment\nINCH,TZ\nM95\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("parenthesis comment inside header is skipped", () => {
    const { lexing, parseErrors } = parseProgram("M48\n(comment text)\nINCH,TZ\n%\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("standalone comment produces no shapes", () => {
    const { visitor } = parseAndVisit("; standalone comment\n")
    expect(visitor.result).toHaveLength(0)
  })

  it("full header with tool definition and body parses cleanly", () => {
    const prog = "M48\nINCH,LZ\nT1C.04F200S65\nM95\nG90\nT1\nX0Y0\nM30\n"
    const { lexing, parseErrors } = parseProgram(prog)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

// ── Spec: Leading and trailing zero suppression ───────────────────────────────

describe("spec: leading and trailing zeros", () => {
  it("TZ: X75 = 0.0075 inches (spec table example)", () => {
    // spec: "X75 = 0.0075 inch" for trailing zero mode
    const { visitor } = parseAndVisit("INCH,TZ\nX75\n")
    expect(visitor.state.x).toBeCloseTo(0.0075)
  })

  it("TZ: X7500 = 0.75 inches (spec table example)", () => {
    // spec: "X7500 = 0.75 inch" for trailing zero mode
    const { visitor } = parseAndVisit("INCH,TZ\nX7500\n")
    expect(visitor.state.x).toBeCloseTo(0.75)
  })

  it("LZ: X0075 = 0.75 inches (spec section example — Correct)", () => {
    // spec: "X0075 — Correct" in leading zero mode
    const { visitor } = parseAndVisit("INCH,LZ\nX0075\n")
    expect(visitor.state.x).toBeCloseTo(0.75)
  })

  it("LZ: Y014 = 1.4 inches (spec section example — Correct)", () => {
    // spec: "Y014 — Correct" in leading zero mode; trailing zeros omitted
    const { visitor } = parseAndVisit("INCH,LZ\nY014\n")
    expect(visitor.state.y).toBeCloseTo(1.4)
  })

  it("INCH,TZ sets zeroSuppression to 'trailing'", () => {
    const { visitor } = parseAndVisit("INCH,TZ\n")
    expect(visitor.state.zeros).toBe("trailing")
  })

  it("INCH,LZ sets zeroSuppression to 'leading'", () => {
    const { visitor } = parseAndVisit("INCH,LZ\n")
    expect(visitor.state.zeros).toBe("leading")
  })
})

// ── Spec: Decimal place override ──────────────────────────────────────────────

describe("spec: decimal place override", () => {
  it("X.075 parses as 0.075 regardless of TZ mode (spec: 'Correct' example)", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nX.075\n")
    expect(visitor.state.x).toBeCloseTo(0.075)
  })

  it("Y1.45 parses as 1.45 regardless of LZ mode (spec: 'Correct' example)", () => {
    const { visitor } = parseAndVisit("INCH,LZ\nY1.45\n")
    expect(visitor.state.y).toBeCloseTo(1.45)
  })

  it("X00093 = 0.093 inch in inch format (no decimal, all leading zeros shown)", () => {
    // spec: "X00093 = 0.093 inch in inch format"
    const { visitor } = parseAndVisit("INCH,TZ\nX00093\n")
    expect(visitor.state.x).toBeCloseTo(0.0093)
  })

  it("coordinate X0 evaluates to zero regardless of mode", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nX0\n")
    expect(visitor.state.x).toBe(0)
  })
})

// ── Spec: Unit selection ──────────────────────────────────────────────────────

describe("spec: unit selection", () => {
  it("INCH command sets units to inch", () => {
    const { visitor } = parseAndVisit("INCH,TZ\n")
    expect(visitor.state.units).toBe("inch")
  })

  it("METRIC command sets units to mm", () => {
    const { visitor } = parseAndVisit("METRIC,TZ\n")
    expect(visitor.state.units).toBe("mm")
  })

  it("M71 in-body command switches units to mm (spec: Metric Measuring Mode)", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nM71\n")
    expect(visitor.state.units).toBe("mm")
  })

  it("M72 in-body command switches units to inch (spec: Inch Measuring Mode)", () => {
    const { visitor } = parseAndVisit("METRIC,TZ\nM72\n")
    expect(visitor.state.units).toBe("inch")
  })

  it("METRIC,000.00 sets coordinate format to [3,2] (five-digit 10-micron resolution)", () => {
    // spec: "Five digit 10 micron resolution (000.00)"
    const { visitor } = parseAndVisit("METRIC,000.00\n")
    expect(visitor.state.coordinateFormat).toEqual([3, 2])
  })

  it("METRIC,0000.00 sets coordinate format to [4,2] (six-digit 10-micron resolution)", () => {
    const { visitor } = parseAndVisit("METRIC,0000.00\n")
    expect(visitor.state.coordinateFormat).toEqual([4, 2])
  })
})

// ── Spec: Tool commands ───────────────────────────────────────────────────────

describe("spec: tool commands", () => {
  it("T#C# defines a tool with the given diameter", () => {
    const { visitor } = parseAndVisit("T01C0.04\n")
    expect(visitor.toolStore["1"]).toBeDefined()
    expect(visitor.toolStore["1"]?.outer_dia).toBeCloseTo(0.04)
  })

  it("T#C# with leading-dot notation: T1C.04 = 0.04 diameter", () => {
    const { visitor } = parseAndVisit("T1C.04\n")
    expect(visitor.toolStore["1"]?.outer_dia).toBeCloseTo(0.04)
  })

  it("T# selects a previously defined tool and updates currentTool", () => {
    const { visitor } = parseAndVisit("T01C0.04\nT01\n")
    expect(visitor.state.currentTool.outer_dia).toBeCloseTo(0.04)
  })

  it("T#C#F#S# (feed + speed) parses without error", () => {
    const { lexing, parseErrors } = parseProgram("T01C0.04F200S65\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("T#C#B# (retract rate) parses without error", () => {
    const { lexing, parseErrors } = parseProgram("T01C0.04B02\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("T#C#H# (hit count) parses without error", () => {
    // T#H# without C# is not supported; toolDefinition requires a diameter
    const { lexing, parseErrors } = parseProgram("T03C0.1H2000\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("T#C#Z-# (depth offset) parses without error", () => {
    // spec: "T01C00125Z-00001 — Sets penetration depth to 0.001\" below mean"
    const { lexing, parseErrors } = parseProgram("T01C00125Z-00001\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("CP compensation index is stored and retrievable", () => {
    const { visitor } = parseAndVisit("CP,2,0.094\n")
    expect(visitor.compensationStore["2"]).toBeCloseTo(0.094)
  })
})

// ── Spec: Coordinate modes G90/G91 and ICI ────────────────────────────────────

describe("spec: coordinate modes G90/G91 and ICI", () => {
  it("G90 sets absolute coordinate mode", () => {
    const { visitor } = parseAndVisit("G91\nG90\n")
    expect(visitor.state.coordinateMode).toBe("absolute")
  })

  it("G91 sets incremental coordinate mode", () => {
    const { visitor } = parseAndVisit("G91\n")
    expect(visitor.state.coordinateMode).toBe("incremental")
  })

  it("ICI,ON sets incremental coordinate mode", () => {
    const { visitor } = parseAndVisit("ICI,ON\n")
    expect(visitor.state.coordinateMode).toBe("incremental")
  })

  it("ICI,OFF restores absolute coordinate mode", () => {
    const { visitor } = parseAndVisit("ICI,ON\nICI,OFF\n")
    expect(visitor.state.coordinateMode).toBe("absolute")
  })

  it("incremental mode accumulates successive X coordinates", () => {
    // INCH,TZ: X1000 → 0.1"; two incremental X moves = 0.1 + 0.1 = 0.2"
    const { visitor } = parseAndVisit("INCH,TZ\nG91\nX1000\nX1000\n")
    expect(visitor.state.x).toBeCloseTo(0.2)
  })

  it("absolute mode replaces the current position on each move", () => {
    // INCH,TZ: X1000 → 0.1", then X5000 → 0.5" (not cumulative)
    const { visitor } = parseAndVisit("INCH,TZ\nX1000\nX5000\n")
    expect(visitor.state.x).toBeCloseTo(0.5)
  })
})

// ── Spec: Rout mode G00 and drill mode G05 ────────────────────────────────────

describe("spec: rout mode G00 and drill mode G05", () => {
  it("G00 switches to rout mode", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\n")
    expect(visitor.state.mode).toBe("rout")
  })

  it("G00 clears the plunge state", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nG00X5000Y0\n")
    expect(visitor.state.plunged).toBe(false)
  })

  it("G00 moves to the specified X,Y position", () => {
    // INCH,TZ default: X5000 → 0.5", Y2500 → 0.25"
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nG00X5000Y2500\n")
    expect(visitor.state.x).toBeCloseTo(0.5)
    expect(visitor.state.y).toBeCloseTo(0.25)
  })

  it("G05 returns to drill mode and clears plunge state", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nG05\n")
    expect(visitor.state.plunged).toBe(false)
  })
})

// ── Spec: Plunge and retract M14/M15/M16/M17 ─────────────────────────────────

describe("spec: plunge and retract M14/M15/M16/M17", () => {
  it("M15 sets plunged to true (Z Axis Route Position)", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\n")
    expect(visitor.state.plunged).toBe(true)
  })

  it("M14 sets plunged to true (depth-controlled contouring)", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM14\n")
    expect(visitor.state.plunged).toBe(true)
  })

  it("M16 clears plunged state (retract with clamping)", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nM16\n")
    expect(visitor.state.plunged).toBe(false)
  })

  it("M17 clears plunged state (retract without clamping)", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nM17\n")
    expect(visitor.state.plunged).toBe(false)
  })
})

// ── Spec: Routing moves G01/G02/G03 ──────────────────────────────────────────

describe("spec: routing moves G01/G02/G03", () => {
  it("G01 sets interpolation mode to 'line'", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nG01X5000Y0\n")
    expect(visitor.state.interpolationMode).toBe("line")
  })

  it("G02 sets interpolation mode to 'cwArc'", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nG02X5000Y0A2500\n")
    expect(visitor.state.interpolationMode).toBe("cwArc")
  })

  it("G03 sets interpolation mode to 'ccwArc'", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nG03X5000Y0A2500\n")
    expect(visitor.state.interpolationMode).toBe("ccwArc")
  })

  it("G01 does NOT produce LINE shapes without M15 plunge", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nG01X5000Y0\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE)).toHaveLength(0)
  })

  it("G01 produces a LINE shape after M15 plunge", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nG01X5000Y0\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE).length).toBeGreaterThan(0)
  })

  it("G02 produces an ARC shape after M15 plunge", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nG02X5000Y0A2500\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.ARC).length).toBeGreaterThan(0)
  })

  it("G03 produces an ARC shape after M15 plunge", () => {
    const { visitor } = parseAndVisit("T01C0.1\nG00X0Y0\nM15\nG03X5000Y0A2500\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.ARC).length).toBeGreaterThan(0)
  })

  it("A# command sets arc radius state (spec: Arc Radius section)", () => {
    // INCH,TZ: A2500 → padStart → 0.25"
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nG00X0Y0\nG02X5000Y0A2500\n")
    expect(visitor.state.arcRadius).toBeCloseTo(0.25)
  })

  it("I#J# command sets arc center offset state and clears arcRadius", () => {
    // INCH,TZ: I2500 → 0.25", J0 → 0
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nG00X0Y0\nG02X5000Y2500I2500J0\n")
    expect(visitor.state.arcCenterOffset?.i).toBeCloseTo(0.25)
    expect(visitor.state.arcCenterOffset?.j).toBeCloseTo(0)
    expect(visitor.state.arcRadius).toBeUndefined()
  })
})

// ── Spec: Cutter compensation G40/G41/G42 ────────────────────────────────────

describe("spec: cutter compensation G40/G41/G42", () => {
  it("G41 enables left cutter compensation", () => {
    const { visitor } = parseAndVisit("G41\n")
    expect(visitor.state.cutterCompensationMode).toBe("left")
  })

  it("G42 enables right cutter compensation", () => {
    const { visitor } = parseAndVisit("G42\n")
    expect(visitor.state.cutterCompensationMode).toBe("right")
  })

  it("G40 turns cutter compensation off after G41", () => {
    const { visitor } = parseAndVisit("G41\nG40\n")
    expect(visitor.state.cutterCompensationMode).toBe("off")
  })

  it("G40 turns cutter compensation off after G42", () => {
    const { visitor } = parseAndVisit("G42\nG40\n")
    expect(visitor.state.cutterCompensationMode).toBe("off")
  })
})

// ── Spec: G32/G33 routed circle canned cycles ─────────────────────────────────

describe("spec: G32/G33 routed circle canned cycles", () => {
  it("G32 CW routed circle produces an ARC shape (clockwise=1)", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nG32X0Y0A250\n")
    const arc = visitor.result.find((s) => s.type === FeatureTypeIdentifier.ARC) as Shapes.Arc | undefined
    expect(arc).toBeDefined()
    expect(arc?.clockwise).toBe(1)
  })

  it("G33 CCW routed circle produces an ARC shape (clockwise=0)", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nG33X0Y0A250\n")
    const arc = visitor.result.find((s) => s.type === FeatureTypeIdentifier.ARC) as Shapes.Arc | undefined
    expect(arc).toBeDefined()
    expect(arc?.clockwise).toBe(0)
  })
})

// ── Spec: Canned cycle G85 slot ───────────────────────────────────────────────

describe("spec: canned cycle G85 slot", () => {
  it("G85 produces a LINE with attributes.type === 'canned slot'", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nX0Y0\nG85X5000Y0\n")
    const slots = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot")
    expect(slots).toHaveLength(1)
  })

  it("G85 slot uses the current tool as the LINE symbol", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.25\nX0Y0\nG85X5000Y0\n")
    const slot = visitor.result.find(
      (s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot",
    ) as Shapes.Line
    expect(slot.symbol.outer_dia).toBeCloseTo(0.25)
  })

  it("G85 X#Y# start followed by G85X#Y# routes from start to end", () => {
    // X0Y0 drills/positions; G85X3000Y4000 creates slot to (0.3, 0.4) in TZ [2,4]
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nX0Y0\nG85X3000Y4000\n")
    const slot = visitor.result.find(
      (s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "canned slot",
    ) as Shapes.Line
    expect(slot.xs).toBeCloseTo(0)
    expect(slot.ys).toBeCloseTo(0)
    expect(slot.xe).toBeCloseTo(0.3)
    expect(slot.ye).toBeCloseTo(0.4)
  })
})

// ── Spec: Canned cycle G84 canned circle ──────────────────────────────────────

describe("spec: canned cycle G84 canned circle", () => {
  it("G84 produces a PAD with attributes.type === 'canned circle'", () => {
    // Format: X#Y#G84X# where last X is the diameter
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nX5000Y5000G84X5000\n")
    const pads = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.PAD && (s as Shapes.Pad).attributes.type === "canned circle")
    expect(pads).toHaveLength(1)
  })
})

// ── Spec: Canned cycle G87 routed step slot ───────────────────────────────────

describe("spec: canned cycle G87 routed step slot", () => {
  it("G87 parses without error (format: X1Y1G87X2Y2Z-#U#)", () => {
    const { lexing, parseErrors } = parseProgram("INCH,TZ\nT01C0.1\nX5000Y6000G87X5000Y7000Z-1U1\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G87 produces a LINE with attributes.type === 'routed step slot'", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nX5000Y6000G87X5000Y7000Z-1U1\n")
    const slots = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "routed step slot")
    expect(slots).toHaveLength(1)
  })

  it("G87 routes from start (X1Y1) to end (X2Y2) coordinates", () => {
    // X5000Y6000 → (0.5, 0.6); G87X5000Y7000 end → (0.5, 0.7) in TZ [2,4]
    const { visitor } = parseAndVisit("INCH,TZ\nT01C0.1\nX5000Y6000G87X5000Y7000Z-1U1\n")
    const slot = visitor.result.find(
      (s) => s.type === FeatureTypeIdentifier.LINE && (s as Shapes.Line).attributes.type === "routed step slot",
    ) as Shapes.Line
    expect(slot.xs).toBeCloseTo(0.5)
    expect(slot.ys).toBeCloseTo(0.6)
    expect(slot.xe).toBeCloseTo(0.5)
    expect(slot.ye).toBeCloseTo(0.7)
  })
})

// ── Spec: Canned cycle G82 dual in-line package ───────────────────────────────

describe("spec: canned cycle G82 dual in-line package", () => {
  it("G82 is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G82\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G82 is a stub — produces no geometry shapes", () => {
    const { visitor } = parseAndVisit("G82\n")
    const geometry = visitor.result.filter(
      (s) => s.type === FeatureTypeIdentifier.LINE || s.type === FeatureTypeIdentifier.PAD || s.type === FeatureTypeIdentifier.ARC,
    )
    expect(geometry).toHaveLength(0)
  })
})

// ── Spec: Canned cycle G83 eight pin L pack ───────────────────────────────────

describe("spec: canned cycle G83 eight pin L pack", () => {
  it("G83 is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G83\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G83 is a stub — produces no geometry shapes", () => {
    const { visitor } = parseAndVisit("G83\n")
    const geometry = visitor.result.filter(
      (s) => s.type === FeatureTypeIdentifier.LINE || s.type === FeatureTypeIdentifier.PAD || s.type === FeatureTypeIdentifier.ARC,
    )
    expect(geometry).toHaveLength(0)
  })
})

// ── Spec: Step and repeat M25/M01/M02/M08 ────────────────────────────────────

describe("spec: step and repeat M25/M01/M02/M08", () => {
  // Program: one PAD inside the pattern, repeated twice with 0.5" spacing
  const stepRepeatProgram = "INCH,TZ\nT01C0.1\nM25\nX0Y0\nM01\nM02X5000Y0\nM02X5000Y0\nM02\nM08\n"

  it("M25/M01/M02/M08 sequence parses without error", () => {
    const { lexing, parseErrors } = parseProgram(stepRepeatProgram)
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M08 emits exactly one StepAndRepeat into the result", () => {
    const { visitor } = parseAndVisit(stepRepeatProgram)
    const sars = visitor.result.filter((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT)
    expect(sars).toHaveLength(1)
  })

  it("StepAndRepeat has 3 repeat entries: original + 2 M02 offsets", () => {
    const { visitor } = parseAndVisit(stepRepeatProgram)
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats).toHaveLength(3)
  })

  it("first M02 offset is (0.5, 0) in TZ inch mode", () => {
    // X5000 in TZ [2,4]: padStart → "005000" → 0.5"
    const { visitor } = parseAndVisit(stepRepeatProgram)
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats[1].datum[0]).toBeCloseTo(0.5)
    expect(sar.repeats[1].datum[1]).toBeCloseTo(0)
  })

  it("second M02 offset accumulates to (1.0, 0) — M02 is incremental", () => {
    const { visitor } = parseAndVisit(stepRepeatProgram)
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats[2].datum[0]).toBeCloseTo(1.0)
    expect(sar.repeats[2].datum[1]).toBeCloseTo(0)
  })

  it("M02X#Y#M70 (swap axes) sets rotation=90 on that repeat entry", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nM25\nX0Y0\nM01\nM02X5000Y0M70\nM02\nM08\n")
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats[1].rotation).toBe(90)
  })

  it("M02X#Y#M80 (mirror X) sets mirror_x=1 on that repeat entry", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nM25\nX0Y0\nM01\nM02X5000Y0M80\nM02\nM08\n")
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats[1].mirror_x).toBe(1)
  })

  it("M02X#Y#M90 (mirror Y) sets mirror_y=1 on that repeat entry", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nM25\nX0Y0\nM01\nM02X5000Y0M90\nM02\nM08\n")
    const sar = visitor.result.find((s) => s.type === FeatureTypeIdentifier.STEP_AND_REPEAT) as Shapes.StepAndRepeat
    expect(sar.repeats[1].mirror_y).toBe(1)
  })

  it("bare M02 outside a step-repeat block does not throw (safety guard)", () => {
    expect(() => parseAndVisit("M02\n")).not.toThrow()
  })
})

// ── Spec: Vision commands G35/G36/G37/G38/G39 ────────────────────────────────

describe("spec: vision commands G35/G36/G37/G38/G39", () => {
  it("G35 (single point vision offset) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG35X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })

  it("G36 (multipoint vision translation) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG36X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })

  it("G37 (cancel vision offset) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G37\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G38 (vision corrected single hole) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG38X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })

  it("G39 (vision autocalibration) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G39\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

// ── Spec: Relative vision commands G45/G46/G47/G48 ───────────────────────────

describe("spec: relative vision commands G45/G46/G47/G48", () => {
  it("G45 (single point vision offset relative) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG45X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })

  it("G46 (multipoint vision translation relative) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG46X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })

  it("G47 (cancel relative vision offset) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G47\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G48 (vision corrected single hole relative) produces a DatumPoint annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG48X1000Y1000\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT).length).toBeGreaterThan(0)
  })
})

// ── Spec: Operator messages M47/M45 ──────────────────────────────────────────

describe("spec: operator messages M47/M45", () => {
  it("M47 (operator message) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M47,Hello World\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M45 (long operator message) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M45,This is a long message\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

// ── Spec: End of program commands M00/M30 ────────────────────────────────────

describe("spec: end of program commands M00/M30", () => {
  it("M00 (end of program, no rewind) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M00\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M30 (end of program, rewind) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M30\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M30X#Y# with optional coordinates is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M30X0Y0\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

// ── Spec: Optional stop M06, stop for inspect M09, end step-repeat M08 ────────

describe("spec: M06 optional stop, M09 stop for inspect, M08 end step-repeat", () => {
  it("M06 (optional stop) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M06\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M06X#Y# with optional coordinate is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M06X0Y0\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M09 (stop for inspect) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M09\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("M08 (end of step and repeat) in isolation is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("M25\nM01\nM08\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

// ── Spec section dwell G04 and zero set G93 ───────────────────────────────────

describe("spec: dwell G04 and zero set G93", () => {
  it("G04 (variable dwell) is parsed without error", () => {
    const { lexing, parseErrors } = parseProgram("G04 500\n")
    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("G93X#Y# (zero set) produces a DatumPoint and DatumText annotation", () => {
    const { visitor } = parseAndVisit("INCH,TZ\nG93X0Y0\n")
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_POINT)).toHaveLength(1)
    expect(visitor.result.filter((s) => s.type === FeatureTypeIdentifier.DATUM_TEXT)).toHaveLength(1)
  })
})

// ── Original compliance and semantics tests (kept intact) ─────────────────────

describe("NC parser compliance", () => {
  it("accepts M95 as a valid header terminator", () => {
    const { lexing, parseErrors } = parseProgram("M48\nINCH,TZ\nM95\nT01C0.04\nX0075\n")

    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("parses M08 as end-of-step-and-repeat", () => {
    const { lexing, parseErrors } = parseProgram("M25\nM08\n")

    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })

  it("supports newly added Excellon commands", () => {
    const { lexing, parseErrors } = parseProgram("G45X1Y1\nG46X2Y2\nG47\nG48X3Y3\nG82\nG83\nX0Y0\nG87X10Y10Z-1U1\n")

    expect(lexing.errors).toHaveLength(0)
    expect(parseErrors).toHaveLength(0)
  })
})

describe("NC visitor semantics", () => {
  it("uses trailing-zero suppression correctly", () => {
    const { cst } = parseProgram("INCH,TZ\nX75\n")
    const visitor = new NCToShapesVisitor()
    visitor.visit(cst)

    expect(visitor.state.zeros).toBe("trailing")
    expect(visitor.state.x).toBeCloseTo(0.0075, 8)
  })

  it("uses leading-zero suppression correctly", () => {
    const { cst } = parseProgram("INCH,LZ\nX0075\n")
    const visitor = new NCToShapesVisitor()
    visitor.visit(cst)

    expect(visitor.state.zeros).toBe("leading")
    expect(visitor.state.x).toBeCloseTo(0.75, 8)
  })

  it("does not generate routed cut geometry before plunge", () => {
    const { cst } = parseProgram("T01C0.04\nG00X0Y0\nG01X1000Y0\n")
    const visitor = new NCToShapesVisitor()
    visitor.visit(cst)

    const routedLines = visitor.result.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(routedLines).toHaveLength(0)
  })

  it("generates routed cut geometry after plunge", () => {
    const { cst } = parseProgram("T01C0.04\nG00X0Y0\nM15\nG01X1000Y0\n")
    const visitor = new NCToShapesVisitor()
    visitor.visit(cst)

    const routedLines = visitor.result.filter((shape) => shape.type === FeatureTypeIdentifier.LINE)
    expect(routedLines.length).toBeGreaterThan(0)
  })
})
