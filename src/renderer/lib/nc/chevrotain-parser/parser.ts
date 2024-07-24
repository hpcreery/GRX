import { Lexer, createToken, CstParser, CstNode, ParserMethod, IToken, Rule, generateCstDts } from "chevrotain"
// import { CommandCstChildren, ProgramCstChildren, UnitsCstChildren } from './nccst';
import * as Cst from './nccst';
import * as Shapes from '@src/renderer/shapes'
import * as Symbols from '@src/renderer/symbols'

import { Units } from '@src/renderer/types'
import { Format, UnitsType, ZeroSuppression } from '../parser/types';
// import { LEADING, MOVE, TRAILING } from '../parser/constants';
import * as Constants from '../parser/constants'


const DefaultTokens = {
  WhiteSpace: createToken({ name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true }),
  Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?(?:\d+)?|\.\d+)/ }),
  Units: createToken({ name: "Units", pattern: /METRIC|INCH/ }),
  TrailingZeros: createToken({ name: "TrailingZeros", pattern: /TZ/ }),
  LeadingZeros: createToken({ name: "LeadingZeros", pattern: /LZ/ }),
  T: createToken({ name: "T", pattern: /T\d{1,2}(?:\d{1,2})?/ }),
  // Tool Parameters
  F: createToken({ name: "F", pattern: /F/ }),
  S: createToken({ name: "S", pattern: /S/ }),
  C: createToken({ name: "C", pattern: /C/ }),
  B: createToken({ name: "B", pattern: /B/ }),
  H: createToken({ name: "H", pattern: /H/ }),
  Z: createToken({ name: "Z", pattern: /Z/ }),
  // Coordinate System
  X: createToken({ name: "X", pattern: /X/ }),
  Y: createToken({ name: "Y", pattern: /Y/ }),
  A: createToken({ name: "A", pattern: /A/ }),
  I: createToken({ name: "I", pattern: /I/ }),
  J: createToken({ name: "J", pattern: /J/ }),
  // M Codes
  M00: createToken({ name: "M00", pattern: /M00/ }),
  M01: createToken({ name: "M01", pattern: /M01/ }),
  M02: createToken({ name: "M02", pattern: /M02/ }),
  M06: createToken({ name: "M06", pattern: /M06/ }),
  M08: createToken({ name: "M06", pattern: /M08/ }),
  M09: createToken({ name: "M09", pattern: /M09/ }),
  M14: createToken({ name: "M14", pattern: /M14/ }),
  M15: createToken({ name: "M15", pattern: /M15/ }),
  M16: createToken({ name: "M16", pattern: /M16/ }),
  M17: createToken({ name: "M17", pattern: /M17/ }),
  M25: createToken({ name: "M25", pattern: /M25/ }),
  M30: createToken({ name: "M30", pattern: /M30/ }),
  M45: createToken({ name: "M45", pattern: /M45/, push_mode: "TextMode" }),
  M47: createToken({ name: "M47", pattern: /M47/, push_mode: "TextMode" }),
  M48: createToken({ name: "M48", pattern: /M48/ }),
  M71: createToken({ name: "M71", pattern: /M71/ }),
  M72: createToken({ name: "M72", pattern: /M72/ }),
  // G Codes
  G00: createToken({ name: "G00", pattern: /G00/ }),
  G01: createToken({ name: "G01", pattern: /G01/ }),
  G02: createToken({ name: "G02", pattern: /G02/ }),
  G03: createToken({ name: "G03", pattern: /G03/ }),
  G04: createToken({ name: "G04", pattern: /G04/ }),
  G05: createToken({ name: "G05", pattern: /G05/ }),
  G32: createToken({ name: "G32", pattern: /G32/ }),
  G33: createToken({ name: "G33", pattern: /G33/ }),
  G40: createToken({ name: "G40", pattern: /G40/ }),
  G41: createToken({ name: "G41", pattern: /G41/ }),
  G42: createToken({ name: "G42", pattern: /G42/ }),
  G90: createToken({ name: "G90", pattern: /G90/ }),
  G91: createToken({ name: "G91", pattern: /G91/ }),
  G93: createToken({ name: "G93", pattern: /G93/ }),
  // Other
  Percent: createToken({ name: "Percent", pattern: /%/ }),
  Comma: createToken({ name: "Comma", pattern: /,/ }),
  LParen: createToken({ name: "LParen", pattern: /\(/, push_mode: "CommentMode" }),
  RParen: createToken({ name: "RParen", pattern: /\)/ }),
  // Attribute: createToken({ name: "Attribute", pattern: /#@!/ }),
  Semicolon: createToken({ name: "Semicolon", pattern: /;/, push_mode: "CommentMode" }),
} as const

const CommentTokens = {
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true, pop_mode: true }),
  RParen: createToken({ name: "RParen", pattern: /\)/, pop_mode: true }),
  Attribute: createToken({ name: "Attribute", pattern: /\s*#@!/ }),
  Text: createToken({ name: "Text", pattern: /[^\r\n)]+/ }),
}

const TextTokens = {
  Text: createToken({ name: "Text", pattern: /[^\r\n]+/ }),
  EndText: createToken({ name: "EndText", pattern: /\r?\n/, pop_mode: true, line_breaks: true }),
}


const multiModeLexerDefinition = {
  modes: {
    DefaultMode: Object.values(DefaultTokens),
    CommentMode: Object.values(CommentTokens),
    TextMode: Object.values(TextTokens),
  },

  defaultMode: "DefaultMode",
};

export const SelectLexer = new Lexer(multiModeLexerDefinition)

class NCParser extends CstParser {
  command!: ParserMethod<unknown[], CstNode>
  units!: ParserMethod<unknown[], CstNode>
  toolDefinition!: ParserMethod<unknown[], CstNode>
  toolChange!: ParserMethod<unknown[], CstNode>
  comment!: ParserMethod<unknown[], CstNode>
  move!: ParserMethod<unknown[], CstNode>
  toolDia!: ParserMethod<unknown[], CstNode>
  feed!: ParserMethod<unknown[], CstNode>
  speed!: ParserMethod<unknown[], CstNode>
  retractRate!: ParserMethod<unknown[], CstNode>
  hitCount!: ParserMethod<unknown[], CstNode>
  depthOffset!: ParserMethod<unknown[], CstNode>
  xy!: ParserMethod<unknown[], CstNode>
  xory!: ParserMethod<unknown[], CstNode>
  x!: ParserMethod<unknown[], CstNode>
  y!: ParserMethod<unknown[], CstNode>
  coordinate!: ParserMethod<unknown[], CstNode>
  arcRadius!: ParserMethod<unknown[], CstNode>
  arcCenter!: ParserMethod<unknown[], CstNode>
  endOfProgramNoRewind!: ParserMethod<unknown[], CstNode>
  beginPattern!: ParserMethod<unknown[], CstNode>
  endOfPattern!: ParserMethod<unknown[], CstNode>
  repeatPatternOffset!: ParserMethod<unknown[], CstNode>
  optionalStop!: ParserMethod<unknown[], CstNode>
  endOfStepAndRepeat!: ParserMethod<unknown[], CstNode>
  stopForInspect!: ParserMethod<unknown[], CstNode>
  zAxisRoutPositionWithDepthControlledCountoring!: ParserMethod<unknown[], CstNode>
  zAxisRoutPosition!: ParserMethod<unknown[], CstNode>
  retractWithClamping!: ParserMethod<unknown[], CstNode>
  retract!: ParserMethod<unknown[], CstNode>
  endOfProgramRewind!: ParserMethod<unknown[], CstNode>
  longOperatorMessage!: ParserMethod<unknown[], CstNode>
  operatorMessage!: ParserMethod<unknown[], CstNode>
  header!: ParserMethod<unknown[], CstNode>
  metricMode!: ParserMethod<unknown[], CstNode>
  inchMode!: ParserMethod<unknown[], CstNode>
  routMode!: ParserMethod<unknown[], CstNode>
  linearMove!: ParserMethod<unknown[], CstNode>
  circularClockwiseMove!: ParserMethod<unknown[], CstNode>
  circularCounterclockwiseMove!: ParserMethod<unknown[], CstNode>
  dwell!: ParserMethod<unknown[], CstNode>
  drillMode!: ParserMethod<unknown[], CstNode>
  cwCircle!: ParserMethod<unknown[], CstNode>
  ccwCircle!: ParserMethod<unknown[], CstNode>
  cutterCompensationOff!: ParserMethod<unknown[], CstNode>
  cutterCompensationLeft!: ParserMethod<unknown[], CstNode>
  cutterCompensationRight!: ParserMethod<unknown[], CstNode>
  absoluteMode!: ParserMethod<unknown[], CstNode>
  incrementalMode!: ParserMethod<unknown[], CstNode>
  zeroSet!: ParserMethod<unknown[], CstNode>
  headerEnd!: ParserMethod<unknown[], CstNode>

  constructor() {
    super(multiModeLexerDefinition)

    this.RULE("program", () => {
      // this.MANY_SEP({
      //   SEP: Tokens.NewLine,
      //   DEF: () => {
      //     this.SUBRULE(this.command)
      //     this.OPTION(() => {
      //       this.CONSUME(Tokens.Comment)
      //     })
      //   }
      // })
      this.MANY(() => {
        this.SUBRULE(this.command)
        // this.OPTION(() => {
        //   this.CONSUME(Tokens.Comment)
        // })
      })
    })

    this.RULE("command", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.units) },
        { ALT: (): CstNode => this.SUBRULE(this.toolDefinition) },
        { ALT: (): CstNode => this.SUBRULE(this.toolChange) },
        { ALT: (): CstNode => this.SUBRULE(this.comment) },
        { ALT: (): CstNode => this.SUBRULE(this.move) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfProgramNoRewind) },
        { ALT: (): CstNode => this.SUBRULE(this.beginPattern) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfPattern) },
        { ALT: (): CstNode => this.SUBRULE(this.repeatPatternOffset) },
        { ALT: (): CstNode => this.SUBRULE(this.optionalStop) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfStepAndRepeat) },
        { ALT: (): CstNode => this.SUBRULE(this.stopForInspect) },
        { ALT: (): CstNode => this.SUBRULE(this.zAxisRoutPositionWithDepthControlledCountoring) },
        { ALT: (): CstNode => this.SUBRULE(this.zAxisRoutPosition) },
        { ALT: (): CstNode => this.SUBRULE(this.retractWithClamping) },
        { ALT: (): CstNode => this.SUBRULE(this.retract) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfProgramRewind) },
        { ALT: (): CstNode => this.SUBRULE(this.longOperatorMessage) },
        { ALT: (): CstNode => this.SUBRULE(this.operatorMessage) },
        { ALT: (): CstNode => this.SUBRULE(this.header) },
        { ALT: (): CstNode => this.SUBRULE(this.metricMode) },
        { ALT: (): CstNode => this.SUBRULE(this.inchMode) },
        { ALT: (): CstNode => this.SUBRULE(this.routMode) },
        { ALT: (): CstNode => this.SUBRULE(this.linearMove) },
        { ALT: (): CstNode => this.SUBRULE(this.circularClockwiseMove) },
        { ALT: (): CstNode => this.SUBRULE(this.circularCounterclockwiseMove) },
        { ALT: (): CstNode => this.SUBRULE(this.dwell) },
        { ALT: (): CstNode => this.SUBRULE(this.drillMode) },
        { ALT: (): CstNode => this.SUBRULE(this.cwCircle) },
        { ALT: (): CstNode => this.SUBRULE(this.ccwCircle) },
        { ALT: (): CstNode => this.SUBRULE(this.cutterCompensationOff) },
        { ALT: (): CstNode => this.SUBRULE(this.cutterCompensationLeft) },
        { ALT: (): CstNode => this.SUBRULE(this.cutterCompensationRight) },
        { ALT: (): CstNode => this.SUBRULE(this.absoluteMode) },
        { ALT: (): CstNode => this.SUBRULE(this.incrementalMode) },
        { ALT: (): CstNode => this.SUBRULE(this.zeroSet) },
        { ALT: (): CstNode => this.SUBRULE(this.headerEnd) },

      ])
    })

    this.RULE("units", () => {
      this.CONSUME(DefaultTokens.Units)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Comma)
        this.OR([
          { ALT: (): IToken => this.CONSUME(DefaultTokens.TrailingZeros) },
          { ALT: (): IToken => this.CONSUME(DefaultTokens.LeadingZeros) },
        ])
      })
    })

    this.RULE("headerEnd", () => {
      this.CONSUME(DefaultTokens.Percent)
    })

    this.RULE("comment", () => {
      this.OR([
        { ALT: (): IToken => this.CONSUME(DefaultTokens.LParen) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.Semicolon) },
      ])
      this.OPTION(() => {
        this.CONSUME(CommentTokens.Attribute)
      })
      this.OPTION2(() => {
        this.CONSUME(CommentTokens.Text)
      })
      this.OR2([
        { ALT: (): IToken => this.CONSUME(CommentTokens.NewLine) },
        { ALT: (): IToken => this.CONSUME(CommentTokens.RParen) },
      ])
    })

    this.RULE("toolChange", () => {
      this.CONSUME(DefaultTokens.T)
    })

    this.RULE("toolDefinition", () => {
      this.CONSUME(DefaultTokens.T)
      this.SUBRULE(this.toolDia)
      this.MANY(() => {
        this.OR([
          { ALT: (): CstNode => this.SUBRULE(this.feed) },
          { ALT: (): CstNode => this.SUBRULE(this.speed) },
          { ALT: (): CstNode => this.SUBRULE(this.retractRate) },
          { ALT: (): CstNode => this.SUBRULE(this.hitCount) },
          { ALT: (): CstNode => this.SUBRULE(this.depthOffset) },
        ])
      })
    })

    this.RULE("toolDia", () => {
      this.CONSUME(DefaultTokens.C)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("feed", () => {
      this.CONSUME(DefaultTokens.F)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Number)
      })
    })

    this.RULE("speed", () => {
      this.CONSUME(DefaultTokens.S)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Number)
      })
    })

    this.RULE("retractRate", () => {
      this.CONSUME(DefaultTokens.B)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("hitCount", () => {
      this.CONSUME(DefaultTokens.H)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("depthOffset", () => {
      this.CONSUME(DefaultTokens.Z)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("x", () => {
      this.CONSUME(DefaultTokens.X)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("y", () => {
      this.CONSUME(DefaultTokens.Y)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("coordinate", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.xy) },
        { ALT: (): CstNode => this.SUBRULE(this.xory) },
      ])
    })

    this.RULE("xy", () => {
      this.SUBRULE(this.x)
      this.SUBRULE(this.y)
    })

    this.RULE("xory", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.x) },
        { ALT: (): CstNode => this.SUBRULE(this.y) },
      ])
    })

    this.RULE("arcRadius", () => {
      this.CONSUME(DefaultTokens.A)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("arcCenter", () => {
      this.CONSUME(DefaultTokens.I)
      this.CONSUME(DefaultTokens.Number)
      this.CONSUME(DefaultTokens.J)
      this.CONSUME2(DefaultTokens.Number)
    })

    this.RULE("move", () => {
      this.SUBRULE(this.coordinate)
      this.OPTION(() => {
        this.OR([
          { ALT: (): CstNode => this.SUBRULE(this.arcRadius) },
          { ALT: (): CstNode => this.SUBRULE(this.arcCenter) },
        ])
      })
    })

    this.RULE("endOfProgramNoRewind", () => {
      this.CONSUME(DefaultTokens.M00)
      this.OPTION(() => {
        this.SUBRULE(this.xy)
      })
    })

    this.RULE("beginPattern", () => {
      this.CONSUME(DefaultTokens.M25)
    })

    this.RULE("endOfPattern", () => {
      this.CONSUME(DefaultTokens.M01)
    })

    this.RULE("repeatPatternOffset", () => {
      this.CONSUME(DefaultTokens.M02)
      this.SUBRULE(this.xy)
    })

    this.RULE("optionalStop", () => {
      this.CONSUME(DefaultTokens.M06)
      this.OPTION(() => {
        this.SUBRULE(this.xy)
      })
    })

    this.RULE("endOfStepAndRepeat", () => {
      this.CONSUME(DefaultTokens.M08)
    })

    this.RULE("stopForInspect", () => {
      this.CONSUME(DefaultTokens.M09)
      this.OPTION(() => {
        this.SUBRULE(this.xy)
      })
    })

    this.RULE("zAxisRoutPositionWithDepthControlledCountoring", () => {
      this.CONSUME(DefaultTokens.M14)
    })

    this.RULE("zAxisRoutPosition", () => {
      this.CONSUME(DefaultTokens.M15)
    })

    this.RULE("retractWithClamping", () => {
      this.CONSUME(DefaultTokens.M16)
    })

    this.RULE("retract", () => {
      this.CONSUME(DefaultTokens.M17)
    })

    this.RULE("endOfProgramRewind", () => {
      this.CONSUME(DefaultTokens.M30)
      this.OPTION(() => {
        this.SUBRULE(this.xy)
      })
    })

    this.RULE("longOperatorMessage", () => {
      this.CONSUME(DefaultTokens.M45)
      this.OPTION(() => {
        this.CONSUME(TextTokens.Text)
      })
      this.OPTION2(() => {
        this.CONSUME(TextTokens.EndText)
      })
    })

    this.RULE("operatorMessage", () => {
      this.CONSUME(DefaultTokens.M47)
      this.OPTION(() => {
        this.CONSUME(TextTokens.Text)
      })
      this.OPTION2(() => {
        this.CONSUME(TextTokens.EndText)
      })
    })

    this.RULE("header", () => {
      this.CONSUME(DefaultTokens.M48)
    })

    this.RULE("metricMode", () => {
      this.CONSUME(DefaultTokens.M71)
    })

    this.RULE("inchMode", () => {
      this.CONSUME(DefaultTokens.M72)
    })

    this.RULE("routMode", () => {
      this.CONSUME(DefaultTokens.G00)
      this.SUBRULE(this.move)
    })

    this.RULE("linearMove", () => {
      this.CONSUME(DefaultTokens.G01)
      this.SUBRULE(this.move)
    })

    this.RULE("circularClockwiseMove", () => {
      this.CONSUME(DefaultTokens.G02)
      this.SUBRULE(this.move)
    })

    this.RULE("circularCounterclockwiseMove", () => {
      this.CONSUME(DefaultTokens.G03)
      this.SUBRULE(this.move)
    })

    this.RULE("dwell", () => {
      this.CONSUME(DefaultTokens.G04)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("drillMode", () => {
      this.CONSUME(DefaultTokens.G05)
    })

    this.RULE("cwCircle", () => {
      this.CONSUME(DefaultTokens.G32)
      this.SUBRULE(this.move)
    })

    this.RULE("ccwCircle", () => {
      this.CONSUME(DefaultTokens.G33)
      this.SUBRULE(this.move)
    })

    this.RULE("cutterCompensationOff", () => {
      this.CONSUME(DefaultTokens.G40)
    })

    this.RULE("cutterCompensationLeft", () => {
      this.CONSUME(DefaultTokens.G41)
    })

    this.RULE("cutterCompensationRight", () => {
      this.CONSUME(DefaultTokens.G42)
    })

    this.RULE("absoluteMode", () => {
      this.CONSUME(DefaultTokens.G90)
    })

    this.RULE("incrementalMode", () => {
      this.CONSUME(DefaultTokens.G91)
    })

    this.RULE("zeroSet", () => {
      this.CONSUME(DefaultTokens.G93)
      this.SUBRULE(this.xy)
    })



    this.performSelfAnalysis()
  }
}

export const parser = new NCParser()
export const productions: Record<string, Rule> = parser.getGAstProductions();
const dtsString = generateCstDts(productions);
console.log(dtsString)

const BaseCstVisitor = parser.getBaseCstVisitorConstructor();
// const BaseCstVisitor = parser.getBaseCstVisitorConstructorWithDefaults();


// export const CW = 'cw'
// export const CCW = 'ccw'

// filetype constants
export const DRILL = 'drill'
export const ROUT = 'rout'

// Units constants
export const MM = 'mm'
export const IN = 'inch'

// Format constants
export const LEADING = 'leading'
export const TRAILING = 'trailing'
export const ABSOLUTE = 'absolute'
export const INCREMENTAL = 'incremental'

// Tool constants
export const CIRCLE = 'circle'

// Drawing constants
export const SHAPE = 'shape'
export const MOVE = 'move'
export const SEGMENT = 'segment'
export const SLOT = 'slot'

// Interpolation / routing constants
export const LINE = 'line'
export const CW_ARC = 'cwArc'
export const CCW_ARC = 'ccwArc'

export type ArcDirection = typeof CW_ARC | typeof CCW_ARC

export type InterpolateModeType =
  | typeof LINE
  | typeof CW_ARC
  | typeof CCW_ARC

export type Mode = typeof DRILL | typeof ROUT

interface NCState {
  units: Units
  plunged: boolean
  mode: Mode
  interpolationMode: InterpolateModeType
  arcRadius?: number
  arcCenterOffset?: { x: number, y: number }
  currentTool: Symbols.StandardSymbol
  x: number
  y: number
  previousX: number
  previousY: number
  coordinateFormat: Format
  zeroSuppression: ZeroSuppression
}

const defaultTool: Symbols.StandardSymbol = new Symbols.NullSymbol({
  id: 'T00',
})

export class NCToShapesVisitor extends BaseCstVisitor {
  public result: Shapes.Shape[]
  public state: NCState = {
    plunged: false,
    mode: DRILL,
    interpolationMode: LINE,
    units: 'inch',
    currentTool: defaultTool,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    arcRadius: 0,
    // arcDirection: CW,
    coordinateFormat: [2, 4],
    zeroSuppression: 'trailing',
  }
  public toolStore: Partial<Record<string, Symbols.StandardSymbol>> = {}
  constructor() {
    super();
    // This helper will detect any missing or redundant methods on this visitor
    this.validateVisitor();
    this.result = [];
  }

  program(ctx: Cst.ProgramCstChildren): void {
    console.log('proogram', ctx)
    ctx.command ? ctx.command.map(this.visit, this) : []
  }

  command(ctx: Cst.CommandCstChildren): void {
    console.log('command', ctx)
    Object.values(ctx).map(this.visit, this)
  }

  units(ctx: Cst.UnitsCstChildren): void {
    console.log('units', ctx)
    if (ctx.Units[0].image === 'METRIC') {
      this.state.units = MM
    } else {
      this.state.units = IN
    }
    if (ctx.TrailingZeros) {
      this.state.zeroSuppression = LEADING
    }
    if (ctx.LeadingZeros) {
      this.state.zeroSuppression = TRAILING
    }
  }

  headerEnd(ctx: Cst.HeaderCstChildren): void {
    console.log('headerEnd', ctx)
  }

  comment(ctx: Cst.CommentCstChildren): void {
    console.log('comment', ctx)
  }

  toolChange(ctx: Cst.ToolChangeCstChildren): void {
    console.log('toolChange', ctx)
    this.state.currentTool = this.toolStore[ctx.T[0].image] ?? defaultTool
    console.log('currentTool', this.state.currentTool)
  }

  toolDefinition(ctx: Cst.ToolDefinitionCstChildren): void {
    console.log('toolDefinition', ctx)
    const dia = this.visit(ctx.toolDia) as number
    const tool = new Symbols.RoundSymbol({
      id: ctx.T[0].image,
      outer_dia: dia,
      inner_dia: 0
    })
    this.state.currentTool = tool
    this.toolStore[tool.id] = tool
    console.log('tool', tool)
  }

  toolDia(ctx: Cst.ToolDiaCstChildren): number {
    console.log('toolDia', ctx)
    const dia = parseFloat(ctx.Number[0].image)
    return dia
  }

  feed(ctx: Cst.FeedCstChildren): void {
    console.log('feed', ctx)
  }

  speed(ctx: Cst.SpeedCstChildren): void {
    console.log('speed', ctx)
  }

  retractRate(ctx: Cst.RetractRateCstChildren): void {
    console.log('retractRate', ctx)
  }

  hitCount(ctx: Cst.HitCountCstChildren): void {
    console.log('hitCount', ctx)
  }

  depthOffset(ctx: Cst.DepthOffsetCstChildren): void {
    console.log('depthOffset', ctx)
  }

  x(ctx: Cst.XCstChildren): void {
    console.log('x', ctx)
    this.state.previousX = this.state.x
    this.state.x = this.parseCoordinate(ctx.Number[0].image)
  }

  y(ctx: Cst.YCstChildren): void {
    console.log('y', ctx)
    this.state.previousY = this.state.y
    this.state.y = this.parseCoordinate(ctx.Number[0].image)
  }

  xy(ctx: Cst.XyCstChildren): void {
    console.log('xy', ctx)
    this.visit(ctx.x)
    this.visit(ctx.y)
  }

  xory(ctx: Cst.XoryCstChildren): void {
    console.log('xory', ctx)
    if (ctx.x) this.visit(ctx.x)
    if (ctx.y) this.visit(ctx.y)
  }

  coordinate(ctx: Cst.CoordinateCstChildren): void {
    console.log('coordinate', ctx)
    if (ctx.xy) this.visit(ctx.xy)
    if (ctx.xory) this.visit(ctx.xory)
  }

  arcRadius(ctx: Cst.ArcRadiusCstChildren): void {
    console.log('arcRadius', ctx)
    this.state.arcRadius = this.parseCoordinate(ctx.Number[0].image)
    this.state.arcCenterOffset = undefined
  }

  arcCenter(ctx: Cst.ArcCenterCstChildren): void {
    console.log('arcCenter', ctx)
    const x = this.parseCoordinate(ctx.Number[0].image)
    const y = this.parseCoordinate(ctx.Number[1].image)
    this.state.arcCenterOffset = { x, y }
    this.state.arcRadius = undefined
  }

  move(ctx: Cst.MoveCstChildren): void {
    console.log('move', ctx)
    this.visit(ctx.coordinate)
    ctx.arcCenter ? this.visit(ctx.arcCenter) : null
    ctx.arcRadius ? this.visit(ctx.arcRadius) : null
    if (this.state.mode == DRILL) {
      this.result.push(new Shapes.Pad({
        x: this.state.x,
        y: this.state.y,
        symbol: this.state.currentTool,
      }))
    } else {
      if (this.state.plunged) {
        if (this.state.interpolationMode === LINE) {
          this.result.push(new Shapes.Line({
            xs: this.state.previousX,
            ys: this.state.previousY,
            xe: this.state.x,
            ye: this.state.y,
            symbol: this.state.currentTool,
          }))
        } else {
          const startPoint = { x: this.state.previousX, y: this.state.previousY }
          const endPoint = { x: this.state.x, y: this.state.y }
          const radius = this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.x ** 2 + this.state.arcCenterOffset.y ** 2) ** 0.5 : 0)
          const center = getAmbiguousArcCenter(startPoint, endPoint, radius, this.state.interpolationMode == CW_ARC ? CW_ARC : CCW_ARC)
          this.result.push(new Shapes.Arc({
            xs: this.state.previousX,
            ys: this.state.previousY,
            xe: this.state.x,
            ye: this.state.y,
            xc: center.x,
            yc: center.y,
            clockwise: this.state.interpolationMode === CW_ARC ? 1 : 0,
            symbol: this.state.currentTool,
          }))
        }
      }
    }
    console.log('state', this.state)
  }

  endOfProgramNoRewind(ctx: Cst.EndOfProgramNoRewindCstChildren): void {
    console.log('endOfProgramNoRewind', ctx)
  }

  beginPattern(ctx: Cst.BeginPatternCstChildren): void {
    console.log('beginPattern', ctx)
  }

  endOfPattern(ctx: Cst.EndOfPatternCstChildren): void {
    console.log('endOfPattern', ctx)
  }

  repeatPatternOffset(ctx: Cst.RepeatPatternOffsetCstChildren): void {
    console.log('repeatPatternOffset', ctx)
  }

  optionalStop(ctx: Cst.OptionalStopCstChildren): void {
    console.log('optionalStop', ctx)
  }

  endOfStepAndRepeat(ctx: Cst.EndOfStepAndRepeatCstChildren): void {
    console.log('endOfStepAndRepeat', ctx)
  }

  stopForInspect(ctx: Cst.StopForInspectCstChildren): void {
    console.log('stopForInspect', ctx)
  }

  zAxisRoutPositionWithDepthControlledCountoring(ctx: Cst.ZAxisRoutPositionWithDepthControlledCountoringCstChildren): void {
    console.log('zAxisRoutPositionWithDepthControlledCountoring', ctx)
    this.state.plunged = true
  }

  zAxisRoutPosition(ctx: Cst.ZAxisRoutPositionCstChildren): void {
    console.log('zAxisRoutPosition', ctx)
    this.state.plunged = true
  }

  retractWithClamping(ctx: Cst.RetractWithClampingCstChildren): void {
    console.log('retractWithClamping', ctx)
    this.state.plunged = false
  }

  retract(ctx: Cst.RetractCstChildren): void {
    console.log('retract', ctx)
    this.state.plunged = false
  }

  endOfProgramRewind(ctx: Cst.EndOfProgramRewindCstChildren): void {
    console.log('endOfProgramRewind', ctx)
  }

  longOperatorMessage(ctx: Cst.LongOperatorMessageCstChildren): void {
    console.log('longOperatorMessage', ctx)
  }

  operatorMessage(ctx: Cst.OperatorMessageCstChildren): void {
    console.log('operatorMessage', ctx)
  }

  header(ctx: Cst.HeaderCstChildren): void {
    console.log('header', ctx)
  }

  metricMode(ctx: Cst.MetricModeCstChildren): void {
    console.log('metricMode', ctx)
    this.state.units = MM
  }

  inchMode(ctx: Cst.InchModeCstChildren): void {
    console.log('inchMode', ctx)
    this.state.units = IN
  }

  routMode(ctx: Cst.RoutModeCstChildren): void {
    console.log('routMode', ctx)
    this.state.mode = ROUT
    // this is questionable
    this.state.plunged = false
    this.visit(ctx.move)
  }

  linearMove(ctx: Cst.LinearMoveCstChildren): void {
    console.log('linearMove', ctx)
    this.state.interpolationMode = LINE
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  circularClockwiseMove(ctx: Cst.CircularClockwiseMoveCstChildren): void {
    console.log('circularClockwiseMove', ctx)
    this.state.interpolationMode = CW_ARC
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  circularCounterclockwiseMove(ctx: Cst.CircularCounterclockwiseMoveCstChildren): void {
    console.log('circularCounterclockwiseMove', ctx)
    this.state.interpolationMode = CCW_ARC
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  dwell(ctx: Cst.DwellCstChildren): void {
    console.log('dwell', ctx)
  }

  drillMode(ctx: Cst.DrillModeCstChildren): void {
    console.log('drillMode', ctx)
    this.state.plunged = false
  }

  cwCircle(ctx: Cst.CwCircleCstChildren): void {
    console.log('cwCircle', ctx)
    const prevMode = this.state.mode
    this.state.mode = ROUT
    this.state.plunged = false
    this.visit(ctx.move)
    const radius = this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.x ** 2 + this.state.arcCenterOffset.y ** 2) ** 0.5 : 0)
    this.result.push(new Shapes.Arc({
      xs: this.state.x - radius,
      ys: this.state.y - radius,
      xe: this.state.x - radius,
      ye: this.state.y - radius,
      xc: this.state.x,
      yc: this.state.y,
      clockwise: 1,
      symbol: this.state.currentTool,
    }))
    this.state.mode = prevMode
  }

  ccwCircle(ctx: Cst.CcwCircleCstChildren): void {
    console.log('ccwCircle', ctx)
    const prevMode = this.state.mode
    this.state.mode = ROUT
    this.state.plunged = false
    this.visit(ctx.move)
    const radius = this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.x ** 2 + this.state.arcCenterOffset.y ** 2) ** 0.5 : 0)
    this.result.push(new Shapes.Arc({
      xs: this.state.x - radius,
      ys: this.state.y - radius,
      xe: this.state.x - radius,
      ye: this.state.y - radius,
      xc: this.state.x,
      yc: this.state.y,
      clockwise: 0,
      symbol: this.state.currentTool,
    }))
    this.state.mode = prevMode
  }

  cutterCompensationOff(ctx: Cst.CutterCompensationOffCstChildren): void {
    console.log('cutterCompensationOff', ctx)
  }

  cutterCompensationLeft(ctx: Cst.CutterCompensationLeftCstChildren): void {
    console.log('cutterCompensationLeft', ctx)
  }

  cutterCompensationRight(ctx: Cst.CutterCompensationRightCstChildren): void {
    console.log('cutterCompensationRight', ctx)
  }

  absoluteMode(ctx: Cst.AbsoluteModeCstChildren): void {
    console.log('absoluteMode', ctx)
  }

  incrementalMode(ctx: Cst.IncrementalModeCstChildren): void {
    console.log('incrementalMode', ctx)
  }

  zeroSet(ctx: Cst.ZeroSetCstChildren): void {
    console.log('zeroSet', ctx)
  }

  parseCoordinate(
    coordinate: string,
  ): number {
    if (coordinate.includes('.') || coordinate === '0') {
      return Number(coordinate)
    }

    const { coordinateFormat, zeroSuppression } = this.state
    const [integerPlaces, decimalPlaces] = coordinateFormat
    const [sign, signlessCoordinate] =
      coordinate.startsWith('+') || coordinate.startsWith('-')
        ? [coordinate[0], coordinate.slice(1)]
        : ['+', coordinate]

    const digits = integerPlaces + decimalPlaces
    const paddedCoordinate =
      zeroSuppression === TRAILING
        ? signlessCoordinate.padEnd(digits, '0')
        : signlessCoordinate.padStart(digits, '0')

    const leading = paddedCoordinate.slice(0, paddedCoordinate.length - decimalPlaces)
    const trailing = paddedCoordinate.slice(paddedCoordinate.length - decimalPlaces)

    return Number(`${sign}${leading}.${trailing}`)
  }


}



export function getAmbiguousArcCenter(startPoint: Point, endPoint: Point, radius: number, arcDirection: ArcDirection): Point {
  // Get the center candidates and select the candidate with the smallest arc
  const [_start, _end, center] = findCenterCandidates(startPoint, endPoint, radius)
    .map(centerPoint => {
      return getArcPositions(startPoint, endPoint, centerPoint, arcDirection)
    })
    .sort(([startA, endA], [startB, endB]) => {
      const absSweepA = Math.abs(endA[2] - startA[2])
      const absSweepB = Math.abs(endB[2] - startB[2])
      return absSweepA - absSweepB
    })[0]

  return {
    x: center[0],
    y: center[1],
  }
}


export type ArcPosition = [x: number, y: number, theta: number]
export type Position = [x: number, y: number]

export function getArcPositions(
  startPoint: Point,
  endPoint: Point,
  centerPoint: Point,
  arcDirection: ArcDirection
): [start: ArcPosition, end: ArcPosition, center: Position] {
  let startAngle = Math.atan2(
    startPoint.y - centerPoint.y,
    startPoint.x - centerPoint.x
  )
  let endAngle = Math.atan2(
    endPoint.y - centerPoint.y,
    endPoint.x - centerPoint.x
  )

  // If counter-clockwise, end angle should be greater than start angle
  if (arcDirection === CCW_ARC) {
    endAngle = endAngle > startAngle ? endAngle : endAngle + (Math.PI * 2)
  } else {
    startAngle = startAngle > endAngle ? startAngle : startAngle + (Math.PI * 2)
  }

  return [
    [startPoint.x, startPoint.y, startAngle],
    [endPoint.x, endPoint.y, endAngle],
    [centerPoint.x, centerPoint.y],
  ]
}

export interface Point {
  x: number
  y: number
}

// Find arc center candidates by finding the intersection points
// of two circles with `radius` centered on the start and end points
// https://math.stackexchange.com/a/1367732
function findCenterCandidates(startPoint: Point, endPoint: Point, radius: number): Point[] {
  // This function assumes that start and end are different points
  const { x: x1, y: y1 } = startPoint
  const { x: x2, y: y2 } = endPoint

  // Distance between the start and end points
  const [dx, dy] = [x2 - x1, y2 - y1]
  const [sx, sy] = [x2 + x1, y2 + y1]
  const distance = Math.sqrt(dx ** 2 + dy ** 2)

  // If the distance to the midpoint equals the arc radius, then there is
  // exactly one intersection at the midpoint; if the distance to the midpoint
  // is greater than the radius, assume we've got a rounding error and just use
  // the midpoint
  if (radius <= distance / 2) {
    return [{ x: x1 + dx / 2, y: y1 + dy / 2 }]
  }

  // No good name for these variables, but it's how the math works out
  const factor = Math.sqrt((4 * radius ** 2) / distance ** 2 - 1)
  const [xBase, yBase] = [sx / 2, sy / 2]
  const [xAddend, yAddend] = [(dy * factor) / 2, (dx * factor) / 2]

  return [
    { x: xBase + xAddend, y: yBase - yAddend },
    { x: xBase - xAddend, y: yBase + yAddend },
  ]
}



// export const visitor = new NCToAstVisitor()
