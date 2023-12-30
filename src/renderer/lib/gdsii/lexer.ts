import * as GDSII from './gdsii_records'
import struct from './struct'
import { RecordToken } from './types'
// LEXER

// Generator for complete records from a GDSII stream file.
export function record_reader(stream: ArrayBuffer): RecordToken[] {
  let i = 0
  const tokens: RecordToken[] = []
  console.log('stream.byteLength', stream.byteLength)
  while (i < stream.byteLength) {
    const recordHeader = stream.slice(i, i + 4)
    if (recordHeader.byteLength < 4) {
      // return
      throw new Error('recordHeader.byteLength < 4')
    }
    const [word1, word2] = struct('>HH').unpack(recordHeader)
    const recordLength = word1
    if (recordLength < 4) {
      // return
      // throw new Error('recordLength < 4')
      console.warn('recordLength < 4')
    }
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
    //   `[RECORD] ${GDSII.RecordDefinitions[recordType].name}(${word3Length}bytes of ${dataType} at ${i} (${stream.byteLength})) =`,
    //   data
    // )
    if (recordType === GDSII.RecordTypes.ENDLIB) {
      //   console.log('ENDLIB')
      break
    }
    tokens.push({
      recordType,
      data
    })
    i += recordLength
    // await sleep(100)
  }
  return tokens
}

function eightByteRealToFloat(value: ArrayBuffer): number {
  const view = new DataView(value)
  const short1 = view.getUint16(0, false)
  const short2 = view.getUint16(2, false)
  const long3 = view.getUint32(4, false)
  const exponent = (short1 & 0x7f00) / 256 - 64
  const mantissa = (((short1 & 0x00ff) * 65536 + short2) * 4294967296 + long3) / 72057594037927936.0
  if (short1 & 0x8000) {
    return -mantissa * Math.pow(16.0, exponent)
  }
  return mantissa * Math.pow(16.0, exponent)
}
