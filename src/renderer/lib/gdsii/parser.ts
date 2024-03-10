import * as GDSII from './gdsii_records'
import * as TREE from './gdsii_tree'
import * as utils from './utils'

import { RecordToken } from './types'

// GDSII format references:
// http://boolean.klaasholwerda.nl/interface/bnf/GDSII.html
// http://www.artwork.com/gdsii/gdsii/
// http://www.buchanan1.net/stream_description.html

export function parse(tokens: RecordToken[]): TREE.GDSIIBNF {
  const bnf: Partial<TREE.GDSIIBNF> = {}
  let cell: Partial<TREE.structure> = {}
  let element: Partial<TREE.element> = {}
  // let el: Partial<
  //   TREE.boundary | TREE.path | TREE.sref | TREE.aref | TREE.text | TREE.node | TREE.box
  // > = {}
  let el: Partial<
    TREE.boundary & TREE.path & TREE.sref & TREE.aref & TREE.text & TREE.node & TREE.box
  > = {}
  let strans: Partial<TREE.strans> = {}
  let property: Partial<TREE.property> = {}

  for (const [index, token] of tokens.entries()) {
    if (token.recordType === GDSII.RecordTypes.HEADER) {
      bnf.HEADER = parseRecord<TREE.HEADER>(token)
    } else if (token.recordType === GDSII.RecordTypes.BGNLIB) {
      bnf.BGNLIB = parseRecord<TREE.BGNLIB>(token)
    } else if (token.recordType === GDSII.RecordTypes.LIBNAME) {
      bnf.LIBNAME = parseRecord<TREE.LIBNAME>(token)
    } else if (token.recordType === GDSII.RecordTypes.UNITS) {
      bnf.UNITS = parseRecord<TREE.UNITS>(token)
    } else if (token.recordType === GDSII.RecordTypes.ENDLIB) {
      // bnf.ENDLIB = parseRecord<TREE.ENDLIB>(GDSII.RecordTypes.ENDLIB)
      continue
    } else if (token.recordType === GDSII.RecordTypes.BGNSTR) {
      cell.BGNSTR = parseRecord<TREE.BGNSTR>(token)
    } else if (token.recordType === GDSII.RecordTypes.STRNAME) {
      cell.STRNAME = parseRecord<TREE.STRNAME>(token)
    } else if (token.recordType === GDSII.RecordTypes.ENDSTR) {
      // cell.ENDSTR = parseRecord<TREE.ENDSTR>(GDSII.RecordTypes.ENDSTR) // no data
      bnf.structure
        ? bnf.structure.push(cell as TREE.structure)
        : (bnf.structure = [cell as TREE.structure])
      cell = {}
    } else if (token.recordType === GDSII.RecordTypes.BOUNDARY) {
      element = { type: 'boundary' }
    } else if (token.recordType === GDSII.RecordTypes.PATH) {
      element = { type: 'path' }
    } else if (token.recordType === GDSII.RecordTypes.SREF) {
      element = { type: 'sref' }
    } else if (token.recordType === GDSII.RecordTypes.AREF) {
      element = { type: 'aref' }
    } else if (token.recordType === GDSII.RecordTypes.TEXT) {
      element = { type: 'text' }
    } else if (token.recordType === GDSII.RecordTypes.BOX) {
      element = { type: 'box' }
    } else if (token.recordType === GDSII.RecordTypes.LAYER) {
      el.LAYER = parseRecord<TREE.LAYER>(token)
    } else if (token.recordType === GDSII.RecordTypes.DATATYPE) {
      el.DATATYPE = parseRecord<TREE.DATATYPE>(token)
    } else if (token.recordType === GDSII.RecordTypes.WIDTH) {
      el.WIDTH = parseRecord<TREE.WIDTH>(token)
    } else if (token.recordType === GDSII.RecordTypes.XY) {
      el.XY = parseRecord<TREE.XY>(token)
    } else if (token.recordType === GDSII.RecordTypes.ENDEL) {
      // element.ENDEL = parseRecord<TREE.ENDEL>(GDSII.RecordTypes.ENDEL) // no data
      if (!utils.isEmpty(strans)) el.strans = strans as TREE.strans
      element.el = el as
        | TREE.boundary
        | TREE.path
        | TREE.sref
        | TREE.aref
        | TREE.text
        | TREE.node
        | TREE.box
      cell.element
        ? cell.element.push(element as TREE.element)
        : (cell.element = [element as TREE.element])
      el = {}
      element = {}
      strans = {}
    } else if (token.recordType === GDSII.RecordTypes.SNAME) {
      el.SNAME = parseRecord<TREE.SNAME>(token)
    } else if (token.recordType === GDSII.RecordTypes.COLROW) {
      if (element.type === 'aref') {
        ;(el as TREE.aref).COLROW = parseRecord<TREE.COLROW>(token)
      }
    } else if (token.recordType === GDSII.RecordTypes.ELFLAGS) {
      ;(element as TREE.boundary).ELFLAGS = parseRecord<TREE.ELFLAGS>(token)
    } else if (token.recordType === GDSII.RecordTypes.PLEX) {
      ;(element as TREE.boundary).PLEX = parseRecord<TREE.PLEX>(token)
    } else if (token.recordType === GDSII.RecordTypes.PATHTYPE) {
      el.PATHTYPE = parseRecord<TREE.PATHTYPE>(token)
    } else if (token.recordType === GDSII.RecordTypes.STRANS) {
      strans.STRANS = parseRecord<TREE.STRANS>(token)
    } else if (token.recordType === GDSII.RecordTypes.MAG) {
      strans.MAG = parseRecord<TREE.MAG>(token)
    } else if (token.recordType === GDSII.RecordTypes.ANGLE) {
      strans.ANGLE = parseRecord<TREE.ANGLE>(token)
    } else if (token.recordType === GDSII.RecordTypes.TEXTTYPE) {
      el.TEXTTYPE = parseRecord<TREE.TEXTTYPE>(token)
    } else if (token.recordType === GDSII.RecordTypes.PRESENTATION) {
      el.PRESENTATION = parseRecord<TREE.PRESENTATION>(token)
    } else if (token.recordType === GDSII.RecordTypes.STRING) {
      el.STRING = parseRecord<TREE.STRING>(token)
    } else if (token.recordType === GDSII.RecordTypes.NODETYPE) {
      el.NODETYPE = parseRecord<TREE.NODETYPE>(token)
    } else if (token.recordType === GDSII.RecordTypes.PROPATTR) {
      property.PROPATTR = parseRecord<TREE.PROPATTR>(token)
    } else if (token.recordType === GDSII.RecordTypes.PROPVALUE) {
      property.PROPVALUE = parseRecord<TREE.PROPVALUE>(token)
      element.property
        ? element.property.push(property as TREE.property)
        : (element.property = [property as TREE.property])
      property = {}
    } else {
      console.warn(`unknown token ${token} (${GDSII.RecordDefinitions[token.recordType]})`)
    }
  }

  console.log('bnf', bnf)

  function parseRecord<T>(token: RecordToken): T {
    // check to see if it has parse function
    const recordDefinition = GDSII.RecordDefinitions[token.recordType]
    // if (!recordDefinition.hasOwnProperty('parse')) {
    if (!recordDefinition.parse) {
      console.warn(
        `RecordDefinition ${recordDefinition.name} (${token.recordType}) does not have a parse function`
      )
      return {} as T
      // return null
    }
    return recordDefinition.parse!(token.data as number[]) as T
  }
  return bnf as TREE.GDSIIBNF
}
