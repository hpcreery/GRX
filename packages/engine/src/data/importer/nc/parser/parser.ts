import * as Shapes from "@src/data/shape/shape"
import * as Symbols from "@src/data/shape/symbol/symbol"
import { type AttributesType, type Binary, FeatureTypeIdentifier, type Units } from "@src/types"
import { baseUnitsConversionFactor } from "@src/utils"
import { type CstNode, CstParser, createToken, generateCstDts, type IToken, Lexer, type ParserMethod, type Rule } from "chevrotain"
import * as Constants from "./constants"
import type * as Cst from "./nccst"
import type {
  ArcDirection,
  ArcPosition,
  CoordinateMode,
  CutterCompensation,
  Format,
  InterpolateModeType,
  Mode,
  Point,
  Position,
  PossiblePoints,
  ZeroSuppression,
} from "./types"

const DefaultTokens = {
  WhiteSpace: createToken({ name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true }),
  Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?(?:\d+)?|\.\d+)/ }),
  Units: createToken({ name: "Units", pattern: /METRIC|INCH/ }),
  TrailingZeros: createToken({ name: "TrailingZeros", pattern: /TZ/ }),
  LeadingZeros: createToken({ name: "LeadingZeros", pattern: /LZ/ }),
  IncrementalMode: createToken({ name: "IncrementalMode", pattern: /ICI/ }),
  On: createToken({ name: "On", pattern: /ON/ }),
  Off: createToken({ name: "Off", pattern: /OFF/ }),
  CP: createToken({ name: "CP", pattern: /CP/ }),
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
  // Repeats
  R: createToken({ name: "R", pattern: /R/ }),
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
  M70: createToken({ name: "M70", pattern: /M70/ }),
  M71: createToken({ name: "M71", pattern: /M71/ }),
  M72: createToken({ name: "M72", pattern: /M72/ }),
  M80: createToken({ name: "M80", pattern: /M80/ }),
  M90: createToken({ name: "M90", pattern: /M90/ }),
  // G Codes
  G00: createToken({ name: "G00", pattern: /G00/ }),
  G01: createToken({ name: "G01", pattern: /G01/ }),
  G02: createToken({ name: "G02", pattern: /G02/ }),
  G03: createToken({ name: "G03", pattern: /G03/ }),
  G04: createToken({ name: "G04", pattern: /G04/ }),
  G05: createToken({ name: "G05", pattern: /G05/ }),
  G32: createToken({ name: "G32", pattern: /G32/ }),
  G33: createToken({ name: "G33", pattern: /G33/ }),
  G34: createToken({ name: "G34", pattern: /G34/ }),
  G35: createToken({ name: "G35", pattern: /G35/ }),
  G36: createToken({ name: "G36", pattern: /G36/ }),
  G37: createToken({ name: "G37", pattern: /G37/ }),
  G38: createToken({ name: "G38", pattern: /G38/ }),
  G39: createToken({ name: "G39", pattern: /G39/ }),
  G40: createToken({ name: "G40", pattern: /G40/ }),
  G41: createToken({ name: "G41", pattern: /G41/ }),
  G42: createToken({ name: "G42", pattern: /G42/ }),
  // Canned Cycle Commands
  // G82: createToken({ name: "G82", pattern: /G82/ }),
  // G83: createToken({ name: "G83", pattern: /G83/ }),
  G84: createToken({ name: "G84", pattern: /G84/ }),
  G85: createToken({ name: "G85", pattern: /G85/ }),
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
  // Unknown: createToken({ name: "Unknown", pattern: /./ }),
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
}

export const NCLexer = new Lexer(multiModeLexerDefinition)

class NCParser extends CstParser {
  program!: ParserMethod<unknown[], CstNode>
  command!: ParserMethod<unknown[], CstNode>
  units!: ParserMethod<unknown[], CstNode>
  incrementalModeSwitch!: ParserMethod<unknown[], CstNode>
  compensationIndex!: ParserMethod<unknown[], CstNode>
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
  selectVisionTool!: ParserMethod<unknown[], CstNode>
  singlePointVisionOffset!: ParserMethod<unknown[], CstNode>
  multiPointVisionOffset!: ParserMethod<unknown[], CstNode>
  cancelVisionOffset!: ParserMethod<unknown[], CstNode>
  visionCorrectedSingleHole!: ParserMethod<unknown[], CstNode>
  visionAutoCalibration!: ParserMethod<unknown[], CstNode>
  cannedSlot!: ParserMethod<unknown[], CstNode>
  cannedCircle!: ParserMethod<unknown[], CstNode>
  repeatHole!: ParserMethod<unknown[], CstNode>

  constructor() {
    super(multiModeLexerDefinition, {
      recoveryEnabled: true,
      // maxLookahead: 2,
    })

    this.RULE("program", () => {
      this.MANY(() => {
        this.SUBRULE(this.command)
      })
    })

    this.RULE("command", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.units) },
        { ALT: (): CstNode => this.SUBRULE(this.incrementalModeSwitch) },
        { ALT: (): CstNode => this.SUBRULE(this.compensationIndex) },
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
        { ALT: (): CstNode => this.SUBRULE(this.selectVisionTool) },
        { ALT: (): CstNode => this.SUBRULE(this.singlePointVisionOffset) },
        { ALT: (): CstNode => this.SUBRULE(this.multiPointVisionOffset) },
        { ALT: (): CstNode => this.SUBRULE(this.cancelVisionOffset) },
        { ALT: (): CstNode => this.SUBRULE(this.visionCorrectedSingleHole) },
        { ALT: (): CstNode => this.SUBRULE(this.visionAutoCalibration) },
        { ALT: (): CstNode => this.SUBRULE(this.cannedSlot) },
        { ALT: (): CstNode => this.SUBRULE(this.cannedCircle) },
        { ALT: (): CstNode => this.SUBRULE(this.repeatHole) },
      ])
    })

    this.RULE("units", () => {
      this.CONSUME(DefaultTokens.Units)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Comma)
        this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.TrailingZeros) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.LeadingZeros) }])
      })
      this.OPTION2(() => {
        this.CONSUME2(DefaultTokens.Comma)
        this.CONSUME(DefaultTokens.Number)
      })
    })

    this.RULE("incrementalModeSwitch", () => {
      this.CONSUME(DefaultTokens.IncrementalMode)
      this.CONSUME(DefaultTokens.Comma)
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.On) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.Off) }])
    })

    this.RULE("headerEnd", () => {
      this.CONSUME(DefaultTokens.Percent)
    })

    this.RULE("comment", () => {
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.LParen) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.Semicolon) }])
      this.OPTION(() => {
        this.CONSUME(CommentTokens.Attribute)
      })
      this.OPTION2(() => {
        this.CONSUME(CommentTokens.Text)
      })
      this.OPTION3(() => {
        this.OR2([{ ALT: (): IToken => this.CONSUME(CommentTokens.NewLine) }, { ALT: (): IToken => this.CONSUME(CommentTokens.RParen) }])
      })
    })

    this.RULE("compensationIndex", () => {
      this.CONSUME(DefaultTokens.CP)
      this.CONSUME(DefaultTokens.Comma)
      this.CONSUME(DefaultTokens.Number)
      this.CONSUME2(DefaultTokens.Comma)
      this.CONSUME2(DefaultTokens.Number)
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
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Number)
      })
    })

    this.RULE("y", () => {
      this.CONSUME(DefaultTokens.Y)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Number)
      })
    })

    this.RULE("coordinate", () => {
      this.OR([
        { GATE: (): boolean => this.LA(1).endLine === this.LA(3).endLine, ALT: (): CstNode => this.SUBRULE(this.xy) },
        { ALT: (): CstNode => this.SUBRULE(this.xory) },
      ])
    })

    this.RULE("xy", () => {
      this.SUBRULE(this.x)
      this.SUBRULE(this.y)
    })

    this.RULE("xory", () => {
      this.OR([{ ALT: (): CstNode => this.SUBRULE(this.x) }, { ALT: (): CstNode => this.SUBRULE(this.y) }])
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
        this.OR([{ ALT: (): CstNode => this.SUBRULE(this.arcRadius) }, { ALT: (): CstNode => this.SUBRULE(this.arcCenter) }])
      })
    })

    this.RULE("endOfProgramNoRewind", () => {
      this.CONSUME(DefaultTokens.M00)
      this.OPTION(() => {
        this.SUBRULE(this.coordinate)
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
      this.OPTION(() => {
        this.SUBRULE(this.coordinate)
      })
      this.MANY(() => {
        this.OR([
          { ALT: (): IToken => this.CONSUME(DefaultTokens.M70) },
          { ALT: (): IToken => this.CONSUME(DefaultTokens.M80) },
          { ALT: (): IToken => this.CONSUME(DefaultTokens.M90) },
        ])
      })
    })

    this.RULE("optionalStop", () => {
      this.CONSUME(DefaultTokens.M06)
      this.OPTION(() => {
        this.SUBRULE(this.coordinate)
      })
    })

    this.RULE("endOfStepAndRepeat", () => {
      this.CONSUME(DefaultTokens.M08)
    })

    this.RULE("stopForInspect", () => {
      this.CONSUME(DefaultTokens.M09)
      this.OPTION(() => {
        this.SUBRULE(this.coordinate)
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
        this.SUBRULE(this.coordinate)
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

    this.RULE("selectVisionTool", () => {
      this.CONSUME(DefaultTokens.G34)
      // this.CONSUME(DefaultTokens.Comma)
      // this.CONSUME(DefaultTokens.Number)
      // this.OPTION(() => {
      //   this.CONSUME2(DefaultTokens.Comma)
      //   this.CONSUME2(DefaultTokens.Number)
      // })
      this.OPTION(() => {
        this.CONSUME(TextTokens.Text)
      })
      this.OPTION2(() => {
        this.CONSUME(TextTokens.EndText)
      })
    })

    this.RULE("singlePointVisionOffset", () => {
      this.CONSUME(DefaultTokens.G35)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("multiPointVisionOffset", () => {
      this.CONSUME(DefaultTokens.G36)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("cancelVisionOffset", () => {
      this.CONSUME(DefaultTokens.G37)
    })

    this.RULE("visionCorrectedSingleHole", () => {
      this.CONSUME(DefaultTokens.G38)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("visionAutoCalibration", () => {
      this.CONSUME(DefaultTokens.G39)
      // this.SUBRULE(this.coordinate)
      this.OPTION(() => {
        this.CONSUME(TextTokens.Text)
      })
      this.OPTION2(() => {
        this.CONSUME(TextTokens.EndText)
      })
    })

    // Canned Cycle Commands
    this.RULE("cannedSlot", () => {
      this.CONSUME(DefaultTokens.G85)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("cannedCircle", () => {
      this.CONSUME(DefaultTokens.G84)
      this.SUBRULE(this.x)
    })

    this.RULE("repeatHole", () => {
      this.CONSUME(DefaultTokens.NewLine) // newline character is necessary, with fault tolerance the R can be read at the wrong time
      this.CONSUME(DefaultTokens.R)
      this.CONSUME(DefaultTokens.Number)
      this.SUBRULE(this.coordinate)
    })

    this.performSelfAnalysis()
  }
}

export const parser = new NCParser()
export const productions: Record<string, Rule> = parser.getGAstProductions()

const GENERATEDTS = false
if (GENERATEDTS) {
  const dtsString = generateCstDts(productions)
  console.log(dtsString)
}

const BaseCstVisitor = parser.getBaseCstVisitorConstructor()
// const BaseCstVisitor = parser.getBaseCstVisitorConstructorWithDefaults();

interface NCState extends NCParams {
  chainIndex: number
  pathIndex: number
  plunged: boolean
  mode: Mode
  interpolationMode: InterpolateModeType
  currentTool: Symbols.StandardSymbol
  cutterCompensation: number
  cutterCompensationMode: CutterCompensation
  x: number
  y: number
  previousX: number
  previousY: number
  patternOffsetX: number
  patternOffsetY: number
  arcRadius?: number
  arcCenterOffset?: { i: number; j: number }
}

export interface NCParams {
  units: Units
  coordinateMode: CoordinateMode
  coordinateFormat: Format
  zeroSuppression: ZeroSuppression
}

const defaultTool: Symbols.StandardSymbol = new Symbols.NullSymbol({
  id: "T00",
})

export class NCToShapesVisitor extends BaseCstVisitor {
  public result: Shapes.Shape[] = []
  public stepRepeatShapes: Shapes.Shape[][] = []
  public stepRepeats: Shapes.StepAndRepeat[] = []
  public state: NCState = {
    chainIndex: 0,
    pathIndex: 0,
    plunged: false,
    mode: Constants.DRILL,
    interpolationMode: Constants.LINE,
    units: "inch",
    currentTool: defaultTool,
    cutterCompensation: 0,
    cutterCompensationMode: Constants.OFF,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    patternOffsetX: 0,
    patternOffsetY: 0,
    arcRadius: 0,
    coordinateMode: Constants.ABSOLUTE,
    coordinateFormat: [2, 4],
    zeroSuppression: "trailing",
  }
  public toolStore: Partial<Record<string, Symbols.StandardSymbol>> = {}
  public compensationStore: Partial<Record<string, number>> = {}
  constructor(params: Partial<NCParams> = {}) {
    super()
    Object.assign(this.state, params)
    // This helper will detect any missing or redundant methods on this visitor
    this.validateVisitor()
  }

  program(ctx: Cst.ProgramCstChildren): void {
    ctx.command ? ctx.command.map(this.visit, this) : []
  }

  command(ctx: Cst.CommandCstChildren): void {
    Object.values(ctx).map(this.visit, this)
  }

  units(ctx: Cst.UnitsCstChildren): void {
    if (ctx.Units[0].image === "METRIC") {
      this.state.units = Constants.MM
    } else {
      this.state.units = Constants.IN
    }
    if (ctx.TrailingZeros) {
      this.state.zeroSuppression = Constants.LEADING
    }
    if (ctx.LeadingZeros) {
      this.state.zeroSuppression = Constants.TRAILING
    }
    if (ctx.Number) {
      const [int, decimal] = ctx.Number[0].image.split(".")
      this.state.coordinateFormat = [int.length, decimal.length]
    }
  }

  incrementalModeSwitch(ctx: Cst.IncrementalModeSwitchCstChildren): void {
    this.state.coordinateMode = ctx.On ? Constants.INCREMENTAL : Constants.ABSOLUTE
  }

  headerEnd(_ctx: Cst.HeaderCstChildren): void {
    // console.log("headerEnd", ctx)
  }

  comment(_ctx: Cst.CommentCstChildren): void {
    // console.log("comment", ctx)
  }

  compensationIndex(ctx: Cst.CompensationIndexCstChildren): void {
    this.compensationStore[String(Number(ctx.Number[0].image))] = parseFloat(ctx.Number[1].image)
  }

  toolChange(ctx: Cst.ToolChangeCstChildren): void {
    const str = ctx.T[0].image
    const tool = str.slice(0, 3)
    const compensationIndex = str.slice(3)
    this.state.currentTool = this.toolStore[String(Number(tool.slice(1, 3)))] ?? defaultTool
    if (compensationIndex !== "") {
      this.state.cutterCompensation = this.compensationStore[String(Number(compensationIndex.slice(1, 3)))] ?? 0
    } else {
      this.state.cutterCompensation = this.state.currentTool.outer_dia
    }
  }

  toolDefinition(ctx: Cst.ToolDefinitionCstChildren): void {
    const dia = this.visit(ctx.toolDia) as number

    const attributes: AttributesType = {}

    if (ctx.feed) attributes.feed = this.visit(ctx.feed) as string
    if (ctx.speed) attributes.speed = this.visit(ctx.speed) as string
    if (ctx.retractRate) attributes.retractRate = this.visit(ctx.retractRate) as string
    if (ctx.hitCount) attributes.hitCount = this.visit(ctx.hitCount) as string
    if (ctx.depthOffset) attributes.depthOffset = this.visit(ctx.depthOffset) as string

    const tool = new Symbols.RoundSymbol({
      units: this.state.units,
      id: ctx.T[0].image,
      outer_dia: dia,
      inner_dia: 0,
      // attributes,
    })
    this.state.currentTool = tool
    this.toolStore[String(Number(ctx.T[0].image.slice(1, 3)))] = tool
  }

  toolDia(ctx: Cst.ToolDiaCstChildren): number {
    const dia = Math.abs(parseFloat(ctx.Number[0].image))
    return dia
  }

  feed(ctx: Cst.FeedCstChildren): string {
    if (ctx.Number) return ctx.Number[0].image
    return ""
  }

  speed(ctx: Cst.SpeedCstChildren): string {
    if (ctx.Number) return ctx.Number[0].image
    return ""
  }

  retractRate(ctx: Cst.RetractRateCstChildren): string {
    if (ctx.Number) ctx.Number[0].image
    return ""
  }

  hitCount(ctx: Cst.HitCountCstChildren): string {
    if (ctx.Number) return ctx.Number[0].image
    return ""
  }

  depthOffset(ctx: Cst.DepthOffsetCstChildren): string {
    if (ctx.Number) return ctx.Number[0].image
    return ""
  }

  x(ctx: Cst.XCstChildren): number | undefined {
    if (!ctx.Number) return
    const newx = this.parseCoordinate(ctx.Number[0].image)
    return newx
  }

  y(ctx: Cst.YCstChildren): number | undefined {
    if (!ctx.Number) return
    const newy = this.parseCoordinate(ctx.Number[0].image)
    return newy
  }

  xy(ctx: Cst.XyCstChildren): PossiblePoints {
    return {
      x: this.visit(ctx.x) as number | undefined,
      y: this.visit(ctx.y) as number | undefined,
    }
  }

  xory(ctx: Cst.XoryCstChildren): PossiblePoints {
    if (ctx.x) return { x: this.visit(ctx.x) as number | undefined }
    if (ctx.y) return { y: this.visit(ctx.y) as number | undefined }
    return {}
  }

  coordinate(ctx: Cst.CoordinateCstChildren): PossiblePoints {
    if (ctx.xy) return this.visit(ctx.xy) as PossiblePoints
    if (ctx.xory) return this.visit(ctx.xory) as PossiblePoints
    return {}
  }

  arcRadius(ctx: Cst.ArcRadiusCstChildren): void {
    this.state.arcRadius = this.parseCoordinate(ctx.Number[0].image)
    this.state.arcCenterOffset = undefined
  }

  arcCenter(ctx: Cst.ArcCenterCstChildren): void {
    const i = this.parseCoordinate(ctx.Number[0].image)
    const j = this.parseCoordinate(ctx.Number[1].image)
    this.state.arcCenterOffset = { i, j }
    this.state.arcRadius = undefined
  }

  move(ctx: Cst.MoveCstChildren): void {
    this.state.previousX = this.state.x
    this.state.previousY = this.state.y
    const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (this.state.coordinateMode === Constants.ABSOLUTE) {
      if (x !== undefined) this.state.x = x
      if (y !== undefined) this.state.y = y
    } else {
      if (x !== undefined) this.state.x += x
      if (y !== undefined) this.state.y += y
    }

    if (ctx.arcCenter) this.visit(ctx.arcCenter)
    if (ctx.arcRadius) this.visit(ctx.arcRadius)
    const lastFeature = this.result.findLast(
      (shape) => shape.type == FeatureTypeIdentifier.LINE || shape.type == FeatureTypeIdentifier.ARC || shape.type == FeatureTypeIdentifier.PAD,
    )
    if (this.state.mode == Constants.DRILL) {
      if (lastFeature != undefined) {
        this.result.push(
          new Shapes.DatumLine({
            units: this.state.units,
            xs: this.state.previousX,
            ys: this.state.previousY,
            xe: this.state.x,
            ye: this.state.y,
          }),
        )
      } else {
        this.result.push(
          new Shapes.DatumPoint({
            units: this.state.units,
            x: this.state.x,
            y: this.state.y,
          }),
        )
      }
      this.result.push(
        new Shapes.DatumText({
          units: this.state.units,
          x: this.state.x,
          y: this.state.y,
          text: this.state.currentTool.id,
        }),
      )
      this.result.push(
        new Shapes.Pad({
          units: this.state.units,
          x: this.state.x,
          y: this.state.y,
          symbol: this.state.currentTool,
        }),
      )
    } else {
      if (this.state.plunged) {
        this.state.pathIndex++
        const lastPath = this.result.findLast((shape) => shape.type == FeatureTypeIdentifier.LINE || shape.type == FeatureTypeIdentifier.ARC)
        if (this.state.interpolationMode === Constants.LINE) {
          const angle = Math.atan2(this.state.y - this.state.previousY, this.state.x - this.state.previousX)
          let xs = this.state.previousX
          let ys = this.state.previousY
          let xe = this.state.x
          let ye = this.state.y
          this.result.push(
            new Shapes.DatumText({
              units: this.state.units,
              x: (this.state.x + this.state.previousX) / 2,
              y: (this.state.y + this.state.previousY) / 2,
              text: `${this.state.currentTool.id} ${this.state.chainIndex}-${this.state.pathIndex}`,
            }),
          )
          this.result.push(
            new Shapes.DatumLine({
              units: this.state.units,
              xs,
              ys,
              xe,
              ye,
            }),
          )
          if (this.state.cutterCompensationMode === Constants.LEFT) {
            xs += (Math.cos(angle + Math.PI / 2) * this.state.cutterCompensation) / 2
            ys += (Math.sin(angle + Math.PI / 2) * this.state.cutterCompensation) / 2
            xe += (Math.cos(angle + Math.PI / 2) * this.state.cutterCompensation) / 2
            ye += (Math.sin(angle + Math.PI / 2) * this.state.cutterCompensation) / 2
          } else if (this.state.cutterCompensationMode === Constants.RIGHT) {
            xs += (Math.cos(angle - Math.PI / 2) * this.state.cutterCompensation) / 2
            ys += (Math.sin(angle - Math.PI / 2) * this.state.cutterCompensation) / 2
            xe += (Math.cos(angle - Math.PI / 2) * this.state.cutterCompensation) / 2
            ye += (Math.sin(angle - Math.PI / 2) * this.state.cutterCompensation) / 2
          }
          if (lastPath) {
            if (Number(lastPath.attributes.chainIndex) == this.state.chainIndex) {
              if (lastPath.type == FeatureTypeIdentifier.LINE) {
                // -- LAST PATH IS A LINE AND NEW PATH IS A LINE --
                const insersectionPoint = findLineIntersection(lastPath, { xs, ys, xe, ye })
                // for 2 lines, the only way they cant intersect is if they are parallel so this should always return a point
                if (insersectionPoint != undefined) {
                  xs = insersectionPoint.x
                  ys = insersectionPoint.y
                  lastPath.xe = insersectionPoint.x
                  lastPath.ye = insersectionPoint.y
                }
              } else {
                // -- LAST PATH IS A ARC AND NEW PATH IS A LINE --
                const insersectionPoints = findArcLineIntersections(lastPath, { xs, ys, xe, ye })
                if (insersectionPoints != undefined) {
                  const [p1, p2] = insersectionPoints
                  const d1 = Math.sqrt((p1.x - xs) ** 2 + (p1.y - ys) ** 2)
                  const d2 = Math.sqrt((p2.x - xs) ** 2 + (p2.y - ys) ** 2)
                  const x = d1 < d2 ? p1.x : p2.x
                  const y = d1 < d2 ? p1.y : p2.y
                  xs = x
                  ys = y
                  lastPath.xe = x
                  lastPath.ye = y
                } else {
                  if (Math.sqrt((lastPath.xe - xs) ** 2 + (lastPath.ye - ys) ** 2) > this.state.cutterCompensation / 2) {
                    // arcs and lines may not intersect due to the cutter compensation and the case where the arc is tangent to the line
                    // we can tell if the tangent line to the arc is a smooth transition or a sharp corner by checking if the distance between the arc end point and the line start point is greater than half the cutter compensation
                    // for those cases we can create the connecting arc tool path
                    this.result.push(
                      new Shapes.Arc({
                        units: this.state.units,
                        xs: lastPath.xe,
                        ys: lastPath.ye,
                        xe: xs,
                        ye: ys,
                        xc: this.state.previousX,
                        yc: this.state.previousY,
                        clockwise: lastPath.clockwise ? 0 : 1,
                        symbol: this.state.currentTool,
                        attributes: {
                          cutterCompensation: `${this.state.cutterCompensation.toString()}${this.state.units}`,
                          cutterCompensationMode: this.state.cutterCompensationMode,
                        },
                      }),
                    )
                  }
                }
              }
            }
          }
          // create the tool path
          this.result.push(
            new Shapes.Line({
              units: this.state.units,
              xs,
              ys,
              xe,
              ye,
              symbol: this.state.currentTool,
              attributes: {
                cutterCompensation: `${this.state.cutterCompensation.toString()}${this.state.units}`,
                cutterCompensationMode: this.state.cutterCompensationMode,
                chainIndex: `${this.state.chainIndex}`,
                pathIndex: `${this.state.pathIndex}`,
              },
            }),
          )
        } else {
          const startPoint = { x: this.state.previousX, y: this.state.previousY }
          const endPoint = { x: this.state.x, y: this.state.y }
          const radius =
            this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.i ** 2 + this.state.arcCenterOffset.j ** 2) ** 0.5 : 0)
          const center = getAmbiguousArcCenter(
            startPoint,
            endPoint,
            radius,
            this.state.interpolationMode == Constants.CW_ARC ? Constants.CW_ARC : Constants.CCW_ARC,
          )
          const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x)
          const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x)
          const clockwise = this.state.interpolationMode == Constants.CW_ARC ? 1 : 0
          const cwFlip = this.state.interpolationMode == Constants.CW_ARC ? -1 : 1
          let xs = startPoint.x
          let ys = startPoint.y
          let xe = endPoint.x
          let ye = endPoint.y
          this.result.push(
            new Shapes.DatumArc({
              units: this.state.units,
              xs,
              ys,
              xe,
              ye,
              xc: center.x,
              yc: center.y,
              clockwise,
            }),
          )
          const datumLocation = {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2,
          }
          this.result.push(
            new Shapes.DatumText({
              units: this.state.units,
              x: datumLocation.x,
              y: datumLocation.y,
              text: `${this.state.currentTool.id} ${this.state.chainIndex}-${this.state.pathIndex}`,
            }),
          )
          if (this.state.cutterCompensationMode === Constants.LEFT) {
            xs -= ((Math.cos(startAngle) * this.state.cutterCompensation) / 2) * cwFlip
            ys -= ((Math.sin(startAngle) * this.state.cutterCompensation) / 2) * cwFlip
            xe -= ((Math.cos(endAngle) * this.state.cutterCompensation) / 2) * cwFlip
            ye -= ((Math.sin(endAngle) * this.state.cutterCompensation) / 2) * cwFlip
          } else if (this.state.cutterCompensationMode === Constants.RIGHT) {
            xs += ((Math.cos(startAngle) * this.state.cutterCompensation) / 2) * cwFlip
            ys += ((Math.sin(startAngle) * this.state.cutterCompensation) / 2) * cwFlip
            xe += ((Math.cos(endAngle) * this.state.cutterCompensation) / 2) * cwFlip
            ye += ((Math.sin(endAngle) * this.state.cutterCompensation) / 2) * cwFlip
          }
          if (lastPath) {
            if (Number(lastPath.attributes.chainIndex) == this.state.chainIndex) {
              if (lastPath.type == FeatureTypeIdentifier.ARC) {
                // -- LAST PATH IS A ARC AND NEW PATH IS A ARC --
                const insersectionPoints = findArcIntersections({ xs, ys, xe, ye, xc: center.x, yc: center.y }, lastPath)
                // the first point is the one closer to the first circle start point
                if (insersectionPoints != undefined) {
                  xs = insersectionPoints[0].x
                  ys = insersectionPoints[0].y
                  lastPath.xe = insersectionPoints[0].x
                  lastPath.ye = insersectionPoints[0].y
                } else {
                  // 2 arcs may not intersect due to the cutter compensation and the case where the arc is tangent to the other arc
                  // for those cases we can create the connecting arc tool path
                  this.result.push(
                    new Shapes.Arc({
                      units: this.state.units,
                      xs: lastPath.xe,
                      ys: lastPath.ye,
                      xe: xs,
                      ye: ys,
                      xc: this.state.previousX,
                      yc: this.state.previousY,
                      clockwise: lastPath.clockwise ? 0 : 1,
                      symbol: this.state.currentTool,
                      attributes: {
                        cutterCompensation: `${this.state.cutterCompensation.toString()}${this.state.units}`,
                        cutterCompensationMode: this.state.cutterCompensationMode,
                      },
                    }),
                  )
                }
              } else {
                // -- LAST PATH IS A LINE AND NEW PATH IS A ARC --
                const insersectionPoints = findArcLineIntersections({ xs, ys, xe, ye, xc: center.x, yc: center.y }, lastPath)
                if (insersectionPoints != undefined) {
                  const [p1, p2] = insersectionPoints
                  const d1 = Math.sqrt((p1.x - xs) ** 2 + (p1.y - ys) ** 2)
                  const d2 = Math.sqrt((p2.x - xs) ** 2 + (p2.y - ys) ** 2)
                  const x = d1 < d2 ? p1.x : p2.x
                  const y = d1 < d2 ? p1.y : p2.y
                  xs = x
                  ys = y
                  lastPath.xe = x
                  lastPath.ye = y
                } else {
                  if (Math.sqrt((lastPath.xe - xs) ** 2 + (lastPath.ye - ys) ** 2) > this.state.cutterCompensation / 2) {
                    // arcs and lines may not intersect due to the cutter compensation and the case where the arc is tangent to the line
                    // we can tell if the tangent line to the arc is a smooth transition or a sharp corner by checking if the distance between the arc end point and the line start point is greater than half the cutter compensation
                    // for those cases we can create the connecting arc tool path
                    this.result.push(
                      new Shapes.Arc({
                        units: this.state.units,
                        xs: lastPath.xe,
                        ys: lastPath.ye,
                        xe: xs,
                        ye: ys,
                        xc: this.state.previousX,
                        yc: this.state.previousY,
                        clockwise: clockwise ? 0 : 1,
                        symbol: this.state.currentTool,
                        attributes: {
                          cutterCompensation: `${this.state.cutterCompensation.toString()}${this.state.units}`,
                          cutterCompensationMode: this.state.cutterCompensationMode,
                        },
                      }),
                    )
                  }
                }
              }
            }
          }
          // create the tool path
          this.result.push(
            new Shapes.Arc({
              units: this.state.units,
              xs,
              ys,
              xe,
              ye,
              xc: center.x,
              yc: center.y,
              clockwise,
              symbol: this.state.currentTool,
              attributes: {
                cutterCompensation: `${this.state.cutterCompensation.toString()}${this.state.units}`,
                cutterCompensationMode: this.state.cutterCompensationMode,
                chainIndex: `${this.state.chainIndex}`,
                pathIndex: `${this.state.pathIndex}`,
              },
            }),
          )
        }
      } else {
        if (lastFeature != undefined) {
          this.result.push(
            new Shapes.DatumLine({
              units: this.state.units,
              xs: this.state.previousX,
              ys: this.state.previousY,
              xe: this.state.x,
              ye: this.state.y,
            }),
          )
        } else {
          this.result.push(
            new Shapes.DatumPoint({
              units: this.state.units,
              x: this.state.x,
              y: this.state.y,
            }),
          )
        }
      }
    }
  }

  endOfProgramNoRewind(_ctx: Cst.EndOfProgramNoRewindCstChildren): void {
    // console.log("endOfProgramNoRewind", ctx)
  }

  beginPattern(_ctx: Cst.BeginPatternCstChildren): void {
    this.stepRepeatShapes.push(this.result)
    this.result = []
  }

  endOfPattern(_ctx: Cst.EndOfPatternCstChildren): void {
    this.stepRepeats.push(
      new Shapes.StepAndRepeat({
        units: this.state.units,
        shapes: this.result,
        repeats: [
          {
            datum: [0, 0],
            rotation: 0,
            scale: 1,
            mirror_x: 0,
            mirror_y: 0,
          },
        ],
      }),
    )
    this.result = this.stepRepeatShapes.pop() ?? []

    this.state.patternOffsetX = 0
    this.state.patternOffsetY = 0
  }

  repeatPatternOffset(ctx: Cst.RepeatPatternOffsetCstChildren): void {
    if (ctx.coordinate) {
      const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
      this.state.patternOffsetX += x ?? 0
      this.state.patternOffsetY += y ?? 0
      let mirror_x: Binary = 0
      let mirror_y: Binary = 0
      let rotation: number = 0
      if (ctx.M80) {
        mirror_x = 1
      }
      if (ctx.M90) {
        mirror_y = 1
      }
      if (ctx.M70) {
        mirror_y = mirror_y ? 0 : 1
        rotation = 90
      }
      this.stepRepeats[0].repeats.push({
        datum: [this.state.patternOffsetX, this.state.patternOffsetY],
        rotation,
        scale: 1,
        mirror_x,
        mirror_y,
      })
    } else {
      // if (this.stepRepeats.length) this.result.push(this.stepRepeats.pop() as Shapes.StepAndRepeat)
    }
  }

  endOfStepAndRepeat(_ctx: Cst.EndOfStepAndRepeatCstChildren): void {
    if (this.stepRepeats.length) this.result.push(this.stepRepeats.pop() as Shapes.StepAndRepeat)
    this.state.patternOffsetX = 0
    this.state.patternOffsetY = 0
  }

  optionalStop(_ctx: Cst.OptionalStopCstChildren): void {
    // console.log("optionalStop", ctx)
  }

  stopForInspect(_ctx: Cst.StopForInspectCstChildren): void {
    // console.log("stopForInspect", ctx)
  }

  zAxisRoutPositionWithDepthControlledCountoring(_ctx: Cst.ZAxisRoutPositionWithDepthControlledCountoringCstChildren): void {
    this.state.plunged = true
    this.state.chainIndex++
    this.state.pathIndex = 0
    this.result.push(
      new Shapes.DatumPoint({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        attributes: {
          type: "plunge with depth control",
          chainIndex: `${this.state.chainIndex}`,
        },
      }),
    )
    this.result.push(
      new Shapes.DatumText({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        text: "Plunge with depth control",
        attributes: {
          type: "plunge with depth control",
          chainIndex: `${this.state.chainIndex}`,
        },
      }),
    )
  }

  zAxisRoutPosition(_ctx: Cst.ZAxisRoutPositionCstChildren): void {
    this.state.plunged = true
    this.state.chainIndex++
    this.state.pathIndex = 0
    this.result.push(
      new Shapes.DatumPoint({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        attributes: {
          type: "plunge",
          chainIndex: `${this.state.chainIndex}`,
        },
      }),
    )
    this.result.push(
      new Shapes.DatumText({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        text: "Plunge",
        attributes: {
          type: "plunge",
          chainIndex: `${this.state.chainIndex}`,
        },
      }),
    )
  }

  retractWithClamping(_ctx: Cst.RetractWithClampingCstChildren): void {
    this.state.plunged = false
  }

  retract(_ctx: Cst.RetractCstChildren): void {
    this.state.plunged = false
  }

  endOfProgramRewind(_ctx: Cst.EndOfProgramRewindCstChildren): void {
    // console.log("endOfProgramRewind", ctx)
  }

  longOperatorMessage(_ctx: Cst.LongOperatorMessageCstChildren): void {
    // console.log("longOperatorMessage", ctx)
  }

  operatorMessage(_ctx: Cst.OperatorMessageCstChildren): void {
    // console.log("operatorMessage", ctx)
  }

  header(_ctx: Cst.HeaderCstChildren): void {
    // console.log("header", ctx)
  }

  metricMode(_ctx: Cst.MetricModeCstChildren): void {
    this.state.units = Constants.MM
  }

  inchMode(_ctx: Cst.InchModeCstChildren): void {
    this.state.units = Constants.IN
  }

  routMode(ctx: Cst.RoutModeCstChildren): void {
    this.state.mode = Constants.ROUT
    // this is questionable
    this.state.plunged = false
    this.visit(ctx.move)
  }

  linearMove(ctx: Cst.LinearMoveCstChildren): void {
    this.state.interpolationMode = Constants.LINE
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  circularClockwiseMove(ctx: Cst.CircularClockwiseMoveCstChildren): void {
    this.state.interpolationMode = Constants.CW_ARC
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  circularCounterclockwiseMove(ctx: Cst.CircularCounterclockwiseMoveCstChildren): void {
    this.state.interpolationMode = Constants.CCW_ARC
    // this is questionable
    this.state.plunged = true
    this.visit(ctx.move)
  }

  dwell(_ctx: Cst.DwellCstChildren): void {
    // console.log("dwell", ctx)
  }

  drillMode(_ctx: Cst.DrillModeCstChildren): void {
    this.state.plunged = false
  }

  cwCircle(ctx: Cst.CwCircleCstChildren): void {
    const prevMode = this.state.mode
    this.state.mode = Constants.ROUT
    this.state.plunged = false
    this.visit(ctx.move)
    const radius =
      this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.i ** 2 + this.state.arcCenterOffset.j ** 2) ** 0.5 : 0)
    const sweepRadius = radius - this.state.currentTool.outer_dia / 2
    this.result.push(
      new Shapes.Arc({
        units: this.state.units,
        xs: this.state.x + sweepRadius,
        ys: this.state.y,
        xe: this.state.x + sweepRadius,
        ye: this.state.y,
        xc: this.state.x,
        yc: this.state.y,
        clockwise: 1,
        symbol: this.state.currentTool,
      }),
    )
    this.state.mode = prevMode
  }

  ccwCircle(ctx: Cst.CcwCircleCstChildren): void {
    const prevMode = this.state.mode
    this.state.mode = Constants.ROUT
    this.state.plunged = false
    this.visit(ctx.move)
    const radius =
      this.state.arcRadius ?? (this.state.arcCenterOffset ? (this.state.arcCenterOffset.i ** 2 + this.state.arcCenterOffset.j ** 2) ** 0.5 : 0)
    const sweepRadius = radius - this.state.currentTool.outer_dia / 2
    this.result.push(
      new Shapes.Arc({
        units: this.state.units,
        xs: this.state.x + sweepRadius,
        ys: this.state.y,
        xe: this.state.x + sweepRadius,
        ye: this.state.y,
        xc: this.state.x,
        yc: this.state.y,
        clockwise: 0,
        symbol: this.state.currentTool,
      }),
    )
    this.state.mode = prevMode
  }

  cutterCompensationOff(_ctx: Cst.CutterCompensationOffCstChildren): void {
    this.state.cutterCompensationMode = Constants.OFF
  }

  cutterCompensationLeft(_ctx: Cst.CutterCompensationLeftCstChildren): void {
    this.state.cutterCompensationMode = Constants.LEFT
  }

  cutterCompensationRight(_ctx: Cst.CutterCompensationRightCstChildren): void {
    this.state.cutterCompensationMode = Constants.RIGHT
  }

  absoluteMode(_ctx: Cst.AbsoluteModeCstChildren): void {
    this.state.coordinateMode = Constants.ABSOLUTE
  }

  incrementalMode(_ctx: Cst.IncrementalModeCstChildren): void {
    this.state.coordinateMode = Constants.INCREMENTAL
  }

  zeroSet(ctx: Cst.ZeroSetCstChildren): void {
    const { x, y } = this.visit(ctx.xy) as PossiblePoints
    if (x !== undefined) {
      this.result.push(
        new Shapes.DatumPoint({
          units: this.state.units,
          x: x || 0,
          y: y || 0,
        }),
        new Shapes.DatumText({
          units: this.state.units,
          text: "Zero Set",
          x: x || 0,
          y: y || 0,
        }),
      )
    }
  }

  selectVisionTool(_ctx: Cst.SelectVisionToolCstChildren): void {
    // console.log("selectVisionTool", ctx)
  }

  singlePointVisionOffset(ctx: Cst.SinglePointVisionOffsetCstChildren): void {
    this.state.previousX = this.state.x
    this.state.previousY = this.state.y
    const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (this.state.coordinateMode === Constants.ABSOLUTE) {
      if (x !== undefined) this.state.x = x
      if (y !== undefined) this.state.y = y
    } else {
      if (x !== undefined) this.state.x += x
      if (y !== undefined) this.state.y += y
    }

    this.result.push(
      new Shapes.DatumText({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        text: "Alignment Point",
      }),
    )
    this.result.push(
      new Shapes.DatumPoint({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
      }),
    )
  }

  multiPointVisionOffset(ctx: Cst.MultiPointVisionOffsetCstChildren): void {
    this.state.previousX = this.state.x
    this.state.previousY = this.state.y
    const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (this.state.coordinateMode === Constants.ABSOLUTE) {
      if (x !== undefined) this.state.x = x
      if (y !== undefined) this.state.y = y
    } else {
      if (x !== undefined) this.state.x += x
      if (y !== undefined) this.state.y += y
    }
    if (ctx.coordinate) this.visit(ctx.coordinate)
    this.result.push(
      new Shapes.DatumText({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        text: "Alignment Point",
      }),
    )
    this.result.push(
      new Shapes.DatumPoint({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
      }),
    )
  }

  cancelVisionOffset(_ctx: Cst.CancelVisionOffsetCstChildren): void {
    // console.log("cancelVisionOffset", ctx)
  }

  visionCorrectedSingleHole(ctx: Cst.VisionCorrectedSingleHoleCstChildren): void {
    this.state.previousX = this.state.x
    this.state.previousY = this.state.y
    const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (this.state.coordinateMode === Constants.ABSOLUTE) {
      if (x !== undefined) this.state.x = x
      if (y !== undefined) this.state.y = y
    } else {
      if (x !== undefined) this.state.x += x
      if (y !== undefined) this.state.y += y
    }
    this.result.push(
      new Shapes.DatumText({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        text: "Vision Correction",
      }),
    )
    this.result.push(
      new Shapes.DatumPoint({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
      }),
    )
  }

  visionAutoCalibration(_ctx: Cst.VisionAutoCalibrationCstChildren): void {
    // console.log("visionAutoCalibration", ctx)
  }

  // Canned cycles

  cannedSlot(ctx: Cst.CannedSlotCstChildren): void {
    this.state.previousX = this.state.x
    this.state.previousY = this.state.y
    const { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (this.state.coordinateMode === Constants.ABSOLUTE) {
      if (x !== undefined) this.state.x = x
      if (y !== undefined) this.state.y = y
    } else {
      if (x !== undefined) this.state.x += x
      if (y !== undefined) this.state.y += y
    }
    this.result.push(
      new Shapes.Line({
        units: this.state.units,
        xs: this.state.previousX,
        ys: this.state.previousY,
        xe: this.state.x,
        ye: this.state.y,
        symbol: this.state.currentTool,
        attributes: {
          type: "canned slot",
        },
      }),
      new Shapes.DatumText({
        units: this.state.units,
        x: (this.state.x + this.state.previousX) / 2,
        y: (this.state.y + this.state.previousY) / 2,
        text: "Canned Slot",
      }),
      new Shapes.DatumLine({
        units: this.state.units,
        xs: this.state.x,
        ys: this.state.y,
        xe: this.state.previousX,
        ye: this.state.previousY,
      }),
      new Shapes.Pad({
        units: this.state.units,
        x: this.state.x,
        y: this.state.y,
        symbol: this.state.currentTool,
      }),
    )
  }

  cannedCircle(ctx: Cst.CannedCircleCstChildren): void {
    this.state.previousX = this.state.x
    const dia = this.visit(ctx.x) as number | undefined
    this.result.push(
      new Shapes.Pad({
        units: this.state.units,
        x: this.state.previousX,
        y: this.state.y,
        attributes: {
          type: "canned circle",
        },
        symbol: new Symbols.RoundSymbol({
          units: this.state.units,
          outer_dia: dia || 3.175 * baseUnitsConversionFactor(this.state.units),
          inner_dia: 0,
        }),
      }),
    )
  }

  repeatHole(ctx: Cst.RepeatHoleCstChildren): void {
    const repeats = Number(ctx.Number[0].image)
    let { x, y } = this.visit(ctx.coordinate) as PossiblePoints
    if (x == undefined) x = 0
    if (y == undefined) y = 0
    for (let i = 0; i < repeats; i++) {
      this.state.y += y
      this.state.x += x
      this.result.push(
        new Shapes.Pad({
          units: this.state.units,
          symbol: this.state.currentTool,
          x: this.state.x,
          y: this.state.y,
        }),
      )
    }
  }

  parseCoordinate(coordinate: string): number {
    if (coordinate.includes(".") || coordinate === "0") {
      return Number(coordinate)
    }

    const { coordinateFormat, zeroSuppression } = this.state
    let [integerPlaces, decimalPlaces] = coordinateFormat
    const [sign, signlessCoordinate] =
      coordinate.startsWith("+") || coordinate.startsWith("-") ? [coordinate[0], coordinate.slice(1)] : ["+", coordinate]

    if (signlessCoordinate.length > integerPlaces + decimalPlaces) {
      this.state.coordinateFormat = [coordinate.length - decimalPlaces, decimalPlaces]
    }
    ;[integerPlaces, decimalPlaces] = this.state.coordinateFormat
    const digits = integerPlaces + decimalPlaces
    const paddedCoordinate =
      zeroSuppression === Constants.TRAILING ? signlessCoordinate.padEnd(digits, "0") : signlessCoordinate.padStart(digits, "0")

    const leading = paddedCoordinate.slice(0, paddedCoordinate.length - decimalPlaces)
    const trailing = paddedCoordinate.slice(paddedCoordinate.length - decimalPlaces)

    return Number(`${sign}${leading}.${trailing}`)
  }
}

export function getAmbiguousArcCenter(startPoint: Point, endPoint: Point, radius: number, arcDirection: ArcDirection): Point {
  // Get the center candidates and select the candidate with the smallest arc
  const [_start, _end, center] = findCircleIntersections(startPoint, endPoint, radius)
    .map((centerPoint) => {
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

export function getArcPositions(
  startPoint: Point,
  endPoint: Point,
  centerPoint: Point,
  arcDirection: ArcDirection,
): [start: ArcPosition, end: ArcPosition, center: Position] {
  let startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x)
  let endAngle = Math.atan2(endPoint.y - centerPoint.y, endPoint.x - centerPoint.x)

  // If counter-clockwise, end angle should be greater than start angle
  if (arcDirection === Constants.CCW_ARC) {
    endAngle = endAngle > startAngle ? endAngle : endAngle + Math.PI * 2
  } else {
    startAngle = startAngle > endAngle ? startAngle : startAngle + Math.PI * 2
  }

  return [
    [startPoint.x, startPoint.y, startAngle],
    [endPoint.x, endPoint.y, endAngle],
    [centerPoint.x, centerPoint.y],
  ]
}

// Find arc center candidates by finding the intersection points
// of two circles with `radius` centered on the start and end points
// https://math.stackexchange.com/a/1367732
function findCircleIntersections(startPoint: Point, endPoint: Point, radius: number): Point[] {
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
    const point = { x: x1 + dx / 2, y: y1 + dy / 2 }
    return [point, point]
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

interface Line {
  xs: number
  ys: number
  xe: number
  ye: number
}

/**
 * Find the intersection point of two lines
 * http://paulbourke.net/geometry/pointlineplane/
 * @param line1
 * @param line2
 * @returns point of intersection or undefined if the lines are parallel
 */
function findLineIntersection(line1: Line, line2: Line): Point | undefined {
  const [x1, y1] = [line1.xs, line1.ys]
  const [x2, y2] = [line1.xe, line1.ye]
  const [x3, y3] = [line2.xs, line2.ys]
  const [x4, y4] = [line2.xe, line2.ye]

  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)

  // Lines are parallel
  if (denominator === 0) {
    return
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator

  // Return a object with the x and y coordinates of the intersection
  const x = x1 + ua * (x2 - x1)
  const y = y1 + ua * (y2 - y1)

  return { x, y }
}

interface Arc {
  xs: number
  ys: number
  xe: number
  ye: number
  xc: number
  yc: number
}

/**
 * Find the intersection points of a circle and a line
 * https://www.reddit.com/r/gamemaker/comments/m38s5j/line_circle_intersect_function_to_share/
 * @param arc
 * @param line
 * @returns
 */
function findArcLineIntersections(arc: Arc, line: Line): Point[] | undefined {
  const cx = arc.xc
  const cy = arc.yc
  const radius = Math.sqrt((cx - arc.xs) ** 2 + (cy - arc.ys) ** 2)
  const x1 = line.xs
  const y1 = line.ys
  const x2 = line.xe
  const y2 = line.ye

  // Find intersect points with a line and a circle
  // Circle origin [cx, cy] with radius radius
  // Line of [x1, y1] to [x2, y2]

  const _cx = x1 - cx
  const _cy = y1 - cy

  const _vx = x2 - x1,
    _vy = y2 - y1,
    _a = _vx * _vx + _vy * _vy,
    _b = 2 * (_vx * _cx + _vy * _cy),
    _c = _cx * _cx + _cy * _cy - radius * radius
  let determinant = _b * _b - 4 * _a * _c

  if (_a <= 0.000001 || determinant < 0) {
    // No real solutions.
    return
  } else if (determinant == 0) {
    // Line is tangent to the circle
    const _t = -_b / (2 * _a)
    const point = { x: x1 + _t * _vx, y: y1 + _t * _vy }
    return [point, point]
  } else {
    // Line intersects circle
    determinant = Math.sqrt(determinant)
    const _t1 = (-_b - determinant) / (2 * _a)
    const _t2 = (-_b + determinant) / (2 * _a)

    const p1 = { x: x1 + _t1 * _vx, y: y1 + _t1 * _vy }
    const p2 = { x: x1 + _t2 * _vx, y: y1 + _t2 * _vy }
    return [p1, p2]
  }
}

/**
 * Find the intersection points of two circles, the first point returned is the one closer to the first circle start point
 * http://math.stackexchange.com/a/1367732
 * @param arc1
 * @param arc2
 * @returns  the first point is the one closer to the first circle start point
 */
function findArcIntersections(arc1: Arc, arc2: Arc): Point[] | undefined {
  const x1 = arc1.xc
  const y1 = arc1.yc
  const r1 = Math.sqrt((arc1.xs - x1) ** 2 + (arc1.ys - y1) ** 2)
  const x2 = arc2.xc
  const y2 = arc2.yc
  const r2 = Math.sqrt((arc2.xs - x2) ** 2 + (arc2.ys - y2) ** 2)

  const centerdx = x1 - x2
  const centerdy = y1 - y2
  const R = Math.sqrt(centerdx * centerdx + centerdy * centerdy)
  if (!(Math.abs(r1 - r2) <= R && R <= r1 + r2)) {
    // no intersection
    return // empty list of results
  }

  // intersection(s) should exist

  const R2 = R * R
  const R4 = R2 * R2
  const a = (r1 * r1 - r2 * r2) / (2 * R2)
  const r2r2 = r1 * r1 - r2 * r2
  const c = Math.sqrt((2 * (r1 * r1 + r2 * r2)) / R2 - (r2r2 * r2r2) / R4 - 1)

  const fx = (x1 + x2) / 2 + a * (x2 - x1)
  const gx = (c * (y2 - y1)) / 2
  const ix1 = fx + gx
  const ix2 = fx - gx

  const fy = (y1 + y2) / 2 + a * (y2 - y1)
  const gy = (c * (x1 - x2)) / 2
  const iy1 = fy + gy
  const iy2 = fy - gy

  // note if gy == 0 and gx == 0 then the circles are tangent and there is only one solution
  // but that one solution will just be duplicated as the code is currently written
  // return the points with the first closer to circle 1 start
  const d1 = Math.sqrt((ix1 - arc1.xs) ** 2 + (iy1 - arc1.ys) ** 2)
  const d2 = Math.sqrt((ix2 - arc1.xs) ** 2 + (iy2 - arc1.ys) ** 2)
  return d1 < d2
    ? [
        { x: ix1, y: iy1 },
        { x: ix2, y: iy2 },
      ]
    : [
        { x: ix2, y: iy2 },
        { x: ix1, y: iy1 },
      ]
}

// TODO: add support for more excellon Canned Cycle Commands
