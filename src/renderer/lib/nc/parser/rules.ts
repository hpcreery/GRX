import Moo from 'moo'
import * as Tokens from './tokens'

export type Rules = {
  [t in Tokens.TokenType]: RegExp | string | string[] | Moo.Rule | Moo.Rule[]
}

const RE_STRIP_LEADING_ZEROS = /^0*/

const stripLeadingZeros = (text: string): string => {
  return text.replace(RE_STRIP_LEADING_ZEROS, '')
}

const getCodeValue = (text: string): string => {
  const leadingZerosRemoved = stripLeadingZeros(text.slice(1))
  return leadingZerosRemoved === '' ? '0' : leadingZerosRemoved
}

export const rules: Rules = {
  [Tokens.T_CODE]: {
    match: /T\d+/,
    // value: getCodeValue,
    value: text => text.slice(1)
  },
  [Tokens.G_CODE]: {
    match: /G\d+/,
    value: getCodeValue,
  },
  [Tokens.M_CODE]: {
    match: /M\d+/,
    value: getCodeValue,
  },
  [Tokens.D_CODE]: {
    match: /D\d+/,
    value: getCodeValue,
  },
  [Tokens.ASTERISK]: '*',
  [Tokens.PERCENT]: '%',
  [Tokens.EQUALS]: '=',
  [Tokens.SEMICOLON]: ';',
  [Tokens.UNITS]: /^(?:METRIC|INCH)/,
  [Tokens.DRILL_ZERO_INCLUSION]: {
    match: /,(?:TZ|LZ)/,
    value: (text: string): string => text.slice(1),
  },
  [Tokens.COORD_CHAR]: /[A-CFH-JNSX-Z]/,
  // [Tokens.COORD_CHAR]: /[A-Z]/,
  [Tokens.NUMBER]: /[+-]?[\d.]+/,
  [Tokens.OPEN_PARENTHESIS]: "(",
  [Tokens.CLOSE_PARENTHESIS]: ")",
  [Tokens.OPERATOR]: ['x', '/', '+', '-', '(', ')'],
  [Tokens.COMMA]: ',',
  [Tokens.WORD]: /[A-Za-z]+/,
  [Tokens.WHITESPACE]: /[\t ]+/,
  [Tokens.NEWLINE]: {
    match: /\r?\n/,
    lineBreaks: true,
  },
  [Tokens.CATCHALL]: /\S/,
  [Tokens.ERROR]: Moo.error,
}
