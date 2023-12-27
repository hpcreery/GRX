import struct from './struct'
import gdsiiFile from './test/example.gds2?url'

import * as GDSII from './gdsii'
import * as TREE from './tree'
import * as converter from './converter'

// GDSII format references:
// http://boolean.klaasholwerda.nl/interface/bnf/GDSII.html
// http://www.artwork.com/gdsii/gdsii/
// http://www.buchanan1.net/stream_description.html

function buf2hex(buffer: ArrayBuffer) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

// LEXER

// Generator for complete records from a GDSII stream file.
function record_reader(stream: ArrayBuffer): RecordToken[] {
  let i = 0
  let tokens: RecordToken[] = []
  while (i < stream.byteLength) {
    const recordHeader = stream.slice(i, i + 4)
    if (recordHeader.byteLength < 4) {
      // return
      throw new Error('recordHeader.byteLength < 4')
    }
    const [word1, word2] = struct('>HH').unpack(recordHeader)
    const recordLength = word1
    const recordType = Math.floor(word2 / 256)
    const dataType = word2 & 0x00ff
    const word3 = stream.slice(i + 4, i + recordLength)
    const word3Length = recordLength - 4
    let data: any
    if (dataType === GDSII.DataType.NoData) {
      data = null
    } else if (dataType === GDSII.DataType.BitArray) {
      data = struct(`>${Math.floor(word3Length / 2)}H`).unpack(word3)
    } else if (dataType === GDSII.DataType.TwoByteSignedInteger) {
      data = struct(`>${Math.floor(word3Length / 2)}h`).unpack(word3)
    } else if (dataType === GDSII.DataType.FourByteSignedInteger) {
      data = struct(`>${Math.floor(word3Length / 4)}i`).unpack(word3)
    } else if (dataType === GDSII.DataType.EightByteReal) {
      data = []
      for (let j = 0; j < word3Length; j += 8) {
        data.push(eightByteRealToFloat(word3.slice(j, j + 8)))
      }
    } else if (dataType === GDSII.DataType.ASCIIString) {
      // data = String.fromCharCode.apply(null, new Uint8Array(word3))
      data = new TextDecoder().decode(word3)
    } else {
      console.warn('unknown dataType', dataType)
    }
    // console.log(
    //   `[RECORD] ${GDSII.RecordTypes[recordType].name}(${word3Length}bytes of ${dataType}) =`,
    //   data
    // )
    tokens.push({
      recordType,
      data
    })
    i += recordLength
  }
  return tokens
}

function eightByteRealToFloat(value: ArrayBuffer): number {
  let view = new DataView(value)
  let short1 = view.getUint16(0, false)
  let short2 = view.getUint16(2, false)
  let long3 = view.getUint32(4, false)
  let exponent = (short1 & 0x7f00) / 256 - 64
  let mantissa = (((short1 & 0x00ff) * 65536 + short2) * 4294967296 + long3) / 72057594037927936.0
  if (short1 & 0x8000) {
    return -mantissa * Math.pow(16.0, exponent)
  }
  return mantissa * Math.pow(16.0, exponent)
}

export async function test() {
  const buffer = await (await fetch(gdsiiFile)).arrayBuffer()
  // console.log('buffer', buffer)
  // console.log(buf2hex(buffer))
  const tokens = record_reader(buffer)
  const p = new Parser(tokens)
  // converter.convert(p.bnf)
  return p.bnf
}

type RecordToken = {
  recordType: number
  data: ArrayBuffer | number[] | string
}

// type kwargsType = {
//   layer?: TREE.LAYER
//   datatype?: TREE.DATATYPE
//   xy?: TREE.XY
//   ref_cell?: TREE.SNAME
//   text?: TREE.TEXT
//   colrow?: TREE.COLROW
// }

export class Parser {
  tokens: RecordToken[] = []
  index: number = 0
  bnf: Partial<TREE.GDSIIBNF> = {}

  constructor(tokens: RecordToken[]) {
    this.tokens = tokens
    this.index = 0

    let cell: Partial<TREE.structure> = {}
    let element: Partial<TREE.element> = {}
    let el: Partial<
      TREE.boundary | TREE.path | TREE.sref | TREE.aref | TREE.text | TREE.node | TREE.box
    > = {}
    let strans: Partial<TREE.strans> = {}
    let property: Partial<TREE.property> = {}

    for (const [index, token] of tokens.entries()) {
      this.index = index
      // console.log(index, token)

      if (token.recordType === GDSII.RecordTypes.HEADER) {
        this.bnf.HEADER = this.parseNode<TREE.HEADER>(GDSII.RecordTypes.HEADER)
      } else if (token.recordType === GDSII.RecordTypes.BGNLIB) {
        this.bnf.BGNLIB = this.parseNode<TREE.BGNLIB>(GDSII.RecordTypes.BGNLIB)
      } else if (token.recordType === GDSII.RecordTypes.LIBNAME) {
        this.bnf.LIBNAME = this.parseNode<TREE.LIBNAME>(GDSII.RecordTypes.LIBNAME)
      } else if (token.recordType === GDSII.RecordTypes.UNITS) {
        this.bnf.UNITS = this.parseNode<TREE.UNITS>(GDSII.RecordTypes.UNITS)
      } else if (token.recordType === GDSII.RecordTypes.ENDLIB) {
        this.bnf.ENDLIB = this.parseNode<TREE.ENDLIB>(GDSII.RecordTypes.ENDLIB)
      } else if (token.recordType === GDSII.RecordTypes.BGNSTR) {
        cell.BGNSTR = this.parseNode<TREE.BGNSTR>(GDSII.RecordTypes.BGNSTR)
      } else if (token.recordType === GDSII.RecordTypes.STRNAME) {
        cell.STRNAME = this.parseNode<TREE.STRNAME>(GDSII.RecordTypes.STRNAME)
      } else if (token.recordType === GDSII.RecordTypes.ENDSTR) {
        cell.ENDSTR = this.parseNode<TREE.ENDSTR>(GDSII.RecordTypes.ENDSTR)
        this.bnf.structure ? this.bnf.structure.push(cell) : (this.bnf.structure = [cell])
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
        el.LAYER = this.parseNode<TREE.LAYER>(GDSII.RecordTypes.LAYER)
      } else if (token.recordType === GDSII.RecordTypes.DATATYPE) {
        el.DATATYPE = this.parseNode<TREE.DATATYPE>(GDSII.RecordTypes.DATATYPE)
      } else if (token.recordType === GDSII.RecordTypes.WIDTH) {
        el.WIDTH = this.parseNode<TREE.WIDTH>(GDSII.RecordTypes.WIDTH)
      } else if (token.recordType === GDSII.RecordTypes.XY) {
        el.XY = this.parseNode<TREE.XY>(GDSII.RecordTypes.XY)
      } else if (token.recordType === GDSII.RecordTypes.ENDEL) {
        element.ENDEL = this.parseNode<TREE.ENDEL>(GDSII.RecordTypes.ENDEL)
        if (!isEmpty(strans)) el.strans = strans
        element.el = el
        cell.element ? cell.element.push(element) : (cell.element = [element])
        el = {}
        element = {}
        strans = {}
      } else if (token.recordType === GDSII.RecordTypes.SNAME) {
        el.SNAME = this.parseNode<TREE.SNAME>(GDSII.RecordTypes.SNAME)
      } else if (token.recordType === GDSII.RecordTypes.COLROW) {
        if (el.type === 'aref') {
          ;(el as TREE.aref).COLROW = this.parseNode<TREE.COLROW>(GDSII.RecordTypes.COLROW)
        }
      } else if (token.recordType === GDSII.RecordTypes.ELFLAGS) {
        element.ELFLAGS = this.parseNode<TREE.ELFLAGS>(GDSII.RecordTypes.ELFLAGS)
      } else if (token.recordType === GDSII.RecordTypes.PLEX) {
        element.PLEX = this.parseNode<TREE.PLEX>(GDSII.RecordTypes.PLEX)
      } else if (token.recordType === GDSII.RecordTypes.PATHTYPE) {
        el.PATHTYPE = this.parseNode<TREE.PATHTYPE>(GDSII.RecordTypes.PATHTYPE)
      } else if (token.recordType === GDSII.RecordTypes.STRANS) {
        strans.STRANS = this.parseNode<TREE.STRANS>(GDSII.RecordTypes.STRANS)
      } else if (token.recordType === GDSII.RecordTypes.MAG) {
        strans.MAG = this.parseNode<TREE.MAG>(GDSII.RecordTypes.MAG)
      } else if (token.recordType === GDSII.RecordTypes.ANGLE) {
        strans.ANGLE = this.parseNode<TREE.ANGLE>(GDSII.RecordTypes.ANGLE)
      } else if (token.recordType === GDSII.RecordTypes.TEXTTYPE) {
        el.TEXTTYPE = this.parseNode<TREE.TEXTTYPE>(GDSII.RecordTypes.TEXTTYPE)
      } else if (token.recordType === GDSII.RecordTypes.PRESENTATION) {
        el.PRESENTATION = this.parseNode<TREE.PRESENTATION>(GDSII.RecordTypes.PRESENTATION)
      } else if (token.recordType === GDSII.RecordTypes.STRING) {
        el.STRING = this.parseNode<TREE.STRING>(GDSII.RecordTypes.STRING)
      } else if (token.recordType === GDSII.RecordTypes.NODETYPE) {
        el.NODETYPE = this.parseNode<TREE.NODETYPE>(GDSII.RecordTypes.NODETYPE)
      } else if (token.recordType === GDSII.RecordTypes.PROPATTR) {
        property.PROPATTR = this.parseNode<TREE.PROPATTR>(GDSII.RecordTypes.PROPATTR)
      } else if (token.recordType === GDSII.RecordTypes.PROPVALUE) {
        property.PROPVALUE = this.parseNode<TREE.PROPVALUE>(GDSII.RecordTypes.PROPVALUE)
        el.property ? el.property.push(property) : (el.property = [property])
        property = {}
      } else {
        console.warn(`unknown token ${token} (${GDSII.RecordDefinitions[token.recordType]})`)
      }

      // console.log('bnf', this.bnf)
    }

    console.log('bnf', this.bnf)
  }

  parseNode<T>(recordType: number): T {
    const token = this.currentToken
    // check to see if it has parse function
    if (token.recordType !== recordType) {
      console.error(
        `trying to parse RecordType ${
          GDSII.RecordDefinitions[recordType].name
        } but it does not match the token at ${this.index} ${
          GDSII.RecordDefinitions[token.recordType].name
        }`
      )
      return {} as T
      // return null
    }
    const recordDefinition = GDSII.RecordDefinitions[recordType]
    if (!recordDefinition.hasOwnProperty('parse')) {
      console.warn(
        `RecordDefinition ${recordDefinition.name} (${recordType}) does not have a parse function`
      )
      return {} as T
      // return null
    }
    // only advance if we successfully parsed the token
    // this.index++
    return recordDefinition.parse!(this, token.data as number[]) as T
  }

  currentNodeIs(recordType: number): boolean {
    return this.currentToken.recordType === recordType
  }

  get currentToken(): RecordToken {
    return this.tokens[this.index]
  }
}
