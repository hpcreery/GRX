export type HEADER = {
  version: number
}

export type BGNLIB = {
  lastModificationDate: Date
  lastAccessDate: Date
}

export type LIBNAME = {
  name: string
}

export type UNITS = {
  userUnit: number
  databaseUnit: number
}

export type ENDLIB = Record<string, never> //{}

export type BGNSTR = {
  lastModificationDate: number
  lastModificationTime: number
}

export type STRNAME = {
  name: string
}

export type ENDSTR = Record<string, never> //{}

export type BOUNDARY = Record<string, never> //{}

export type PATH = Record<string, never> //{}

export type SREF = Record<string, never> //{}

export type AREF = Record<string, never> //{}

export type TEXT = Record<string, never> //{}

export type LAYER = {
  layer: number
}

export type DATATYPE = {
  datatype: number
}

export type WIDTH = {
  width: number
}

export type XY = {
  x: number
  y: number
}[]

export type ENDEL = Record<string, never> //{}

export type SNAME = {
  name: string
}

export type COLROW = {
  cols: number
  rows: number
}

export type NODE = Record<string, never> //{}

export type TEXTTYPE = {
  texttype: number
}

export type PRESENTATION = {
  font: number
  verticalJustification: number
  horizontalJustification: number
}

export type STRING = {
  string: string
}

export type STRANS = {
  reflectAboutX: boolean
  absoluteMag: boolean
  absoluteAngle: boolean
}

export type MAG = {
  mag: number
}

export type ANGLE = {
  angle: number
}

export type REFLIBS = {
  libraries: string[]
}

export type FONTS = {
  fonts: string[]
}

export type PATHTYPE = {
  pathtype: number
}

export type GENERATIONS = {
  generations: number[]
}

export type ATTRTABLE = Record<string, never> //{}

export type STYPTABLE = Record<string, never> //{}

export type STRTYPE = Record<string, never> //{}

export type ELFLAGS = Record<string, never> //{}

export type LINKTYPE = Record<string, never> //{}

export type LINKKEYS = Record<string, never> //{}

export type NODETYPE = {
  nodetype: number
}

export type PROPATTR = {
  attr: number
}

export type PROPVALUE = {
  value: string
}

export type BOX = Record<string, never> //{}

export type BOXTYPE = Record<string, never> //{}

export type PLEX = {
  plex: number
}

export type BGNEXTN = {
  bgnextn: number
}

export type ENDEXTN = {
  endextn: number
}

export type TAPENUM = {
  tapenum: number
}

export type TAPECODE = {
  tapecode: number
}

export type STRCLASS = {
  strclass: number
}

export type RESERVED = Record<string, never> //{}

export type FORMAT = {
  format: number
}

export type MASK = {
  mask: string
}

export type ENDMASKS = Record<string, never> //{}

// ### STRUCTURE ###

export type GDSIIBNF = {
  HEADER: HEADER
  BGNLIB: BGNLIB
  LIBNAME: LIBNAME
  FormatType?: FormatType
  UNITS: UNITS
  structure: structure[]
  ENDLIB: ENDLIB
}

export type FormatType = {
  FORMAT: FORMAT
  MASK?: MASK
  ENDMASKS?: ENDMASKS
}

export type structure = {
  BGNSTR: BGNSTR
  STRNAME: STRNAME
  element: element[]
  ENDSTR: ENDSTR
}

export type element = {
  el?: boundary | path | sref | aref | text | node | box
  property?: property[]
  ENDEL: ENDEL
  type: 'boundary' | 'path' | 'sref' | 'aref' | 'text' | 'node' | 'box'
}

export type boundary = {
  BOUNDARY: BOUNDARY
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  LAYER: LAYER
  DATATYPE: DATATYPE
  XY: XY
}

export type path = {
  PATH: PATH
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  LAYER: LAYER
  DATATYPE: DATATYPE
  PATHTYPE?: PATHTYPE
  WIDTH?: WIDTH
  BGNEXTN?: BGNEXTN
  ENDEXTN?: ENDEXTN
  XY: XY
}

export type sref = {
  SREF: SREF
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  SNAME: SNAME
  strans?: strans
  XY: XY
}

export type aref = {
  AREF: AREF
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  SNAME: SNAME
  COLROW: COLROW
  strans?: strans
  XY: XY
}

export type text = {
  TEXT: TEXT
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  LAYER: LAYER
  // textbody: textbody
  TEXTTYPE: TEXTTYPE
  PRESENTATION?: PRESENTATION
  PATHTYPE?: PATHTYPE
  WIDTH?: WIDTH
  strans?: strans
  XY: XY
  STRING: STRING
}

export type node = {
  NODE: NODE
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  LAYER: LAYER
  NODETYPE: NODETYPE
  XY: XY
}

export type box = {
  BOX: BOX
  ELFLAGS?: ELFLAGS
  PLEX?: PLEX
  LAYER: LAYER
  BOXTYPE: BOXTYPE
  XY: XY
}

// export type textbody = {
//   TEXTTYPE: TEXTTYPE
//   PRESENTATION?: PRESENTATION
//   PATHTYPE?: PATHTYPE
//   WIDTH?: WIDTH
//   strans?: strans
//   XY: XY
//   STRING: STRING
// }

export type property = {
  PROPATTR: PROPATTR
  PROPVALUE: PROPVALUE
}

export type strans = {
  STRANS: STRANS
  MAG?: MAG
  ANGLE?: ANGLE
}
