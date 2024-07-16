import type { ChildNode } from '../tree'
import type { Token, LexerIterable, LexerState } from '../lexer'
import { drillGrammar } from './nc'
import { TokenRule, MIN_TO_MAX, SINGLE_TOKEN } from './rules'

export interface MatchSearchResult<Node> {
  nodes?: Node[]
  tokens?: Token[]
  candidates?: Array<SyntaxRule<Node>>
}

export interface SyntaxRule<Node = ChildNode> {
  name: string
  rules: TokenRule[]
  createNodes: (tokens: Token[]) => Node[]
}

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
    const result = findSyntaxMatch(matchedTokens)
    nodes.push(...result)
    if (result.length != 0) {
      nextLexerState = lexerState
      matchedTokens = []
    } else {
      unmatched += token.text
    }
  }

  return {
    unmatched,
    nodes,
    lexerState: nextLexerState,
  }
}



export function findSyntaxMatch(
  tokens: Token[],
): Array<ChildNode> {
  for (const candidate of drillGrammar) {
    const matchType = tokenListMatches(tokens, candidate.rules)

    if (matchType === FULL_MATCH) {
      console.log(tokens)
      return candidate.createNodes(tokens)
    }
  }
  return []

}

const FULL_MATCH = 'FULL_MATCH'
const PARTIAL_MATCH = 'PARTIAL_MATCH'
const NO_MATCH = 'NO_MATCH'

type TokenMatchType = typeof FULL_MATCH | typeof PARTIAL_MATCH | typeof NO_MATCH

function tokenListMatches(tokens: Token[], rules: TokenRule[]): TokenMatchType {
  let rulesIndex = 0
  let tokensIndex = 0
  let multiMatchCount = 0

  while (rulesIndex < rules.length && tokensIndex < tokens.length) {
    const rule = rules[rulesIndex]
    const token = tokens[tokensIndex]
    const match = tokenMatches(rule, token)
    if (token.type == 'OPEN_PARANTHESIS') {
      console.log(match, token, rule, rulesIndex, tokensIndex, multiMatchCount)
    }

    if (match) {
      if (rule.rule === SINGLE_TOKEN || multiMatchCount >= rule.max - 1) {
        rulesIndex++
        tokensIndex++
        multiMatchCount = 0
      } else {
        tokensIndex++
        multiMatchCount++
      }
    } else if (rule.rule === MIN_TO_MAX && multiMatchCount >= rule.min) {
      multiMatchCount = 0
      rulesIndex++
    } else {
      console.log('no match')
      return NO_MATCH
    }
  }

  if (rulesIndex < rules.length) return PARTIAL_MATCH
  console.log('full match')
  console.log(tokens)
  return FULL_MATCH
}

function tokenMatches(rule: TokenRule, token: Token): boolean {
  if (rule.rule === SINGLE_TOKEN) {
    const typeResult = rule.type === token.type
    const valueResult =
      rule.value === null ||
      rule.value === undefined ||
      (typeof rule.value === 'string' && rule.value === token.value) ||
      (rule.value instanceof RegExp && rule.value.test(token.value))

    const result = typeResult && valueResult

    return rule.negate === true ? !result : result
  }

  if (Array.isArray(rule.match)) {
    return rule.negate ? !rule.match.some(match => tokenMatches(match, token)) : rule.match.some(match => tokenMatches(match, token))
  }

  return false
}
