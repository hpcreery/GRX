import * as NC from './records'
import * as TREE from './tree'

import { RecordToken } from './types'

export interface ParserState {
  // bnf: Partial<TREE.GDSIIBNF>
  // cell: Partial<TREE.structure>
  // element: Partial<TREE.element>
  // el: Partial<TREE.element["el"]>
  // strans: Partial<TREE.strans>
  // property: Partial<TREE.property>
}

export function parse(tokens: RecordToken[]): TREE.Root {
  const parserState: ParserState = {
    // bnf: {},
    // cell: {},
    // element: {},
    // el: {},
    // strans: {},
    // property: {}
  }

  // console.log('gdsii tokens', tokens)
  for (const [_index, token] of tokens.entries()) {
    const recordDefinition = NC.RecordDefinitions[token.recordType]
    if (!recordDefinition || !recordDefinition.parse && typeof recordDefinition.parse !== 'function') {
      console.warn(
        `RecordDefinition ${recordDefinition} (${token.recordType}) does not have a parse function`
      )
      continue
    }
    recordDefinition.parse(parserState, token.data as number[])
  }

  // console.log('gdsii bnf', parserState.bnf)
  return parserState.bnf as TREE.Root
}
