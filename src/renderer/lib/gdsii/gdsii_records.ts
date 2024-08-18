import * as TREE from "./gdsii_tree"
import * as utils from "./utils"
import { ParserState } from "./parser"

// GDSII format references:
// http://boolean.klaasholwerda.nl/interface/bnf/GDSII.html
// http://www.artwork.com/gdsii/gdsii/
// http://www.buchanan1.net/stream_description.html

// Data types
export enum DataType {
  NoData = 0,
  BitArray = 1,
  TwoByteSignedInteger = 2,
  FourByteSignedInteger = 3,
  FourByteReal = 4, // not used
  EightByteReal = 5,
  ASCIIString = 6,
}

export type RecordDefinition = {
  name: string
  dataType: DataType
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse?: (state: ParserState, data: any) => void
}

export const RecordDefinitions: { [key: number]: RecordDefinition } = {
  0x00: {
    name: "HEADER",
    dataType: DataType.TwoByteSignedInteger,
    description: "File header (version number, date, time)",
    parse: (state, data: number[]) => {
      state.bnf.HEADER = {
        version: data[0],
      }
    },
  },
  0x01: {
    name: "BGNLIB",
    dataType: DataType.TwoByteSignedInteger,
    description: "Library begin, last modification date and time",
    parse: (state, data: number[]) => {
      const year = data[2]
      const month = data[3]
      const day = data[4]
      const hour = data[5]
      const minute = data[6]
      const second = data[7]
      const date = new Date(year, month, day, hour, minute, second)
      state.bnf.BGNLIB = {
        lastModificationDate: date,
        lastAccessDate: date,
      }
    },
  },
  0x02: {
    name: "LIBNAME",
    dataType: DataType.ASCIIString,
    description: "Library name",
    parse: (state, data: string) => {
      state.bnf.LIBNAME = {
        name: data,
      }
    },
  },
  0x03: {
    name: "UNITS",
    dataType: DataType.EightByteReal,
    description: "Database units, size of database unit in user units",
    parse: (state, data: number[]) => {
      state.bnf.UNITS = {
        userUnitsPerDatabaseUnit: data[0],
        metersPerDatabaseUnit: data[1],
      }
    },
  },
  0x04: {
    name: "ENDLIB",
    dataType: DataType.NoData,
    description: "Library end",
    parse: (_state, _data) => {},
  },
  0x05: {
    name: "BGNSTR",
    dataType: DataType.TwoByteSignedInteger,
    description: "Structure begin, last modification date and time",
    parse: (state, data: number[]) => {
      const year = data[2]
      const month = data[3]
      const day = data[4]
      const hour = data[5]
      const minute = data[6]
      const second = data[7]
      const date = new Date(year, month, day, hour, minute, second)
      state.cell.BGNSTR = {
        lastModificationDate: date,
        lastAccessDate: date,
      }
    },
  },
  0x06: {
    name: "STRNAME",
    dataType: DataType.ASCIIString,
    description: "Structure name",
    parse: (state, data: string) => {
      state.cell.STRNAME = {
        name: data,
      }
    },
  },
  0x07: {
    name: "ENDSTR",
    dataType: DataType.NoData,
    description: "Structure end",
    parse: (state, _data) => {
      state.bnf.structure ? state.bnf.structure.push(state.cell as TREE.structure) : (state.bnf.structure = [state.cell as TREE.structure])
      state.cell = {}
    },
  },
  0x08: {
    name: "BOUNDARY",
    dataType: DataType.NoData,
    description: "Boundary element",
    parse: (state, _data) => {
      state.element = { type: "boundary" }
    },
  },
  0x09: {
    name: "PATH",
    dataType: DataType.NoData,
    description: "Path element",
    parse: (state, _data) => {
      state.element = { type: "path" }
    },
  },
  0x0a: {
    name: "SREF",
    dataType: DataType.NoData,
    description: "Structure reference element",
    parse: (state, _data) => {
      state.element = { type: "sref" }
    },
  },
  0x0b: {
    name: "AREF",
    dataType: DataType.NoData,
    description: "Array reference element",
    parse: (state, _data) => {
      state.element = { type: "aref" }
    },
  },
  0x0c: {
    name: "TEXT",
    dataType: DataType.NoData,
    description: "Text element",
    parse: (state, _data) => {
      state.element = { type: "text" }
    },
  },
  0x0d: {
    name: "LAYER",
    dataType: DataType.TwoByteSignedInteger,
    description: "Layer number",
    parse: (state, data: number[]) => {
      type ElsWithLayer = Extract<TREE.element["el"], { LAYER: TREE.LAYER }>
      ;(state.el as ElsWithLayer).LAYER = {
        layer: data[0],
      }
    },
  },
  0x0e: {
    name: "DATATYPE",
    dataType: DataType.TwoByteSignedInteger,
    description: "Data type",
    parse: (state, data: number[]) => {
      type ElsWithDatatype = Extract<TREE.element["el"], { DATATYPE: TREE.DATATYPE }>
      ;(state.el as ElsWithDatatype).DATATYPE = {
        datatype: data[0],
      }
    },
  },
  0x0f: {
    name: "WIDTH",
    dataType: DataType.FourByteSignedInteger,
    description: "Width",
    parse: (state, data: number[]) => {
      type ElsWithWidth = Extract<Required<TREE.element["el"]>, { WIDTH: TREE.WIDTH }>
      ;(state.el as ElsWithWidth).WIDTH = {
        width: data[0],
      }
    },
  },
  0x10: {
    name: "XY",
    dataType: DataType.TwoByteSignedInteger,
    description: "Point list",
    parse: (state, data: number[]) => {
      const xy: TREE.XY = []
      for (let i = 0; i < data.length; i += 2) {
        xy.push({
          x: data[i],
          y: data[i + 1],
        })
      }
      type ElsWithXY = Extract<TREE.element["el"], { XY: TREE.XY }>
      ;(state.el as ElsWithXY).XY = xy
    },
  },
  0x11: {
    name: "ENDEL",
    dataType: DataType.NoData,
    description: "Element end",
    parse: (state, _data) => {
      type ElsWithStrans = Extract<Required<TREE.element["el"]>, { strans: TREE.strans }>
      if (!utils.isEmpty(state.strans) && state.el) {
        ;(state.el as ElsWithStrans).strans = state.strans as TREE.strans
      }
      state.element.el = state.el as TREE.element["el"]
      state.cell.element ? state.cell.element.push(state.element as TREE.element) : (state.cell.element = [state.element as TREE.element])
      state.el = {}
      state.element = {}
      state.strans = {}
    },
  },
  0x12: {
    name: "SNAME",
    dataType: DataType.ASCIIString,
    description: "Structure name. Contains the name of a referenced structure",
    parse: (state, data: string) => {
      type ElsWithSname = Extract<TREE.element["el"], { SNAME: TREE.SNAME }>
      ;(state.el as ElsWithSname).SNAME = {
        name: data,
      }
    },
  },
  0x13: {
    name: "COLROW",
    dataType: DataType.TwoByteSignedInteger,
    description: "Columns, rows",
    parse: (state, data: number[]) => {
      type ElsWithColrow = Extract<TREE.element["el"], { COLROW: TREE.COLROW }>
      ;(state.el as ElsWithColrow).COLROW = {
        cols: data[0],
        rows: data[1],
      }
    },
  },
  0x15: {
    name: "NODE",
    dataType: DataType.NoData,
    description: "Node element",
  },
  0x16: {
    name: "TEXTTYPE",
    dataType: DataType.TwoByteSignedInteger,
    description: "Text type",
    parse: (state, data: number[]) => {
      type ElsWithTexttype = Extract<TREE.element["el"], { TEXTTYPE: TREE.TEXTTYPE }>
      ;(state.el as ElsWithTexttype).TEXTTYPE = {
        texttype: data[0],
      }
    },
  },
  0x17: {
    name: "PRESENTATION",
    dataType: DataType.TwoByteSignedInteger,
    description: "Presentation",
    parse: (state, data: number[]) => {
      type ElsWithPresentation = Extract<Required<TREE.element["el"]>, { PRESENTATION: TREE.PRESENTATION }>
      ;(state.el as ElsWithPresentation).PRESENTATION = {
        font: data[0],
        verticalJustification: data[1],
        horizontalJustification: data[2],
      }
    },
  },
  0x19: {
    name: "STRING",
    dataType: DataType.ASCIIString,
    description: "String",
    parse: (state, data: string) => {
      type ElsWithString = Extract<TREE.element["el"], { STRING: TREE.STRING }>
      ;(state.el as ElsWithString).STRING = {
        string: data,
      }
    },
  },
  0x1a: {
    name: "STRANS",
    dataType: DataType.TwoByteSignedInteger,
    description: "Transformation",
    parse: (state, data: number[]) => {
      state.strans.STRANS = {
        // bit 0
        reflectAboutX: (data[0] & 0x8000) !== 0,
        // bit 13
        absoluteMag: (data[0] & 0x2000) !== 0,
        // bit 14
        absoluteAngle: (data[0] & 0x1000) !== 0,
      }
    },
  },
  0x1b: {
    name: "MAG",
    dataType: DataType.EightByteReal,
    description: "MAG",
    parse: (state, data: number[]) => {
      state.strans.MAG = {
        mag: data[0],
      }
    },
  },
  0x1c: {
    name: "ANGLE",
    dataType: DataType.EightByteReal,
    description: "ANGLE",
    parse: (state, data: number[]) => {
      state.strans.ANGLE = {
        angle: data[0],
      }
    },
  },
  0x1f: {
    name: "REFLIBS",
    dataType: DataType.ASCIIString,
    description: "REFLIBS",
  },
  0x20: {
    name: "FONTS",
    dataType: DataType.ASCIIString,
    description: "FONTS",
  },
  0x21: {
    name: "PATHTYPE",
    dataType: DataType.TwoByteSignedInteger,
    description: "PATHTYPE",
    parse: (state, data: number[]) => {
      type ElsWithPathtype = Extract<Required<TREE.element["el"]>, { PATHTYPE: TREE.PATHTYPE }>
      ;(state.el as ElsWithPathtype).PATHTYPE = {
        pathtype: data[0],
      }
    },
  },
  0x22: {
    name: "GENERATIONS",
    dataType: DataType.TwoByteSignedInteger,
    description: "GENERATIONS",
  },
  0x23: {
    name: "ATTRTABLE",
    dataType: DataType.ASCIIString,
    description: "ATTRTABLE",
  },
  0x26: {
    name: "ELFLAGS",
    dataType: DataType.TwoByteSignedInteger,
    description: "ELFLAGS",
    parse: (state, data: number[]) => {
      type ElsWithElflags = Extract<Required<TREE.element["el"]>, { ELFLAGS: TREE.ELFLAGS }>
      // TODO: finish this
      ;(state.el as ElsWithElflags).ELFLAGS = {
        elflags: data,
      }
    },
  },
  0x2a: {
    name: "NODETYPE",
    dataType: DataType.TwoByteSignedInteger,
    description: "NODETYPE",
    parse: (state, data: number[]) => {
      type ElsWithNodetype = Extract<Required<TREE.element["el"]>, { NODETYPE: TREE.NODETYPE }>
      ;(state.el as ElsWithNodetype).NODETYPE = {
        nodetype: data[0],
      }
    },
  },
  0x2b: {
    name: "PROPATTR",
    dataType: DataType.TwoByteSignedInteger,
    description: "PROPATTR",
    parse: (state, data: number[]) => {
      state.property.PROPATTR = {
        attr: data[0],
      }
    },
  },
  0x2c: {
    name: "PROPVALUE",
    dataType: DataType.ASCIIString,
    description: "PROPVALUE",
    parse: (state, data: string) => {
      state.property.PROPVALUE = {
        value: data,
      }
      state.element.property
        ? state.element.property.push(state.property as TREE.property)
        : (state.element.property = [state.property as TREE.property])
      state.property = {}
    },
  },
  0x2d: {
    name: "BOX",
    dataType: DataType.NoData,
    description: "BOX",
    parse: (state, _data) => {
      state.element = { type: "box" }
    },
  },
  0x2e: {
    name: "BOXTYPE",
    dataType: DataType.TwoByteSignedInteger,
    description: "BOXTYPE",
  },
  0x2f: {
    name: "PLEX",
    dataType: DataType.FourByteSignedInteger,
    description: "PLEX",
    parse: (state, data: number[]) => {
      type ElsWithPlex = Extract<Required<TREE.element["el"]>, { PLEX: TREE.PLEX }>
      ;(state.el as ElsWithPlex).PLEX = {
        plex: data[0],
      }
    },
  },
  0x30: {
    name: "BGNEXTN",
    dataType: DataType.FourByteSignedInteger,
    description:
      "(This record type only occurs in CustomPlus.) Applies to Pathtype 4. Contains four bytes which specify in database units the extension of a path outline beyond the first point of the path. Value can be negative. ",
    parse: (state, data: number[]) => {
      type ElsWithBgnextn = Extract<Required<TREE.element["el"]>, { BGNEXTN: TREE.BGNEXTN }>
      ;(state.el as ElsWithBgnextn).BGNEXTN = {
        bgnextn: data[0],
      }
    },
  },
  0x31: {
    name: "ENDEXTN",
    dataType: DataType.FourByteSignedInteger,
    description:
      "Applies to Pathtype 4. Contains four bytes which specify in database units the extension of a path outline beyond the last point of the path. Value can be negative.",
    parse: (state, data: number[]): TREE.ENDEXTN => {
      type ElsWithEndextn = Extract<Required<TREE.element["el"]>, { ENDEXTN: TREE.ENDEXTN }>
      return ((state.el as ElsWithEndextn).ENDEXTN = {
        endextn: data[0],
      })
    },
  },
  0x32: {
    name: "TAPENUM",
    dataType: DataType.TwoByteSignedInteger,
    description: "TAPENUM",
  },
  0x33: {
    name: "TAPECODE",
    dataType: DataType.TwoByteSignedInteger,
    description: "TAPECODE",
  },
  0x34: {
    name: "STRCLASS",
    dataType: DataType.TwoByteSignedInteger,
    description: "STRCLASS",
  },
  0x36: {
    name: "FORMAT",
    dataType: DataType.TwoByteSignedInteger,
    description: "FORMAT",
  },
  0x37: {
    name: "MASK",
    dataType: DataType.ASCIIString,
    description: "MASK",
  },
  0x38: {
    name: "ENDMASKS",
    dataType: DataType.NoData,
    description: "ENDMASKS",
  },
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
  BGNEXTN = 0x30,
  ENDEXTN = 0x31,
  TAPENUM = 0x32,
  TAPECODE = 0x33,
  STRCLASS = 0x34,
  FORMAT = 0x36,
  MASK = 0x37,
  ENDMASKS = 0x38,
}
