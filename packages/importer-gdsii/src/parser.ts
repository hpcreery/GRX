import * as GDSII from "./gdsii_records"
import type * as TREE from "./gdsii_tree"
import messages from "./messages"

import type { RecordToken } from "./types"

export interface ParserState {
  bnf: Partial<TREE.GDSIIBNF>
  cell: Partial<TREE.structure>
  element: Partial<TREE.element>
  el: Partial<TREE.element["el"]>
  strans: Partial<TREE.strans>
  property: Partial<TREE.property>
}

export function parse(tokens: RecordToken[]): TREE.GDSIIBNF {
  const parserState: ParserState = {
    bnf: {},
    cell: {},
    element: {},
    el: {},
    strans: {},
    property: {},
  }
  for (const [_index, token] of tokens.entries()) {
    const recordDefinition = GDSII.RecordDefinitions[token.recordType]
    if (!recordDefinition || (!recordDefinition.parse && typeof recordDefinition.parse !== "function")) {
      messages.warn(`Parser: RecordDefinition ${recordDefinition} (${token.recordType}) does not have a parse function`)
      continue
    }
    recordDefinition.parse(parserState, token.data as number[])
  }

  return parserState.bnf as TREE.GDSIIBNF
}
