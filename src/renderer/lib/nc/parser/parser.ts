import type { Lexer, LexerState } from './lexer'
import { createLexer } from './lexer'
import { matchSyntax } from './syntax'
import type { GerberTree, GerberNode } from './tree'
import { ROOT } from './tree'

export * from './constants'
export * from './lexer'
export * from './tree'
export * from './types'

/**
 * NC drill file parser.
 *
 * @category Parser
 */
export interface Parser {
  /** Parser's {@linkcode Lexer} instance */
  lexer: Lexer
  /** Feed the parser with all or part of the source file */
  feed: (chunk: string) => this
  /** Get the resulting AST when you are done feeding the parser */
  result: () => GerberTree
}

/**
 * {@linkcode Parser} factory and the primary export of the library.
 *
 * @example
 * ```ts
 * import {createParser} from '@hpcreery/tracespace-parser'
 *
 * // create a parser to parse a single file
 * const parser = createParser()
 *
 * // feed the parser the source file contents
 * parser.feed('G04 gerber file contents*\nM02*\n')
 *
 * // get the resulting AST
 * const tree = parser.results()
 * ```
 *
 * @category Parser
 */
export function createParser(): Parser {
  const lexer = createLexer()
  const children: GerberNode[] = []
  let lexerState: LexerState | undefined
  let unmatched = ''

  const parser = { lexer, feed, result }
  return parser

  function feed(chunk: string): Parser {
    const tokens = lexer.feed(`${unmatched}${chunk}`, lexerState)
    const result = matchSyntax(tokens)

    unmatched = result.unmatched
    lexerState = result.lexerState ?? lexerState

    for (const node of result.nodes) {
      children.push(node)
    }

    return parser
  }

  function result(): GerberTree {

    return { type: ROOT, children }
  }
}

export function parse(contents: string): GerberTree {
  return createParser().feed(contents).result()
}
