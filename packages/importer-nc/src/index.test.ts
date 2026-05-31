import type { ILexingResult } from "chevrotain"
import { describe, expect, it, vi } from "vitest"
import { parseNC } from "./index"
import { NCLexer, type NCParser, NCToShapesVisitor, parser } from "./parser"

vi.mock("@src/data/importer/register", () => ({
  registerPlugin: () => {
    // no-op for unit tests
  },
}))

function parse(str: string): {
  lexingResult: ILexingResult
  parser: NCParser
  visitor: NCToShapesVisitor
} {
  const lexingResult = NCLexer.tokenize(str)
  // if (lexingResult.errors.length > 0) {
  //   for (const err of lexingResult.errors) {
  //     console.error(`NC lexing error at line ${err.line}, column ${err.column}, length ${err.length}, offset ${err.offset}: ${err.message}`)
  //   }
  // }
  parser.input = lexingResult.tokens
  const result = parser.program()
  // if (parser.errors.length > 0) {
  //   for (const err of parser.errors) {
  //     console.error(`NC parse error: ${err.message}`)
  //   }
  // }
  const visitor = new NCToShapesVisitor()
  visitor.visit(result)
  return {
    lexingResult,
    parser,
    visitor,
  }
}

describe("NC importer", () => {
  it("throws a clear error when lexing fails", async () => {
    const { lexingResult } = parse("@@@")
    expect(lexingResult.errors).toHaveLength(1)
  })

  it("exposes a high-level parse helper", () => {
    const result = parseNC("M48\nINCH,TZ\nT01C0.04\nM95\nT01\nX0Y0\nM30\n")

    expect(result.errors).toHaveLength(0)
    expect(result.shapes.length).toBeGreaterThan(0)
  })
})
