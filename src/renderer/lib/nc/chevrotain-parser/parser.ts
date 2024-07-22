import { Lexer, createToken, CstParser, CstNode, ParserMethod, IToken } from "chevrotain"

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
  M30: createToken({ name: "M30", pattern: /M30/ }),
  M45: createToken({ name: "M45", pattern: /M45/, push_mode: "text" }),
  M47: createToken({ name: "M47", pattern: /M47/, push_mode: "text" }),
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
  LParen: createToken({ name: "LParen", pattern: /\(/, push_mode: "comment" }),
  RParen: createToken({ name: "RParen", pattern: /\)/ }),
  Semicolon: createToken({ name: "Semicolon", pattern: /;/, push_mode: "comment" }),
} as const

const CommentTokens = {
  Text: createToken({ name: "Text", pattern: /[^)\r?\n]+/ }),
  RParen: createToken({ name: "RParen", pattern: /(?:\r?\n|\))/, pop_mode: true, line_breaks: true }),
}

const TextTokens = {
  Text: createToken({ name: "Text", pattern: /[^\r?\n]+/ }),
  EndText: createToken({ name: "EndText", pattern: /\r?\n/, pop_mode: true, line_breaks: true }),
}


// const allTokens = Object.values(DefaultTokens)

const multiModeLexerDefinition = {
  modes: {
    default: Object.values(DefaultTokens),
    comment: Object.values(CommentTokens),
    text: Object.values(TextTokens),
  },

  defaultMode: "default",
};

export const SelectLexer = new Lexer(multiModeLexerDefinition)

class SelectParser extends CstParser {
  command!: ParserMethod<unknown[], CstNode>
  units!: ParserMethod<unknown[], CstNode>
  toolDefinition!: ParserMethod<unknown[], CstNode>
  toolChange!: ParserMethod<unknown[], CstNode>
  comment!: ParserMethod<unknown[], CstNode>
  drillHit!: ParserMethod<unknown[], CstNode>
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
  endOfPatter!: ParserMethod<unknown[], CstNode>
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
  matricMode!: ParserMethod<unknown[], CstNode>
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
        { ALT: (): CstNode => this.SUBRULE(this.drillHit) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfProgramNoRewind) },
        { ALT: (): CstNode => this.SUBRULE(this.endOfPatter) },
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
        { ALT: (): CstNode => this.SUBRULE(this.matricMode) },
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
        this.CONSUME(CommentTokens.Text)
      })
      this.OPTION2(() => {
        this.CONSUME(CommentTokens.RParen)
      })
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



    this.RULE("drillHit", () => {
      this.SUBRULE(this.coordinate)
    })

    this.RULE("endOfProgramNoRewind", () => {
      this.CONSUME(DefaultTokens.M00)
      this.OPTION(() => {
        this.SUBRULE(this.xy)
      })
    })

    this.RULE("endOfPatter", () => {
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

    this.RULE("matricMode", () => {
      this.CONSUME(DefaultTokens.M71)
    })

    this.RULE("inchMode", () => {
      this.CONSUME(DefaultTokens.M72)
    })

    this.RULE("routMode", () => {
      this.CONSUME(DefaultTokens.G00)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("linearMove", () => {
      this.CONSUME(DefaultTokens.G01)
      this.SUBRULE(this.coordinate)
    })

    this.RULE("circularClockwiseMove", () => {
      this.CONSUME(DefaultTokens.G02)
      this.SUBRULE(this.coordinate)
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.arcRadius) },
        { ALT: (): CstNode => this.SUBRULE(this.arcCenter) },
      ])
    })

    this.RULE("circularCounterclockwiseMove", () => {
      this.CONSUME(DefaultTokens.G03)
      this.SUBRULE(this.coordinate)
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.arcRadius) },
        { ALT: (): CstNode => this.SUBRULE(this.arcCenter) },
      ])
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
      this.SUBRULE(this.coordinate)
      this.CONSUME(DefaultTokens.A)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("ccwCircle", () => {
      this.CONSUME(DefaultTokens.G33)
      this.SUBRULE(this.coordinate)
      this.CONSUME(DefaultTokens.A)
      this.CONSUME(DefaultTokens.Number)
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

export const parser = new SelectParser()
