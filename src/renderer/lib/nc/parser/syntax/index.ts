import type { ChildNode } from '../tree'
import type { Token, LexerIterable, LexerState } from '../lexer'
import { findSyntaxMatch } from './rules'
import { drillGrammar } from './drill'


export interface MatchResult {
  nodes: ChildNode[]
  unmatched: string
  lexerState: LexerState | undefined
}

export function matchSyntax(
  tokens: LexerIterable,
): MatchResult {
  const nodes: ChildNode[] = []
  let matchedTokens: Token[] = []
  let nextLexerState: LexerState | undefined
  let unmatched = ''

  for (const [token, lexerState] of tokens) {
    matchedTokens.push(token)
    const result = findSyntaxMatch(matchedTokens, drillGrammar)

    if (result.nodes === undefined) {
      unmatched += token.text
    } else {
      nodes.push(...result.nodes)
      nextLexerState = lexerState
      unmatched = ''
    }

    matchedTokens = result.tokens ?? []
  }

  return {
    unmatched,
    nodes,
    lexerState: nextLexerState,
  }
}
