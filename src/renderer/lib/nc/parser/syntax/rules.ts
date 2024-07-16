import type { Token } from '../lexer'

export const SINGLE_TOKEN = 'TOKEN'
export const MIN_TO_MAX = 'MIN_TO_MAX'

export type TokenRule = SingleTokenRule | MinToMaxRule

export interface SingleTokenRule {
  rule: typeof SINGLE_TOKEN
  type: Token['type']
  value: Token['value'] | RegExp | null | undefined
  negate?: boolean
}

export interface MinToMaxRule {
  rule: typeof MIN_TO_MAX
  min: number
  max: number
  match: SingleTokenRule[]
  negate?: boolean
}

export function token(
  type: Token['type'],
  value?: Token['value'] | RegExp
): SingleTokenRule {
  return { rule: SINGLE_TOKEN, type, value }
}

export function notToken(
  type: Token['type'],
  value?: Token['value']
): SingleTokenRule {
  return { rule: SINGLE_TOKEN, type, value, negate: true }
}

export function one(match: SingleTokenRule[]): MinToMaxRule {
  return { rule: MIN_TO_MAX, min: 1, max: 1, match }
}

export function zeroOrOne(match: SingleTokenRule[]): MinToMaxRule {
  return { rule: MIN_TO_MAX, min: 0, max: 1, match }
}

export function zeroOrMore(match: SingleTokenRule[]): MinToMaxRule {
  return { rule: MIN_TO_MAX, min: 0, max: Number.POSITIVE_INFINITY, match }
}

export function oneOrMore(match: SingleTokenRule[]): MinToMaxRule {
  return { rule: MIN_TO_MAX, min: 1, max: Number.POSITIVE_INFINITY, match }
}

export function anythineBut(match: SingleTokenRule[]): MinToMaxRule {
  return { rule: MIN_TO_MAX, min: 0, max: Number.POSITIVE_INFINITY, match, negate: true }
}


export function minToMax(
  min: number,
  max: number,
  match: SingleTokenRule[]
): MinToMaxRule {
  return { rule: MIN_TO_MAX, min, max, match }
}
