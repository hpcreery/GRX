import type {Token as MooToken} from 'moo'

/**
 * T-code token type
 *
 * @category Lexer
 */
export const T_CODE = 'T_CODE'

/**
 * G-code token type
 *
 * @category Lexer
 */
export const G_CODE = 'G_CODE'

/**
 * M-code token type
 *
 * @category Lexer
 */
export const M_CODE = 'M_CODE'

/**
 * D-code token type
 *
 * @category Lexer
 */
export const D_CODE = 'D_CODE'

/**
 * Asterisk token type
 *
 * @category Lexer
 */
export const ASTERISK = 'ASTERISK'

/**
 * Percent sign token type
 *
 * @category Lexer
 */
export const PERCENT = 'PERCENT'

/**
 * Equals sign token type
 *
 * @category Lexer
 */
export const EQUALS = 'EQUALS'

/**
 * Comma token type
 *
 * @category Lexer
 */
export const COMMA = 'COMMA'

/**
 * Arithmatic operator token type
 *
 * @category Lexer
 */
export const OPERATOR = 'OPERATOR'

/**
 * Semicolor token type
 *
 * @category Lexer
 */
export const SEMICOLON = 'SEMICOLON'

/**
 * Drill file units token type
 *
 * @category Lexer
 */
export const UNITS = 'UNITS'

/**
 * Drill zero-inclusion token type
 *
 * @category Lexer
 */
export const DRILL_ZERO_INCLUSION = 'DRILL_ZERO_INCLUSION'

/**
 * Coordinate axis character token type
 *
 * @category Lexer
 */
export const COORD_CHAR = 'COORD_CHAR'

/**
 * Number token type
 *
 * @category Lexer
 */
export const NUMBER = 'NUMBER'

/**
 * Word token type
 *
 * @category Lexer
 */
export const WORD = 'WORD'

/**
 * Whitespace token type
 *
 * @category Lexer
 */
export const WHITESPACE = 'WHITESPACE'

/**
 * Newline token type
 *
 * @category Lexer
 */
export const NEWLINE = 'NEWLINE'

/**
 * Catchall token type
 *
 * @category Lexer
 */
export const CATCHALL = 'CATCHALL'

/**
 * Error token type
 *
 * @category Lexer
 */
export const ERROR = 'ERROR'

/**
 * Open Parenthesis token type
 *
 * @category Lexer
 */
export const OPEN_PARENTHESIS = "OPEN_PARANTHESIS"

/**
 * Close Parenthesis token type
 *
 * @category Lexer
 */
export const CLOSE_PARENTHESIS = "CLOSE_PARENTHESIS"

/**
 * Union of all available token types
 *
 * @category Lexer
 */
export type TokenType =
  | typeof T_CODE
  | typeof G_CODE
  | typeof M_CODE
  | typeof D_CODE
  | typeof ASTERISK
  | typeof PERCENT
  | typeof EQUALS
  | typeof COMMA
  | typeof OPERATOR
  | typeof SEMICOLON
  | typeof UNITS
  | typeof DRILL_ZERO_INCLUSION
  | typeof COORD_CHAR
  | typeof NUMBER
  | typeof WORD
  | typeof OPEN_PARENTHESIS
  | typeof CLOSE_PARENTHESIS
  | typeof WHITESPACE
  | typeof NEWLINE
  | typeof CATCHALL
  | typeof ERROR


/**
 * {@linkcode Lexer} token
 *
 * @category Lexer
 */
export interface Token extends MooToken {
  /** Token identifier */
  type: TokenType
}
