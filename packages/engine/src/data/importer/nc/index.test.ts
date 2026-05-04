import type { ILexingResult } from "chevrotain"
import { describe, expect, it, vi } from "vitest"
import { NCLexer, type NCParser, NCToShapesVisitor, parser } from "./parser/parser"

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
})
