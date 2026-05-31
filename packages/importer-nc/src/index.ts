import type * as Shapes from "@grx/artwork-format/shape"
import { NCLexer, type NCParams, NCParser, NCToShapesVisitor } from "./parser"

export * from "./parser"

export interface ParseNCResult {
  errors: string[]
  shapes: Shapes.Shape[]
}

export function parseNC(input: string, params: Partial<NCParams> = {}): ParseNCResult {
  const errors: string[] = []

  const lexingResult = NCLexer.tokenize(input)
  errors.push(...lexingResult.errors.map((err) => `Lexing error at line ${err.line}, column ${err.column}: ${err.message}`))

  const parser = new NCParser()
  parser.input = lexingResult.tokens
  const cst = parser.program()
  errors.push(...parser.errors.map((err) => `Parsing error: ${err.message}`))

  const visitor = new NCToShapesVisitor(params)
  visitor.visit(cst)
  errors.push(...visitor.errors.map((err) => `Visiting error: ${err}`))

  return {
    errors,
    shapes: visitor.result,
  }
}
