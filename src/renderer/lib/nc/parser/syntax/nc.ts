// Drill file grammar
import * as Token from '../tokens'
import * as Tree from '../tree'
import * as Constants from '../constants'
import type * as Types from '../types'
import type { SyntaxRule } from './rules'
import { token, one, zeroOrOne, zeroOrMore, minToMax, anythineBut, notToken } from './rules'

import {
  tokensToCoordinates,
  tokensToMode,
  tokensToString,
  tokensToPosition,
} from './map-tokens'

const units: SyntaxRule = {
  name: 'units',
  rules: [
    one([
      token(Token.UNITS),
      token(Token.M_CODE, '71'),
      token(Token.M_CODE, '72'),
    ]),
    zeroOrMore([
      token(Token.COMMA),
      token(Token.DRILL_ZERO_INCLUSION),
      token(Token.NUMBER, /^0{1,8}\.0{1,8}$/),
    ]),
  ],
  createNodes(tokens) {
    const units =
      tokens[0].value === 'INCH' || tokens[0].value === '72'
        ? Constants.IN
        : Constants.MM

    const zeroSuppression = tokens
      .filter(t => t.type === Token.DRILL_ZERO_INCLUSION)
      .map(t => (t.value === 'LZ' ? Constants.TRAILING : Constants.LEADING))

    const format = tokens
      .filter(t => t.type === Token.NUMBER)
      .map<Types.Format>(t => {
        const [integer = '', decimal = ''] = t.value.split('.')
        return [integer.length, decimal.length]
      })

    const nodes: Tree.ChildNode[] = [
      { type: Tree.UNITS, position: tokensToPosition(tokens), units },
    ]

    if (zeroSuppression.length > 0 || format.length > 0) {
      nodes.push({
        type: Tree.COORDINATE_FORMAT,
        position: tokensToPosition(tokens),
        mode: undefined,
        format: format[0],
        zeroSuppression: zeroSuppression[0],
      })
    }

    return nodes
  },
}

const coordinateMode: SyntaxRule = {
  name: 'coordinateMode',
  rules: [
    one([
      token(Token.G_CODE, '90'),
      token(Token.G_CODE, '91'),
    ]),
  ],
  createNodes(tokens) {
    const mode =
      tokens[0].value === '90'
        ? Constants.ABSOLUTE
        : Constants.INCREMENTAL

    return [{
      type: Tree.COORDINATE_FORMAT,
      position: tokensToPosition(tokens),
      format: undefined,
      zeroSuppression: undefined,
      mode: mode
    }]
  },
}

const tool: SyntaxRule = {
  name: 'tool',
  rules: [
    token(Token.T_CODE),
    minToMax(0, 100, [
      token(Token.COORD_CHAR, 'C'),
      token(Token.COORD_CHAR, 'F'),
      token(Token.COORD_CHAR, 'S'),
      token(Token.COORD_CHAR, 'B'),
      token(Token.COORD_CHAR, 'H'),
      token(Token.COORD_CHAR, 'Z'),
      token(Token.COORD_CHAR, 'I'),
      token(Token.NUMBER),
    ]),
  ],
  createNodes(tokens) {
    const code = tokens[0].value
    const position = tokensToPosition(tokens)
    const { c, ...params } = tokensToCoordinates(tokens.slice(1))
    console.log(tokens)

    if (c === undefined) {
      const compensationIndex = tokens[1].type == 'NUMBER' ? tokens[1].value : undefined
      return [{ type: Tree.TOOL_CHANGE, position, code, compensationIndex }]
    } else {
      return [{
        type: Tree.TOOL_DEFINITION,
        shape: { type: Constants.CIRCLE, diameter: Number(c) },
        parameters: params,
        hole: undefined,
        position,
        code,
      }]
    }
  },
}

const mode: SyntaxRule = {
  name: 'operationMode',
  rules: [
    one([
      token(Token.G_CODE, '00'),
      token(Token.G_CODE, '01'),
      token(Token.G_CODE, '02'),
      token(Token.G_CODE, '03'),
      token(Token.G_CODE, '05'),
    ]),
  ],
  createNodes: tokens => [
    {
      type: Tree.INTERPOLATE_MODE,
      position: tokensToPosition(tokens),
      mode: tokensToMode(tokens),
    },
  ],
}

const operation: SyntaxRule = {
  name: 'operation',
  rules: [
    minToMax(0, 2, [
      token(Token.T_CODE),
      token(Token.G_CODE, '00'),
      token(Token.G_CODE, '01'),
      token(Token.G_CODE, '02'),
      token(Token.G_CODE, '03'),
      token(Token.G_CODE, '05'),
    ]),
    minToMax(2, 8, [
      token(Token.COORD_CHAR, 'X'),
      token(Token.COORD_CHAR, 'Y'),
      token(Token.COORD_CHAR, 'A'),
      token(Token.COORD_CHAR, 'I'),
      token(Token.COORD_CHAR, 'J'),
      token(Token.NUMBER)]),
    zeroOrOne([token(Token.T_CODE)]),
  ],
  createNodes(tokens) {
    const graphicTokens = tokens.filter(
      t => t.type === Token.COORD_CHAR || t.type === Token.NUMBER
    )
    const modeToken = tokens.find(t => t.type === Token.G_CODE)
    const toolToken = tokens.find(t => t.type === Token.T_CODE)
    const coordinates = tokensToCoordinates(graphicTokens)
    const code = toolToken?.value
    const mode = tokensToMode(tokens)

    const graphicPosition = tokensToPosition(tokens, {
      head: graphicTokens[0],
      length: graphicTokens.length + 1,
    })
    const modePosition = tokensToPosition(tokens, { head: modeToken, length: 2 })
    const toolPosition = tokensToPosition(tokens, { head: toolToken, length: 2 })

    const nodes: Tree.ChildNode[] = [
      {
        type: Tree.GRAPHIC,
        position: graphicPosition,
        graphic: undefined,
        coordinates,
      },
    ]

    if (mode !== undefined) {
      nodes.unshift({ type: Tree.INTERPOLATE_MODE, position: modePosition, mode })
    }

    if (code !== undefined) {
      nodes.unshift({ type: Tree.TOOL_CHANGE, position: toolPosition, code })
    }

    return nodes
  },
}

const slot: SyntaxRule = {
  name: 'slot',
  rules: [
    minToMax(2, 4, [token(Token.COORD_CHAR), token(Token.NUMBER)]),
    token(Token.G_CODE, '85'),
    minToMax(2, 4, [token(Token.COORD_CHAR), token(Token.NUMBER)]),
  ],
  createNodes(tokens) {
    const gCode = tokens.find(t => t.type === Token.G_CODE)
    const splitIndex = gCode === undefined ? -1 : tokens.indexOf(gCode)
    const start = Object.fromEntries(
      Object.entries(tokensToCoordinates(tokens.slice(0, splitIndex))).map(
        ([axis, value]) => [`${axis}0`, value]
      )
    )
    const end = tokensToCoordinates(tokens.slice(splitIndex))

    return [
      {
        type: Tree.GRAPHIC,
        position: tokensToPosition(tokens),
        graphic: Constants.SLOT,
        coordinates: { ...start, ...end },
      },
    ]
  },
}

const operatorMessage: SyntaxRule = {
  name: 'operatorMessage',
  rules: [
    one([
      token(Token.M_CODE, '45'),
      token(Token.M_CODE, '47'),
    ]),
    token(Token.COMMA),
    zeroOrMore([notToken(Token.NEWLINE)]),
  ],
  createNodes(tokens) {
    const message = tokens.slice(2,-1).map(t => t.text).join('')
    console.log(tokens)
    return [{
      type: Tree.OPERATOR_MESSAGE,
      position: tokensToPosition(tokens),
      message: message
    }]
  },
}

const done: SyntaxRule = {
  name: 'done',
  rules: [
    one([token(Token.M_CODE, '30'), token(Token.M_CODE, '00')]),
  ],
  createNodes: tokens => [
    { type: Tree.DONE, position: tokensToPosition(tokens) },
  ],
}

const header: SyntaxRule = {
  name: 'header',
  rules: [
    one([token(Token.M_CODE, '48'), token(Token.PERCENT)]),
  ],
  createNodes: tokens => [
    { type: Tree.DRILL_HEADER, position: tokensToPosition(tokens) },
  ],
}

const comment: SyntaxRule = {
  name: 'comment',
  rules: [
    one([token(Token.OPEN_PARENTHESIS), token(Token.SEMICOLON)]),
    anythineBut([token(Token.CLOSE_PARENTHESIS), token(Token.NEWLINE)]),
    one([token(Token.CLOSE_PARENTHESIS), token(Token.NEWLINE)]),
  ],
  createNodes: tokens => [
    {
      type: Tree.COMMENT,
      comment: tokensToString(tokens.slice(1, -1)),
      position: tokensToPosition(tokens),
    },
  ],
}

export const drillGrammar: SyntaxRule[] = [
  tool,
  mode,
  coordinateMode,
  operation,
  slot,
  comment,
  operatorMessage,
  units,
  done,
  header,
].map(r => ({ ...r, filetype: Constants.DRILL }))
