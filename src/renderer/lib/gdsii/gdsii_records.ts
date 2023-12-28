import * as TREE from './gdsii_tree'

// Data types
export enum DataType {
  NoData = 0,
  BitArray = 1,
  TwoByteSignedInteger = 2,
  FourByteSignedInteger = 3,
  FourByteReal = 4, // not used
  EightByteReal = 5,
  ASCIIString = 6
}

export type RecordDefinition = {
  // number: number
  // code: number
  name: string
  // format: string
  dataType: DataType
  description: string
  parse?: (data: any) => any
}

export const RecordDefinitions: { [key: number]: RecordDefinition } = {
  0x00: {
    name: 'HEADER',
    dataType: DataType.TwoByteSignedInteger,
    description: 'File header (version number, date, time)',
    parse: (data: number[]): TREE.HEADER => {
      return {
        version: data[0]
      }
    }
  },
  0x01: {
    name: 'BGNLIB',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Library begin, last modification date and time',
    parse: (data: number[]): TREE.BGNLIB => {
      const year = data[2]
      const month = data[3]
      const day = data[4]
      const hour = data[5]
      const minute = data[6]
      const second = data[7]
      const date = new Date(year, month, day, hour, minute, second)
      return {
        lastModificationDate: date,
        lastAccessDate: date
      }
    }
  },
  0x02: {
    name: 'LIBNAME',
    dataType: DataType.ASCIIString,
    description: 'Library name',
    parse: (data: string): TREE.LIBNAME => {
      return {
        name: data
      }
    }
  },
  0x03: {
    name: 'UNITS',
    dataType: DataType.EightByteReal,
    description: 'Database units, size of database unit in user units',
    parse: (data: number[]): TREE.UNITS => {
      // console.log('UNITS', data)
      return {
        userUnit: data[0],
        databaseUnit: data[1]
      }
    }
  },
  0x04: {
    name: 'ENDLIB',
    dataType: DataType.NoData,
    description: 'Library end',
    parse: (data: number[]): TREE.ENDLIB => {
      return {}
    }
  },
  0x05: {
    name: 'BGNSTR',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Structure begin, last modification date and time',
    parse: (data: number[]): TREE.BGNLIB => {
      const year = data[2]
      const month = data[3]
      const day = data[4]
      const hour = data[5]
      const minute = data[6]
      const second = data[7]
      const date = new Date(year, month, day, hour, minute, second)
      return {
        lastModificationDate: date,
        lastAccessDate: date
      }
    }
  },
  0x06: {
    name: 'STRNAME',
    dataType: DataType.ASCIIString,
    description: 'Structure name',
    parse: (data: string): TREE.STRNAME => {
      return {
        name: data
      }
    }
  },
  0x07: {
    name: 'ENDSTR',
    dataType: DataType.NoData,
    description: 'Structure end',
    parse: (data: number[]): TREE.ENDSTR => {
      return {}
    }
  },
  0x08: {
    name: 'BOUNDARY',
    dataType: DataType.NoData,
    description: 'Boundary element'
  },
  0x09: {
    name: 'PATH',
    dataType: DataType.NoData,
    description: 'Path element'
  },
  0x0a: {
    name: 'SREF',
    dataType: DataType.NoData,
    description: 'Structure reference element'
  },
  0x0b: {
    name: 'AREF',
    dataType: DataType.NoData,
    description: 'Array reference element'
  },
  0x0c: {
    name: 'TEXT',
    dataType: DataType.NoData,
    description: 'Text element'
  },
  0x0d: {
    name: 'LAYER',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Layer number',
    parse: (data: number[]): TREE.LAYER => {
      return {
        layer: data[0]
      }
    }
  },
  0x0e: {
    name: 'DATATYPE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Data type',
    parse: (data: number[]): TREE.DATATYPE => {
      return {
        datatype: data[0]
      }
    }
  },
  0x0f: {
    name: 'WIDTH',
    dataType: DataType.FourByteSignedInteger,
    description: 'Width',
    parse: (data: number[]): TREE.WIDTH => {
      return {
        width: data[0]
      }
    }
  },
  0x10: {
    name: 'XY',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Point list',
    parse: (data: number[]): TREE.XY => {
      const xy: TREE.XY = []
      for (let i = 0; i < data.length; i += 2) {
        xy.push({
          x: data[i],
          y: data[i + 1]
        })
      }
      return xy
    }
  },
  0x11: {
    name: 'ENDEL',
    dataType: DataType.NoData,
    description: 'Element end',
    parse: (data: number[]): TREE.ENDEL => {
      return {}
    }
  },
  0x12: {
    name: 'SNAME',
    dataType: DataType.ASCIIString,
    description: 'Structure name. Contains the name of a referenced structure',
    parse: (data: string): TREE.SNAME => {
      return {
        name: data
      }
    }
  },
  0x13: {
    name: 'COLROW',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Columns, rows',
    parse: (data: number[]): TREE.COLROW => {
      return {
        cols: data[0],
        rows: data[1]
      }
    }
  },
  0x15: {
    name: 'NODE',
    dataType: DataType.NoData,
    description: 'Node element'
  },
  0x16: {
    name: 'TEXTTYPE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Text type'
  },
  0x17: {
    name: 'PRESENTATION',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Presentation'
  },
  0x19: {
    name: 'STRING',
    dataType: DataType.ASCIIString,
    description: 'String',
    parse: (data: string): TREE.STRING => {
      return {
        string: data
      }
    }
  },
  0x1a: {
    name: 'STRANS',
    dataType: DataType.TwoByteSignedInteger,
    description: 'Transformation',
    parse: (data: number[]): TREE.STRANS => {
      return {
        // bit 0
        reflectAboutX: (data[0] & 0x8000) !== 0,
        // bit 13
        absoluteMag: (data[0] & 0x2000) !== 0,
        // bit 14
        absoluteAngle: (data[0] & 0x1000) !== 0
      }
    }
  },
  0x1b: {
    name: 'MAG',
    dataType: DataType.EightByteReal,
    description: 'MAG',
    parse: (data: number[]): TREE.MAG => {
      return {
        mag: data[0]
      }
    }
  },
  0x1c: {
    name: 'ANGLE',
    dataType: DataType.EightByteReal,
    description: 'ANGLE',
    parse: (data: number[]): TREE.ANGLE => {
      return {
        angle: data[0]
      }
    }
  },
  0x1f: {
    name: 'REFLIBS',
    dataType: DataType.ASCIIString,
    description: 'REFLIBS'
  },
  0x20: {
    name: 'FONTS',
    dataType: DataType.ASCIIString,
    description: 'FONTS'
  },
  0x21: {
    name: 'PATHTYPE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'PATHTYPE',
    parse: (data: number[]): TREE.PATHTYPE => {
      return {
        pathtype: data[0]
      }
    }
  },
  0x22: {
    name: 'GENERATIONS',
    dataType: DataType.TwoByteSignedInteger,
    description: 'GENERATIONS'
  },
  0x23: {
    name: 'ATTRTABLE',
    dataType: DataType.ASCIIString,
    description: 'ATTRTABLE'
  },
  0x26: {
    name: 'ELFLAGS',
    dataType: DataType.TwoByteSignedInteger,
    description: 'ELFLAGS'
  },
  0x2a: {
    name: 'NODETYPE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'NODETYPE'
  },
  0x2b: {
    name: 'PROPATTR',
    dataType: DataType.TwoByteSignedInteger,
    description: 'PROPATTR'
  },
  0x2c: {
    name: 'PROPVALUE',
    dataType: DataType.ASCIIString,
    description: 'PROPVALUE'
  },
  0x2d: {
    name: 'BOX',
    dataType: DataType.NoData,
    description: 'BOX'
  },
  0x2e: {
    name: 'BOXTYPE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'BOXTYPE'
  },
  0x2f: {
    name: 'PLEX',
    dataType: DataType.FourByteSignedInteger,
    description: 'PLEX'
  },
  0x32: {
    name: 'TAPENUM',
    dataType: DataType.TwoByteSignedInteger,
    description: 'TAPENUM'
  },
  0x33: {
    name: 'TAPECODE',
    dataType: DataType.TwoByteSignedInteger,
    description: 'TAPECODE'
  },
  0x34: {
    name: 'STRCLASS',
    dataType: DataType.TwoByteSignedInteger,
    description: 'STRCLASS'
  },
  0x36: {
    name: 'FORMAT',
    dataType: DataType.TwoByteSignedInteger,
    description: 'FORMAT'
  },
  0x37: {
    name: 'MASK',
    dataType: DataType.ASCIIString,
    description: 'MASK'
  },
  0x38: {
    name: 'ENDMASKS',
    dataType: DataType.NoData,
    description: 'ENDMASKS'
  }
}

export enum RecordTypes {
  HEADER = 0x00,
  BGNLIB = 0x01,
  LIBNAME = 0x02,
  UNITS = 0x03,
  ENDLIB = 0x04,
  BGNSTR = 0x05,
  STRNAME = 0x06,
  ENDSTR = 0x07,
  BOUNDARY = 0x08,
  PATH = 0x09,
  SREF = 0x0a,
  AREF = 0x0b,
  TEXT = 0x0c,
  LAYER = 0x0d,
  DATATYPE = 0x0e,
  WIDTH = 0x0f,
  XY = 0x10,
  ENDEL = 0x11,
  SNAME = 0x12,
  COLROW = 0x13,
  TEXTNODE = 0x14,
  NODE = 0x15,
  TEXTTYPE = 0x16,
  PRESENTATION = 0x17,
  SPACING = 0x18,
  STRING = 0x19,
  STRANS = 0x1a,
  MAG = 0x1b,
  ANGLE = 0x1c,
  REFLIBS = 0x1f,
  FONTS = 0x20,
  PATHTYPE = 0x21,
  GENERATIONS = 0x22,
  ATTRTABLE = 0x23,
  ELFLAGS = 0x26,
  NODETYPE = 0x2a,
  PROPATTR = 0x2b,
  PROPVALUE = 0x2c,
  BOX = 0x2d,
  BOXTYPE = 0x2e,
  PLEX = 0x2f,
  TAPENUM = 0x32,
  TAPECODE = 0x33,
  STRCLASS = 0x34,
  FORMAT = 0x36,
  MASK = 0x37,
  ENDMASKS = 0x30
}
