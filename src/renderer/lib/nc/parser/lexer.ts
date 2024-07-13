// drill file lexer + tokenizer
import Moo from 'moo'
import type { Token } from './tokens'
import { rules } from './rules'

export * from './tokens'

export interface LexerState extends Moo.LexerState {
  offset: number
}

export interface LexerIterable extends Iterable<[Token, LexerState]> { }

/**
 * The lexing module of the parser.
 *
 * @category Lexer
 */
export interface Lexer {
  feed: (chunk: string, state?: LexerState) => LexerIterable
}

/**
 * {@linkcode Lexer} factory
 *
 * @example
 * ```ts
 * import {createLexer} from '@hpcreery/tracespace-parser'
 *
 * const lexer = createLexer()
 * const tokens = lexer.feed('G04 gerber string*\nM02*\n')
 *
 * for (const token of tokens) {
 *   console.log(`${token.type}: ${token.value}`)
 * }
 * ```
 *
 * @category Lexer
 */
export function createLexer(): Lexer {
  const mooLexer = Moo.compile(rules)

  return { feed }

  function feed(chunk: string, state?: LexerState): LexerIterable {
    mooLexer.reset(chunk, state)
    return tokenIterator(state?.offset ?? 0)
  }

  function tokenIterator(
    offset: number
  ): LexerIterable & Iterator<[Token, LexerState]> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Symbol.iterator](): LexerIterable & Iterator<[Token, LexerState], any, undefined> {
        return this
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next(): IteratorResult<[Token, LexerState], any> {
        const token = mooLexer.next() as Token | undefined

        if (token !== undefined) {
          const nextToken = { ...token, offset: offset + token.offset }
          const nextState = {
            ...mooLexer.save(),
            offset: offset + (mooLexer.index ?? 0),
          }

          return { value: [nextToken, nextState] }
        }

        return { value: undefined, done: true }
      },
    }
  }
}

declare module 'moo' {
  export interface Lexer {
    index?: number
  }
}
