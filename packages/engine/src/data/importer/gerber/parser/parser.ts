import {
  CCW_ARC,
  CIRCLE,
  CW_ARC,
  DARK,
  LEADING,
  LINE,
  MACRO_PRIMITIVE,
  MACRO_SHAPE,
  MACRO_VARIABLE,
  MOVE,
  OBROUND,
  POLYGON,
  RECTANGLE,
  SEGMENT,
  SHAPE,
  TRAILING,
} from "@hpcreery/tracespace-parser"
import type {
  Format,
  GraphicType,
  HoleShape,
  MacroBlock,
  MacroPrimitiveCode,
  MacroValue,
  Mirroring,
  Polarity,
  SimpleShape,
  ZeroSuppression,
} from "@hpcreery/tracespace-parser"
import * as Shapes from "@src/data/shape/shape"
import * as Symbols from "@src/data/shape/symbol/symbol"
import { SymbolTypeIdentifier } from "@src/types"
import { type CstNode, CstParser, createToken, generateCstDts, type IToken, Lexer, type ParserMethod, type Rule } from "chevrotain"
import { vec2 } from "gl-matrix"
import { createMacro } from "../plotter/src/graphic-plotter/plot-macro"
import { getAmbiguousArcCenter } from "../plotter/src/graphic-plotter"
import { IMAGE, type ImageTree } from "../plotter/src/tree"
import type { MacroTool } from "../plotter/src/tool-store"
import type { GerberCoordinates, GerberMacroOperator } from "./types"
import type * as cst from "./gerbercst"

const DefaultTokens = {
  WhiteSpace: createToken({ name: "WhiteSpace", pattern: /[ \t]+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true, group: Lexer.SKIPPED }),

  // CommentCommand: createToken({ name: "CommentCommand", pattern: /G04[^*\r\n]*\*/i }),

  // Primative tokens
  Percent: createToken({ name: "Percent", pattern: /%/ }),
  Star: createToken({ name: "Star", pattern: /\*/ }),
  Comma: createToken({ name: "Comma", pattern: /,/ }),
  Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?\d*|\.\d+)/ }),
  // UnsignedInteger: createToken({ name: "UnsignedInteger", pattern: /[0-9]+/ }),

  // Names consist of upper- or lower-case letters, underscores (‘_’), dots (‘.’), a dollar sign (‘$’) and digits. The first character cannot be a digit. Name = [a-zA-Z_.$]{[a-zA-Z_.0-9]+}
  Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/ }),
  // Strings are made up of all valid characters except the reserved characters CR, LF, ‘%’ and ‘*’. [a-zA-Z0-9_+-/!?<>”’(){}.\|&@# ,;$:=]+
  // String: createToken({ name: "String", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ,;$:=]+/ }),

  // FS Format specification. Sets the coordinate format, e.g. the number of decimals.
  FS: createToken({ name: "FS", pattern: /FS/i }),
  // MO Mode. Sets the unit to inch or mm.
  MO: createToken({ name: "MO", pattern: /MO/i }),
  // AD Aperture define. Defines a template based aperture and assigns a D code to it.
  AD: createToken({ name: "AD", pattern: /AD/i }),
  // AM Aperture macro. Defines a macro aperture template.
  AM: createToken({ name: "AM", pattern: /AM/i, push_mode: "MacroMode" }),
  // AB Aperture block. Defines a block aperture and assigns a D-code to it.
  AB: createToken({ name: "AB", pattern: /AB/i }),
  // LP Load polarity. Loads the polarity object transformation parameter.
  LP: createToken({ name: "LP", pattern: /LP/i }),
  // LM Load mirror. Loads the mirror object transformation parameter.
  LM: createToken({ name: "LM", pattern: /LM/i }),
  // LR Load rotation. Loads the rotation object transformation parameter.
  LR: createToken({ name: "LR", pattern: /LR/i }),
  // LS Load scale. Loads the scale object transformation parameter.
  LS: createToken({ name: "LS", pattern: /LS/i }),

  // Function code commands are identified by a code letter G, D or M followed by a code number, e.g. G02.
  // A code number is a positive integer number without preceding ‘+’. The available code numbers
  // are described in this specification. A code number can be padded with leading zeros, but the
  // resulting number record must not contain more than 10 digits.
  // G01 Sets the interpolation mode to linear.
  G01: createToken({ name: "G01", pattern: /G0*1/i }),
  // G02 Sets the interpolation mode to clockwise circular.
  G02: createToken({ name: "G02", pattern: /G0*2/i }),
  // G03 Sets the interpolation mode to counterclockwise circular.
  G03: createToken({ name: "G03", pattern: /G0*3/i }),
  // G04 Comment.
  G04: createToken({ name: "G04", pattern: /G0*4/i, push_mode: "CommentMode" }),
  // G36 Starts a region statement. This creates a region by defining its contour
  G36: createToken({ name: "G36", pattern: /G0*36/i }),
  // G37 Ends the region statement.
  G37: createToken({ name: "G37", pattern: /G0*37/i }),
  // G74 Sets quadrant mode to single quadrant.
  G74: createToken({ name: "G74", pattern: /G0*74/i }),
  // G75 Sets quadrant mode to multi quadrant.
  G75: createToken({ name: "G75", pattern: /G0*75/i }),
  // M02 End of file.
  M02: createToken({ name: "M02", pattern: /M0*2/i }),

  /** DEPRECATED COMMANDS */
  // G90 Set the ‘Coordinate format’ to ‘Absolute notation’ These historic codes perform a function handled by the FS command. See 4.1. Very rarely used nowadays
  G90: createToken({ name: "G90", pattern: /G0*90/i }),
  // G91 Set the ‘Coordinate format’ to ‘Incremental notation’ These historic codes perform a function handled by the FS command. See 4.1. Very rarely used nowadays
  G91: createToken({ name: "G91", pattern: /G0*91/i }),
  // G54. This historic code optionally precedes an aperture selection D-code. It has no effect. Sometimes used.
  G54: createToken({ name: "G54", pattern: /G0*54/i }),
  // G55 Prepare for flash This historic code optionally precedes D03 code. It has no effect. Very rarely used nowadays
  G55: createToken({ name: "G55", pattern: /G0*55/i }),
  // G70 Set the ‘Unit’ to inch These historic codes perform a function handled by the MO command. See 4.2. Sometimes used.
  G70: createToken({ name: "G70", pattern: /G0*70/i }),
  // G71 Set the ‘Unit’ to mm These historic codes perform a function handled by the MO command. See 4.2. Sometimes used.
  G71: createToken({ name: "G71", pattern: /G0*71/i }),
  // M00 Program stop This historic code has the same effect as M02. See 4.14. Very rarely used nowadays.
  M00: createToken({ name: "M00", pattern: /M00/i }),
  // M01 Optional stop This historic code has no effect. Very rarely used nowadays
  M01: createToken({ name: "M01", pattern: /M0*1/i }),
  // IP Sets the ‘Image polarity’ graphics state parameter IP can only be used once, at the beginning of the file. Sometimes used, and then usually as %IPPOS*% to confirm the default – a positive image; it then has no effect. As it is not clear how %IPNEG*% must be handled it is probably a waste of time to try to fully implement it, and sufficient to give a warning if an image is negative.
  IP: createToken({ name: "IP", pattern: /IP/i }),
  // These commands can only be used once, at the beginning of the file. The order of execution is always MI, SF, OF, IR and AS, independent of their order of appearance in the file
  // Rarely used nowadays. If used it is almost always to confirm the default value; they have no effect. It
  // is probably a waste of time to fully implement these commands; simply ignoring them will
  // handle the overwhelming majority of Gerber files correctly; issuing a warning when used with a
  // non-default value protects the reader in the very rare cases this occurs.
  MI: createToken({ name: "MI", pattern: /MI/i }),
  SF: createToken({ name: "SF", pattern: /SF/i }),
  OF: createToken({ name: "OF", pattern: /OF/i }),
  IR: createToken({ name: "IR", pattern: /IR/i }),
  AS: createToken({ name: "AS", pattern: /AS/i }),
  // IN Sets the name of the file image. Has no effect. It is comment. These commands can only be used once, at the beginning of the file. Use G04 for comments. See 4.14. Sometimes used.
  // IN: createToken({ name: "IN", pattern: /IN/i }), // conflics with other IN token.
  // IN Sets the name of the file image. Has no effect. It is comment. These commands can only be used once, at the beginning of the file. Use G04 for comments. See 4.14. Sometimes used.
  LN: createToken({ name: "LN", pattern: /LN/i }),
  // SR Step and repeat. Open or closes a step and repeat statement. These constructions are deprecated since revision 2016.01.
  SR: createToken({ name: "SR", pattern: /SR/i }),
  /** END OF DEPRECATED COMMANDS */

  // The codes D01, D02, D03 have a special function and are called operation codes. They are used together with coordinate data to form commands called operations.
  // D01 Interpolate operation. Outside a region statement D01 creates a draw or arc object using the current aperture. Inside it creates a linear or circular contoursegment. After the D01 command the current point is moved to draw/arc end point.
  D01: createToken({ name: "D01", pattern: /D0*1(?!\d)/i }),
  // D02 Move operation. D02 does not create a graphics object but moves the current point to the coordinate in the D02 command.
  D02: createToken({ name: "D02", pattern: /D0*2(?!\d)/i }),
  // D03 Flash operation. Creates a flash object with the current aperture. After the D03 command the current point is moved to the flash point.
  D03: createToken({ name: "D03", pattern: /D0*3(?!\d)/i }),
  // Dnn (nn≥10) Sets the current aperture to D code nn.
  Dnn: createToken({ name: "Dnn", pattern: /D(?:[1-9][0-9]+)/i }),

  L: createToken({ name: "L", pattern: /L(?=[AI])/i }),
  // Trailing zero omission is deprecated since revision 2015.06.
  T: createToken({ name: "T", pattern: /T(?=[AI])/i }),
  // A Absolute
  // A: createToken({ name: "A", pattern: /A/i }),
  // I Incremental Notation is deprecated since revision I1 from December 2012.
  // I: createToken({ name: "I", pattern: /I/i }),
  MM: createToken({ name: "MM", pattern: /MM/i }),
  IN: createToken({ name: "IN", pattern: /IN/i }),

  // Axis tokens for coordinates. A coordinate is a number prefixed with an axis identifier, e.g. X12.34 or Y-56.78
  X: createToken({ name: "X", pattern: /X(?=[+-]?(?:\d+\.?\d*|\.\d+))/ }),
  Y: createToken({ name: "Y", pattern: /Y(?=[+-]?(?:\d+\.?\d*|\.\d+))/ }),
  I: createToken({ name: "I", pattern: /I(?=[+-]?(?:\d+\.?\d*|\.\d+))/ }),
  J: createToken({ name: "J", pattern: /J(?=[+-]?(?:\d+\.?\d*|\.\d+))/ }),
  A: createToken({ name: "A", pattern: /A(?=X|[+-]?(?:\d+\.?\d*|\.\d+))/ }),

  // TF Attribute file. Set a file attribute.
  TF: createToken({ name: "TF", pattern: /TF/i }),
  // TA Attribute aperture. Add an aperture attribute to the dictionary or modify it.
  TA: createToken({ name: "TA", pattern: /TA/i }),
  // TO Attribute object. Add an object attribute to the dictionary or modify it.
  TO: createToken({ name: "TO", pattern: /TO/i }),
  // TD Attribute delete. Delete one or all attributes in the dictionary
  TD: createToken({ name: "TD", pattern: /TD/i }),

  // UnknownWordCommand: createToken({ name: "UnknownWordCommand", pattern: /[GMD][^*\r\n]*/i }),
} as const

const MacroTokens = {
  WhiteSpace: createToken({ name: "MacroWhiteSpace", pattern: /[ \t]+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "MacroNewLine", pattern: /\r?\n/, line_breaks: true, group: Lexer.SKIPPED }),
  // MacroEndPercent: createToken({ name: "MacroEndPercent", pattern: /%/, pop_mode: true }),
  MacroVariable: createToken({ name: "MacroVariable", pattern: /\$[0-9]*[1-9][0-9]*/ }),
  UnsignedNumber: createToken({ name: "UnsignedNumber", pattern: /(?:\d+\.?\d*|\.\d+)/ }),
  // Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?\d*|\.\d+)/ }),
  // UnsignedInteger: createToken({ name: "UnsignedInteger", pattern: /[0-9]+/ }),
  Percent: createToken({ name: "Percent", pattern: /%/, pop_mode: true }),
  Star: createToken({ name: "Star", pattern: /\*/ }),
  Comma: createToken({ name: "Comma", pattern: /,/ }),
  Equals: createToken({ name: "Equals", pattern: /=/ }),
  LParen: createToken({ name: "LParen", pattern: /\(/ }),
  RParen: createToken({ name: "RParen", pattern: /\)/ }),
  AddSubOperator: createToken({ name: "AddSubOperator", pattern: /[+-]/ }),
  MulDivOperator: createToken({ name: "MulDivOperator", pattern: /[xX\\/]/ }),
  Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/ }),
} as const

const CommentTokens = {
  // Comment: createToken({ name: "Comment", pattern: /[^*\r\n]*/i, pop_mode: true }),
  String: createToken({ name: "String", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ,;$:=]+/, pop_mode: true }),
}

// The order of Token definitions passed to the Lexer is important. The first PATTERN to match will be chosen, not the longest.
const DefaultModeTokens = [
  DefaultTokens.WhiteSpace,
  DefaultTokens.NewLine,
  DefaultTokens.Percent,
  DefaultTokens.Star,
  DefaultTokens.Comma,
  DefaultTokens.FS,
  DefaultTokens.MO,
  DefaultTokens.AD,
  DefaultTokens.AM,
  DefaultTokens.AB,
  DefaultTokens.LP,
  DefaultTokens.LM,
  DefaultTokens.LR,
  DefaultTokens.LS,
  DefaultTokens.G36,
  DefaultTokens.G37,
  DefaultTokens.G74,
  DefaultTokens.G75,
  DefaultTokens.G90,
  DefaultTokens.G91,
  DefaultTokens.G54,
  DefaultTokens.G55,
  DefaultTokens.G70,
  DefaultTokens.G71,
  DefaultTokens.M02,
  DefaultTokens.M01,
  DefaultTokens.M00,
  DefaultTokens.G01,
  DefaultTokens.G02,
  DefaultTokens.G03,
  DefaultTokens.G04,
  DefaultTokens.D01,
  DefaultTokens.D02,
  DefaultTokens.D03,
  DefaultTokens.Dnn,
  DefaultTokens.IP,
  DefaultTokens.MI,
  DefaultTokens.SF,
  DefaultTokens.OF,
  DefaultTokens.IR,
  DefaultTokens.AS,
  DefaultTokens.LN,
  DefaultTokens.SR,
  DefaultTokens.TF,
  DefaultTokens.TA,
  DefaultTokens.TO,
  DefaultTokens.TD,
  DefaultTokens.MM,
  DefaultTokens.IN,
  DefaultTokens.L,
  DefaultTokens.T,
  DefaultTokens.X,
  DefaultTokens.Y,
  DefaultTokens.I,
  DefaultTokens.J,
  DefaultTokens.A,
  // DefaultTokens.UnknownWordCommand,
  DefaultTokens.Number,
  // DefaultTokens.UnsignedInteger,
  DefaultTokens.Name,
  // DefaultTokens.String,
]

// The order of Token definitions passed to the Lexer is important. The first PATTERN to match will be chosen, not the longest.
const MacroModeTokens = [
  MacroTokens.WhiteSpace,
  MacroTokens.NewLine,
  MacroTokens.MacroVariable,
  MacroTokens.UnsignedNumber,
  MacroTokens.Percent,
  MacroTokens.Star,
  MacroTokens.Comma,
  MacroTokens.Equals,
  MacroTokens.LParen,
  MacroTokens.RParen,
  MacroTokens.AddSubOperator,
  MacroTokens.MulDivOperator,
  MacroTokens.Name,
]

const CommentModeTokens = [CommentTokens.String]

const multiModeLexerDefinition = {
  modes: {
    DefaultMode: DefaultModeTokens,
    MacroMode: MacroModeTokens,
    CommentMode: CommentModeTokens,
  },
  defaultMode: "DefaultMode",
}

export const GerberLexer = new Lexer(multiModeLexerDefinition)

class GerberParser extends CstParser {
  program!: ParserMethod<unknown[], CstNode>
  command!: ParserMethod<unknown[], CstNode>
  extendedCommandDataBlock!: ParserMethod<unknown[], CstNode>
  extendedCommand!: ParserMethod<unknown[], CstNode>
  functionCodeCommand!: ParserMethod<unknown[], CstNode>

  formatSpecificationCommand!: ParserMethod<unknown[], CstNode>
  unitsCommand!: ParserMethod<unknown[], CstNode>
  apertureDefinitionCommand!: ParserMethod<unknown[], CstNode>
  modifiersSet!: ParserMethod<unknown[], CstNode>
  apertureMacroCommand!: ParserMethod<unknown[], CstNode>
  polarityCommand!: ParserMethod<unknown[], CstNode>
  mirroringCommand!: ParserMethod<unknown[], CstNode>
  rotationCommand!: ParserMethod<unknown[], CstNode>
  scalingCommand!: ParserMethod<unknown[], CstNode>
  stepRepeatOpenCommand!: ParserMethod<unknown[], CstNode>
  stepRepeatCloseCommand!: ParserMethod<unknown[], CstNode>
  blockApertureOpenCommand!: ParserMethod<unknown[], CstNode>
  blockApertureCloseCommand!: ParserMethod<unknown[], CstNode>

  commentCommand!: ParserMethod<unknown[], CstNode>
  endCommand!: ParserMethod<unknown[], CstNode>
  inlineInterpolateOperationCommand!: ParserMethod<unknown[], CstNode>
  operationCode!: ParserMethod<unknown[], CstNode>
  quadrantSingleCommand!: ParserMethod<unknown[], CstNode>
  quadrantMultiCommand!: ParserMethod<unknown[], CstNode>
  regionStartCommand!: ParserMethod<unknown[], CstNode>
  regionEndCommand!: ParserMethod<unknown[], CstNode>
  g54ToolChangeCommand!: ParserMethod<unknown[], CstNode>
  dCodeCommand!: ParserMethod<unknown[], CstNode>
  operationCommand!: ParserMethod<unknown[], CstNode>
  unknownWordCommand!: ParserMethod<unknown[], CstNode>

  coordinateData!: ParserMethod<unknown[], CstNode>
  coordinateField!: ParserMethod<unknown[], CstNode>
  xCoordinate!: ParserMethod<unknown[], CstNode>
  yCoordinate!: ParserMethod<unknown[], CstNode>
  iCoordinate!: ParserMethod<unknown[], CstNode>
  jCoordinate!: ParserMethod<unknown[], CstNode>
  aCoordinate!: ParserMethod<unknown[], CstNode>

  macroBlock!: ParserMethod<unknown[], CstNode>
  macroVariableDefinition!: ParserMethod<unknown[], CstNode>
  macroPrimitive!: ParserMethod<unknown[], CstNode>
  macroCommentPrimitive!: ParserMethod<unknown[], CstNode>
  macroParameterizedPrimitive!: ParserMethod<unknown[], CstNode>
  macroCommentPart!: ParserMethod<unknown[], CstNode>
  macroParameter!: ParserMethod<unknown[], CstNode>
  expression!: ParserMethod<unknown[], CstNode>
  term!: ParserMethod<unknown[], CstNode>
  factor!: ParserMethod<unknown[], CstNode>

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

    /** `<Command> = <Function code command>|<Extended command>`
     *
     * Example:
     * ```
     * G04 Beginning of the file*
     * %FSLAX65Y26*%
     * %LPD*%
     * %MOIN*%
     * %ADD10C,0.000070*%
     * X123500Y001250D02*
     * …
     * M02*
     * ```
     */
    this.RULE("command", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.functionCodeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.extendedCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.apertureMacroCommand) }, // Aperture Macros aput here to allow the closing % to return to the default mode for the rest of the file.
      ])
    })

    /** `<Data block> = {<Character>}*`
     *
     * Example:
     * ```
     * G01*
     * X50000Y3200D01*
     * 1,1,$1,$2,$3*
     * $4=$1x0.75*
     * ```
     */
    this.RULE("extendedCommandDataBlock", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.formatSpecificationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.unitsCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.apertureDefinitionCommand) },
        // { ALT: (): CstNode => this.SUBRULE(this.apertureMacroCommand) }, (moved out)
        { ALT: (): CstNode => this.SUBRULE(this.polarityCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.mirroringCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.rotationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.scalingCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.stepRepeatOpenCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.stepRepeatCloseCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.blockApertureOpenCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.blockApertureCloseCommand) },
      ])
      this.CONSUME(DefaultTokens.Star)
    })

    /** `<Extended command> = %<Data block>{<Data block>}%`
     *
     * Example:
     * ```
     * %FSLAX24Y24*%
     * %AMDONUTFIX*1,1,0.100,0,0*1,0,0.080,0,0*%
     * ```
     */
    this.RULE("extendedCommand", () => {
      this.CONSUME(DefaultTokens.Percent)
      // There can be only one extended command between each pair of ‘%’ delimiters. It is allowed to put line separators between data blocks of a single command. - Gerber File Format Specification 2021-02, section 3.5.3
      // But from experience, some files have more than 1 data block(s) in a single extended command, so we will allow that as well since it doesn't cause any issues.
      this.AT_LEAST_ONE(() => {
        this.SUBRULE(this.extendedCommandDataBlock)
      })
      this.CONSUME2(DefaultTokens.Percent)
    })

    this.RULE("functionCodeCommand", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.commentCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.endCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.inlineInterpolateOperationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.quadrantSingleCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.quadrantMultiCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.regionStartCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.regionEndCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.g54ToolChangeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.dCodeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.operationCommand) },
      ])
      this.CONSUME(DefaultTokens.Star)
    })

    // <FS command> = FSLAX<Format>Y<Format>*
    // <Format> = <digit><digit>
    this.RULE("formatSpecificationCommand", () => {
      this.CONSUME(DefaultTokens.FS)
      // It is specified by the "I" in the FS command, after the "L" or "T" for leading or trailing. (The normal absolute notation is specified by ‘A’ in the FS command.)
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.L) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.T) }])
      this.OR2([
        // Absolute notation is the default and is specified by the "A" in the FS command. It is also specified by the "A" in the G90 command, but this is deprecated since revision I1 from December 2012.
        { ALT: (): IToken => this.CONSUME(DefaultTokens.A) },
        // Incremental Notation is deprecated since revision I1 from December 2012.
        { ALT: (): IToken => this.CONSUME(DefaultTokens.I) },
      ])
      this.CONSUME(DefaultTokens.X)
      this.CONSUME(DefaultTokens.Number)
      this.CONSUME(DefaultTokens.Y)
      this.CONSUME2(DefaultTokens.Number)
    })

    // <MO command> = MO(IN|MM)*
    this.RULE("unitsCommand", () => {
      this.CONSUME(DefaultTokens.MO)
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.MM) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.IN) }])
    })

    // <AD command> = ADD<D-code number><Template>[,<Modifiers set>]*
    this.RULE("apertureDefinitionCommand", () => {
      this.CONSUME(DefaultTokens.AD)
      this.CONSUME(DefaultTokens.Dnn)
      this.CONSUME(DefaultTokens.Name)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.Comma)
        this.SUBRULE(this.modifiersSet)
      })
    })

    // <Modifiers set> = <Modifier>{X<Modifier>}
    this.RULE("modifiersSet", () => {
      this.CONSUME(DefaultTokens.Number)
      this.MANY(() => {
        this.CONSUME(DefaultTokens.X)
        this.CONSUME2(DefaultTokens.Number)
      })
    })

    // START MACRO SECTION

    // <AM command> = AM<Aperture macro name>*<Macro content>
    // <Macro content> = {{<Variable definition>*}{<Primitive>*}}
    // <Variable definition> = $K=<Arithmetic expression>
    // <Primitive> = <Primitive code>,<Modifier>{,<Modifier>}|<Comment>
    // <Modifier> = $M|< Arithmetic expression>
    // <Comment> = 0 <Text>
    this.RULE("apertureMacroCommand", () => {
      this.CONSUME(DefaultTokens.Percent)
      this.CONSUME(DefaultTokens.AM)
      this.CONSUME(MacroTokens.Name)
      this.CONSUME(MacroTokens.Star)
      this.AT_LEAST_ONE(() => {
        this.SUBRULE(this.macroBlock)
      })
      this.CONSUME2(MacroTokens.Percent)
    })

    this.RULE("macroBlock", () => {
      this.OR([{ ALT: (): CstNode => this.SUBRULE(this.macroVariableDefinition) }, { ALT: (): CstNode => this.SUBRULE(this.macroPrimitive) }])
    })

    // <Variable definition> = $K=<Arithmetic expression>
    this.RULE("macroVariableDefinition", () => {
      this.CONSUME(MacroTokens.MacroVariable)
      this.CONSUME(MacroTokens.Equals)
      this.SUBRULE(this.expression)
      this.CONSUME(MacroTokens.Star)
    })

    // <Primitive> = <Primitive code>,<Modifier>{,<Modifier>}|<Comment>
    this.RULE("macroPrimitive", () => {
      this.OR([
        {
          GATE: (): boolean => this.LA(1).image === "0" && this.LA(2).image === " ",
          ALT: (): CstNode => this.SUBRULE(this.macroCommentPrimitive),
        },
        { ALT: (): CstNode => this.SUBRULE(this.macroParameterizedPrimitive) },
      ])
    })

    this.RULE("macroCommentPrimitive", () => {
      this.CONSUME(MacroTokens.UnsignedNumber)
      this.CONSUME(CommentTokens.String)
      this.CONSUME3(MacroTokens.Star)
    })

    this.RULE("macroParameterizedPrimitive", () => {
      this.CONSUME(MacroTokens.UnsignedNumber)
      this.AT_LEAST_ONE(() => {
        this.SUBRULE(this.macroParameter)
      })
      this.CONSUME(MacroTokens.Star)
    })

    this.RULE("macroCommentPart", () => {})

    this.RULE("macroParameter", () => {
      this.CONSUME(MacroTokens.Comma)
      this.SUBRULE(this.expression)
    })

    this.RULE("expression", () => {
      this.SUBRULE(this.term)
      this.MANY(() => {
        this.CONSUME(MacroTokens.AddSubOperator)
        this.SUBRULE2(this.term)
      })
    })

    this.RULE("term", () => {
      this.SUBRULE(this.factor)
      this.MANY(() => {
        this.CONSUME(MacroTokens.MulDivOperator)
        this.SUBRULE2(this.factor)
      })
    })

    this.RULE("factor", () => {
      this.OR([
        {
          ALT: (): void => {
            this.CONSUME(MacroTokens.LParen)
            this.SUBRULE(this.expression)
            this.CONSUME(MacroTokens.RParen)
          },
        },
        { ALT: (): IToken => this.CONSUME(MacroTokens.MacroVariable) },
        { ALT: (): IToken => this.CONSUME(MacroTokens.UnsignedNumber) },
      ])
    })

    // END MACRO SECTION

    // <LP command> = LP(C|D)*
    this.RULE("polarityCommand", () => {
      this.CONSUME(DefaultTokens.LP)
      this.CONSUME(DefaultTokens.Name)
    })

    // <LM command> = LM(N|X|Y|XY)*
    this.RULE("mirroringCommand", () => {
      this.CONSUME(DefaultTokens.LM)
      this.CONSUME(DefaultTokens.Name)
    })

    // <LR command> = LR<Rotation>*
    this.RULE("rotationCommand", () => {
      this.CONSUME(DefaultTokens.LR)
      this.CONSUME(DefaultTokens.Number)
    })

    // <LS command> = LS<Scale>*
    this.RULE("scalingCommand", () => {
      this.CONSUME(DefaultTokens.LS)
      this.CONSUME(DefaultTokens.Number)
    })

    // <SR open> = %SRX<Repeats>Y<Repeats>I<Step>J<Step>*%
    this.RULE("stepRepeatOpenCommand", () => {
      this.CONSUME(DefaultTokens.SR)
      this.CONSUME(DefaultTokens.X)
      this.CONSUME(DefaultTokens.Number)
      this.CONSUME(DefaultTokens.Y)
      this.CONSUME2(DefaultTokens.Number)
      this.CONSUME(DefaultTokens.I)
      this.CONSUME3(DefaultTokens.Number)
      this.CONSUME(DefaultTokens.J)
      this.CONSUME4(DefaultTokens.Number)
    })

    // <SR close> = %SR*%
    this.RULE("stepRepeatCloseCommand", () => {
      this.CONSUME(DefaultTokens.SR)
    })

    // <AB open> = %ABD<integer>*% (The integer must be ≥ 10.)
    this.RULE("blockApertureOpenCommand", () => {
      this.CONSUME(DefaultTokens.AB)
      this.CONSUME(DefaultTokens.Dnn)
    })

    // <AB close> = %AB*%
    this.RULE("blockApertureCloseCommand", () => {
      this.CONSUME(DefaultTokens.AB)
    })

    // <G04 command> = G04<Comment content>*
    this.RULE("commentCommand", () => {
      this.CONSUME(DefaultTokens.G04)
      this.CONSUME(CommentTokens.String)
    })

    // <M02 command> = M02*
    this.RULE("endCommand", () => {
      // this.CONSUME(DefaultTokens.M02)
      this.OR([
        { ALT: (): IToken => this.CONSUME(DefaultTokens.M02) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.M00) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.M01) },
      ])
    })

    this.RULE("inlineInterpolateOperationCommand", () => {
      this.OR([
        { ALT: (): IToken => this.CONSUME(DefaultTokens.G01) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.G02) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.G03) },
      ])
      this.OPTION(() => {
        this.SUBRULE(this.coordinateData)
      })
      this.OPTION2(() => {
        this.SUBRULE(this.operationCode)
      })
    })

    this.RULE("operationCode", () => {
      this.OR([
        { ALT: (): IToken => this.CONSUME(DefaultTokens.D01) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.D02) },
        { ALT: (): IToken => this.CONSUME(DefaultTokens.D03) },
      ])
    })

    // <G74 command> = G74*
    this.RULE("quadrantSingleCommand", () => {
      this.CONSUME(DefaultTokens.G74)
    })

    // <G75 command> = G75*
    this.RULE("quadrantMultiCommand", () => {
      this.CONSUME(DefaultTokens.G75)
    })

    // <G36 command> = G36*
    this.RULE("regionStartCommand", () => {
      this.CONSUME(DefaultTokens.G36)
    })

    // <G37 command> = G37*
    this.RULE("regionEndCommand", () => {
      this.CONSUME(DefaultTokens.G37)
    })

    this.RULE("g54ToolChangeCommand", () => {
      this.CONSUME(DefaultTokens.G54)
      this.CONSUME(DefaultTokens.Dnn)
    })

    // <Dnn command> = D<D-code number>*
    this.RULE("dCodeCommand", () => {
      this.CONSUME(DefaultTokens.Dnn)
    })

    this.RULE("operationCommand", () => {
      this.OR([
        {
          GATE: (): boolean => {
            const tokenType = this.LA(1).tokenType
            return (
              tokenType === DefaultTokens.X ||
              tokenType === DefaultTokens.Y ||
              tokenType === DefaultTokens.I ||
              tokenType === DefaultTokens.J ||
              tokenType === DefaultTokens.A
            )
          },
          ALT: (): void => {
            this.SUBRULE(this.coordinateData)
            this.OPTION(() => {
              this.SUBRULE(this.operationCode)
            })
          },
        },
        {
          ALT: (): void => {
            this.SUBRULE2(this.operationCode)
          },
        },
      ])
    })

    // this.RULE("unknownWordCommand", () => {
    //   this.CONSUME(DefaultTokens.UnknownWordCommand)
    // })

    this.RULE("coordinateData", () => {
      this.MANY1(() => {
        this.SUBRULE(this.coordinateField)
      })
    })

    // <Coordinates> = [X<Number>][Y<Number>][I<Number>][J<Number>]
    this.RULE("coordinateField", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.xCoordinate) },
        { ALT: (): CstNode => this.SUBRULE(this.yCoordinate) },
        { ALT: (): CstNode => this.SUBRULE(this.iCoordinate) },
        { ALT: (): CstNode => this.SUBRULE(this.jCoordinate) },
        { ALT: (): CstNode => this.SUBRULE(this.aCoordinate) },
      ])
    })

    this.RULE("xCoordinate", () => {
      this.CONSUME(DefaultTokens.X)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("yCoordinate", () => {
      this.CONSUME(DefaultTokens.Y)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("iCoordinate", () => {
      this.CONSUME(DefaultTokens.I)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("jCoordinate", () => {
      this.CONSUME(DefaultTokens.J)
      this.CONSUME(DefaultTokens.Number)
    })

    this.RULE("aCoordinate", () => {
      this.CONSUME(DefaultTokens.A)
      this.CONSUME(DefaultTokens.Number)
    })

    this.performSelfAnalysis()
  }
}

export const parser = new GerberParser()
export const productions: Record<string, Rule> = parser.getGAstProductions()

const GENERATEDTS = false
if (GENERATEDTS) {
  const dtsString = generateCstDts(productions)
  console.log(dtsString)
}

const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

type Tool = Symbols.StandardSymbol | Symbols.MacroSymbol
type Units = "mm" | "inch"
type ArcDirection = "cw" | "ccw"

interface Point {
  x: number
  y: number
}

interface Location {
  startPoint: Point
  endPoint: Point
  arcOffsets: { i: number; j: number; a: number }
  stepRepeat: StepRepeatDefinition
}

interface StepRepeatDefinition {
  x: number
  y: number
  i: number
  j: number
}

interface BlockContext {
  code: string
  shapes: Shapes.Shape[]
}

interface VisitorState {
  units: Units
  coordinateFormat: Format
  zeroSuppression: ZeroSuppression
  done: boolean
  currentPoint: Point
  currentToolCode: string | undefined
}

const defaultTool: Tool = new Symbols.NullSymbol({ id: "274x_NULL" })

export class GerberToTreeVisitor extends BaseCstVisitor {
  public readonly image: ImageTree = {
    type: IMAGE,
    units: "inch",
    children: [],
  }

  public readonly macroDefinitions: Partial<Record<string, MacroBlock[]>> = {}
  public readonly toolDefinitions: Partial<Record<string, Tool>> = {}

  public state: VisitorState = {
    units: "inch",
    coordinateFormat: [2, 4],
    zeroSuppression: LEADING,
    done: false,
    currentPoint: { x: 0, y: 0 },
    currentToolCode: undefined,
  }

  private currentTransform: { polarity: Polarity; mirror: Mirroring; rotation: number; scale: number } = {
    polarity: DARK,
    mirror: "noMirror",
    rotation: 0,
    scale: 1,
  }

  private currentSurface: Shapes.Surface | undefined
  private arcDirection: ArcDirection | undefined
  private ambiguousArcCenter = false
  private regionMode = false
  private defaultGraphic: GraphicType | undefined
  private readonly blockStack: BlockContext[] = []
  private readonly stepRepeatStack: Shapes.StepAndRepeat[] = []

  constructor() {
    super()
    this.validateVisitor()
  }

  program(ctx: cst.ProgramCstChildren): ImageTree {
    ctx.command?.map(this.visit, this)

    if (!this.state.done) {
      this.endCommand({})
    }

    return this.image
  }

  command(ctx: cst.CommandCstChildren): void {
    this.visitChildren(ctx)
  }

  extendedCommandDataBlock(ctx: cst.ExtendedCommandDataBlockCstChildren): void {
    this.visitChildren(ctx)
  }

  extendedCommand(ctx: cst.ExtendedCommandCstChildren): void {
    this.visitChildren(ctx)
  }

  functionCodeCommand(ctx: cst.FunctionCodeCommandCstChildren): void {
    this.visitChildren(ctx)
  }

  formatSpecificationCommand(ctx: cst.FormatSpecificationCommandCstChildren): void {
    const xDigits = ctx.Number?.[0]?.image ?? ""
    const parsedFormat = this.parseCoordinateDigits(xDigits)

    if (!parsedFormat) return

    this.state.coordinateFormat = parsedFormat
    this.state.zeroSuppression = ctx.T ? TRAILING : LEADING
  }

  unitsCommand(ctx: cst.UnitsCommandCstChildren): void {
    this.state.units = ctx.MM ? "mm" : "inch"
    this.image.units = this.state.units
  }

  apertureDefinitionCommand(ctx: cst.ApertureDefinitionCommandCstChildren): void {
    const codeToken = ctx.Dnn[0].image
    const templateToken = ctx.Name[0].image
    // if (!codeToken || !templateToken) return

    const code = codeToken.slice(1)
    const params = ctx.modifiersSet ? (this.visit(ctx.modifiersSet[0]) as string[]) : []
    const parsed = this.parseApertureDefinition(templateToken, params)
    this.toolDefinitions[code] = this.createTool(code, parsed.shape, parsed.hole)
    this.state.currentToolCode = code
  }

  modifiersSet(ctx: cst.ModifiersSetCstChildren): string[] {
    return ctx.Number.map((token) => token.image)
  }

  apertureMacroCommand(ctx: cst.ApertureMacroCommandCstChildren): void {
    const name = ctx.Name?.[0]?.image
    if (!name) return

    const blockNodes = (ctx.macroBlock as unknown as CstNode[] | undefined) ?? []
    this.macroDefinitions[name] = blockNodes
      .map((node) => this.visit(node) as MacroBlock | undefined)
      .filter((block): block is MacroBlock => typeof block !== "undefined")
  }

  polarityCommand(ctx: cst.PolarityCommandCstChildren): void {
    if (this.currentSurface) {
      this.flushCurrentSurface()
    }
    const value = ctx.Name?.[0]?.image?.toUpperCase() ?? ""
    this.currentTransform.polarity = value === "C" ? "clear" : DARK
  }

  mirroringCommand(ctx: cst.MirroringCommandCstChildren): void {
    const value = ctx.Name?.[0]?.image?.toUpperCase() ?? "N"
    this.currentTransform.mirror = value === "X" ? "x" : value === "Y" ? "y" : value === "XY" ? "xy" : "noMirror"
  }

  rotationCommand(ctx: cst.RotationCommandCstChildren): void {
    const rotation = Number(ctx.Number?.[0]?.image)
    if (Number.isFinite(rotation)) {
      this.currentTransform.rotation = rotation
    }
  }

  scalingCommand(ctx: cst.ScalingCommandCstChildren): void {
    const scaling = Number(ctx.Number?.[0]?.image)
    if (Number.isFinite(scaling)) {
      this.currentTransform.scale = scaling
    }
  }

  stepRepeatOpenCommand(ctx: cst.StepRepeatOpenCommandCstChildren): void {
    this.flushCurrentSurface()
    const values = ctx.Number?.map((token) => Number(token.image)) ?? []
    const [x = 1, y = 1, i = 0, j = 0] = values
    if (x <= 1 && y <= 1 && i === 0 && j === 0) return

    this.stepRepeatStack.push(
      new Shapes.StepAndRepeat({
        shapes: [],
        repeats: new Array(x * y).fill(0).map((_, index) => ({
          datum: vec2.fromValues(i * Math.floor(index / y), j * (index % y)),
          rotation: 0,
          mirror_x: 0,
          mirror_y: 0,
          scale: 1,
        })),
      }),
    )
  }

  stepRepeatCloseCommand(_ctx: cst.StepRepeatCloseCommandCstChildren): void {
    this.flushCurrentSurface()
    const stepRepeat = this.stepRepeatStack.pop()
    if (stepRepeat) {
      this.emitShape(stepRepeat)
    }
  }

  blockApertureOpenCommand(ctx: cst.BlockApertureOpenCommandCstChildren): void {
    const codeToken = ctx.Dnn?.[0]?.image
    const code = codeToken?.slice(1)
    if (!code) return
    this.blockStack.push({ code, shapes: [] })
  }

  blockApertureCloseCommand(_ctx: cst.BlockApertureCloseCommandCstChildren): void {
    this.flushCurrentSurface()
    const block = this.blockStack.pop()
    if (!block) return

    this.toolDefinitions[block.code] = new Symbols.MacroSymbol({
      id: `274x_D${block.code}`,
      shapes: block.shapes,
      flatten: false,
    })
  }

  commentCommand(_ctx: cst.CommentCommandCstChildren): void {}

  endCommand(_ctx: cst.EndCommandCstChildren): void {
    this.flushCurrentSurface()
    while (this.stepRepeatStack.length > 0) {
      this.stepRepeatCloseCommand({})
    }
    this.state.done = true
  }

  inlineInterpolateOperationCommand(ctx: cst.InlineInterpolateOperationCommandCstChildren): void {
    this.setInterpolationMode(ctx.G01 ? LINE : ctx.G02 ? CW_ARC : CCW_ARC)
    const coordinates = this.readCoordinates(ctx)
    const dCode = this.readDCode(ctx)
    this.executeGraphic(coordinates, dCode)
  }

  operationCode(ctx: cst.OperationCodeCstChildren): number {
    if (ctx.D01) return 1
    if (ctx.D02) return 2
    if (ctx.D03) return 3
    return 0
  }

  quadrantSingleCommand(_ctx: cst.QuadrantSingleCommandCstChildren): void {
    this.ambiguousArcCenter = true
  }

  quadrantMultiCommand(_ctx: cst.QuadrantMultiCommandCstChildren): void {
    this.ambiguousArcCenter = false
  }

  regionStartCommand(_ctx: cst.RegionStartCommandCstChildren): void {
    this.regionMode = true
  }

  regionEndCommand(_ctx: cst.RegionEndCommandCstChildren): void {
    this.flushCurrentSurface()
    this.regionMode = false
  }

  g54ToolChangeCommand(ctx: cst.G54ToolChangeCommandCstChildren): void {
    const code = ctx.Dnn?.[0]?.image?.slice(1)
    if (code) this.state.currentToolCode = code
  }

  dCodeCommand(ctx: cst.DCodeCommandCstChildren): void {
    const image = ctx.Dnn?.[0]?.image
    if (!image) return

    const code = Number(image.slice(1))
    if (!Number.isFinite(code)) return
    if (code >= 10) {
      this.state.currentToolCode = String(code)
      return
    }

    this.executeGraphic(this.createEmptyCoordinates(), code)
  }

  operationCommand(ctx: cst.OperationCodeCstChildren): void {
    const coordinates = this.readCoordinates(ctx)
    const dCode = this.readDCode(ctx)
    this.executeGraphic(coordinates, dCode)
  }

  // unknownWordCommand(_ctx: cst.UnknownWordCommandCstChildren): void {}

  coordinateData(ctx: cst.CoordinateDataCstChildren): GerberCoordinates {
    let coordinates = this.createEmptyCoordinates()
    const fields = (ctx.coordinateField as unknown as CstNode[] | undefined) ?? []
    for (const field of fields) {
      coordinates = this.mergeCoordinates(coordinates, this.visit(field) as GerberCoordinates)
    }
    return coordinates
  }

  coordinateField(ctx: cst.CoordinateFieldCstChildren): GerberCoordinates {
    for (const value of Object.values(ctx)) {
      if (!value) continue
      const nodes = value as unknown as CstNode[]
      if (nodes.length > 0) return this.visit(nodes[0]) as GerberCoordinates
    }
    return this.createEmptyCoordinates()
  }

  xCoordinate(ctx: cst.XCoordinateCstChildren): GerberCoordinates {
    return { x: ctx.Number?.[0]?.image }
  }

  yCoordinate(ctx: cst.YCoordinateCstChildren): GerberCoordinates {
    return { y: ctx.Number?.[0]?.image }
  }

  iCoordinate(ctx: cst.ICoordinateCstChildren): GerberCoordinates {
    return { i: ctx.Number?.[0]?.image }
  }

  jCoordinate(ctx: cst.JCoordinateCstChildren): GerberCoordinates {
    return { j: ctx.Number?.[0]?.image }
  }

  aCoordinate(ctx: cst.ACoordinateCstChildren): GerberCoordinates {
    return { a: ctx.Number?.[0]?.image }
  }

  macroBlock(ctx: cst.MacroBlockCstChildren): MacroBlock | undefined {
    for (const value of Object.values(ctx)) {
      if (!value) continue
      const nodes = value as unknown as CstNode[]
      if (nodes.length > 0) return this.visit(nodes[0]) as MacroBlock | undefined
    }
    return undefined
  }

  macroVariableDefinition(ctx: cst.MacroVariableDefinitionCstChildren): MacroBlock {
    const name = ctx.MacroVariable?.[0]?.image ?? "$1"
    const expressionNodes = (ctx.expression as unknown as CstNode[] | undefined) ?? []
    const value = expressionNodes.length > 0 ? (this.visit(expressionNodes[0]) as MacroValue) : 0
    return { type: MACRO_VARIABLE, name, value } as MacroBlock
  }

  macroPrimitive(ctx: cst.MacroPrimitiveCstChildren): MacroBlock | undefined {
    for (const value of Object.values(ctx)) {
      if (!value) continue
      const nodes = value as unknown as CstNode[]
      if (nodes.length > 0) return this.visit(nodes[0]) as MacroBlock | undefined
    }
    return undefined
  }

  macroCommentPrimitive(_ctx: cst.MacroCommentPrimitiveCstChildren): MacroBlock | undefined {
    return undefined
  }

  macroParameterizedPrimitive(ctx: cst.MacroParameterizedPrimitiveCstChildren): MacroBlock {
    const code = ctx.UnsignedNumber[0].image ?? "0"
    const parameterNodes = (ctx.macroParameter as unknown as CstNode[] | undefined) ?? []
    return {
      type: MACRO_PRIMITIVE,
      code: code as MacroPrimitiveCode,
      parameters: parameterNodes.map((node) => this.visit(node) as MacroValue),
    } as MacroBlock
  }

  macroCommentPart(_ctx: cst.MacroCommentPartCstChildren): void {}

  macroParameter(ctx: cst.MacroParameterCstChildren): MacroValue {
    const expressionNodes = (ctx.expression as unknown as CstNode[] | undefined) ?? []
    return expressionNodes.length > 0 ? (this.visit(expressionNodes[0]) as MacroValue) : 0
  }

  expression(ctx: cst.ExpressionCstChildren): MacroValue {
    const termNodes = (ctx.term as unknown as CstNode[] | undefined) ?? []
    if (termNodes.length === 0) return 0

    let left = this.visit(termNodes[0]) as MacroValue
    const operators = ctx.AddSubOperator ?? []
    for (const [index, operatorToken] of operators.entries()) {
      left = {
        left,
        operator: operatorToken.image as GerberMacroOperator,
        right: this.visit(termNodes[index + 1]) as MacroValue,
      }
    }
    return left
  }

  term(ctx: cst.TermCstChildren): MacroValue {
    const factorNodes = (ctx.factor as unknown as CstNode[] | undefined) ?? []
    if (factorNodes.length === 0) return 0

    let left = this.visit(factorNodes[0]) as MacroValue
    const operators = ctx.MulDivOperator ?? []
    for (const [index, operatorToken] of operators.entries()) {
      left = {
        left,
        operator: operatorToken.image.toLowerCase() as GerberMacroOperator,
        right: this.visit(factorNodes[index + 1]) as MacroValue,
      }
    }
    return left
  }

  factor(ctx: cst.FactorCstChildren): MacroValue {
    const expressionNodes = (ctx.expression as unknown as CstNode[] | undefined) ?? []
    if (expressionNodes.length > 0) return this.visit(expressionNodes[0]) as MacroValue
    if (ctx.MacroVariable?.[0]) return ctx.MacroVariable[0].image
    const numericToken = ctx.UnsignedNumber?.[0]
    return numericToken ? Number(numericToken.image) : 0
  }

  private readCoordinates(ctx: ParameterCtx): GerberCoordinates {
    const coordinateNodes = (ctx.coordinateData as unknown as CstNode[] | undefined) ?? []
    return coordinateNodes.reduce(
      (coordinates, node) => this.mergeCoordinates(coordinates, this.visit(node) as GerberCoordinates),
      this.createEmptyCoordinates(),
    )
  }

  private visitChildren(ctx: GerberStatementCtx): void {
    for (const value of Object.values(ctx)) {
      if (!value) continue
      for (const node of value) {
        if (typeof node === "object" && node !== null && "name" in node) {
          this.visit(node as CstNode)
        }
      }
    }
  }

  private readDCode(ctx: ParameterCtx): number | undefined {
    const operationCodeNodes = (ctx.operationCode as unknown as CstNode[] | undefined) ?? []
    if (operationCodeNodes.length === 0) return undefined
    return this.visit(operationCodeNodes[operationCodeNodes.length - 1]) as number
  }

  private executeGraphic(coordinates: GerberCoordinates, dCode: number | undefined): void {
    const location = this.advanceLocation(coordinates)
    const graphic = this.graphicFromDCode(dCode) ?? this.defaultGraphic

    if (graphic === MOVE) {
      this.flushCurrentSurface()
      return
    }

    if (graphic === SHAPE) {
      this.flushCurrentSurface()
      this.emitShape(
        new Shapes.Pad({
          symbol: this.currentTool(),
          x: location.endPoint.x,
          y: location.endPoint.y,
          rotation: this.currentTransform.rotation,
          mirror_x: this.currentTransform.mirror === "x" || this.currentTransform.mirror === "xy" ? 1 : 0,
          mirror_y: this.currentTransform.mirror === "y" || this.currentTransform.mirror === "xy" ? 1 : 0,
          resize_factor: this.currentTransform.scale,
          polarity: this.currentTransform.polarity === DARK ? 1 : 0,
        }),
      )
      return
    }

    if (graphic !== SEGMENT) {
      return
    }

    if (this.regionMode) {
      if (!this.currentSurface) {
        this.currentSurface = new Shapes.Surface({
          polarity: this.currentTransform.polarity === DARK ? 1 : 0,
        }).addContour(
          new Shapes.Contour({
            xs: location.startPoint.x,
            ys: location.startPoint.y,
          }),
        )
      }

      if (!this.arcDirection) {
        this.currentSurface.contours[0].addSegment(
          new Shapes.Contour_Line_Segment({
            x: location.endPoint.x,
            y: location.endPoint.y,
          }),
        )
        return
      }

      const center = this.getArcCenter(location)
      this.currentSurface.contours[0].addSegment(
        new Shapes.Contour_Arc_Segment({
          x: location.endPoint.x,
          y: location.endPoint.y,
          xc: center.x,
          yc: center.y,
          clockwise: this.arcDirection === "cw" ? 1 : 0,
        }),
      )
      return
    }

    const tool = this.currentTool()
    if (tool.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
      return
    }

    if (!this.arcDirection) {
      this.emitShape(
        new Shapes.Line({
          symbol: tool,
          polarity: this.currentTransform.polarity === DARK ? 1 : 0,
          xs: location.startPoint.x,
          ys: location.startPoint.y,
          xe: location.endPoint.x,
          ye: location.endPoint.y,
        }),
      )
      return
    }

    const center = this.getArcCenter(location)
    this.emitShape(
      new Shapes.Arc({
        symbol: tool,
        polarity: this.currentTransform.polarity === DARK ? 1 : 0,
        xs: location.startPoint.x,
        ys: location.startPoint.y,
        xe: location.endPoint.x,
        ye: location.endPoint.y,
        xc: center.x,
        yc: center.y,
        clockwise: this.arcDirection === "cw" ? 1 : 0,
      }),
    )
  }

  private setInterpolationMode(mode: typeof LINE | typeof CW_ARC | typeof CCW_ARC): void {
    if (mode === LINE) {
      this.arcDirection = undefined
    } else if (mode === CW_ARC) {
      this.arcDirection = "cw"
    } else {
      this.arcDirection = "ccw"
    }
    this.defaultGraphic = SEGMENT
  }

  private currentTool(): Tool {
    return typeof this.state.currentToolCode === "string" ? (this.toolDefinitions[this.state.currentToolCode] ?? defaultTool) : defaultTool
  }

  private advanceLocation(coordinates: GerberCoordinates): Location {
    const startPoint = { ...this.state.currentPoint }
    const x0 = this.parseCoordinate(coordinates.x0, startPoint.x)
    const y0 = this.parseCoordinate(coordinates.y0, startPoint.y)
    const endPoint = {
      x: this.parseCoordinate(coordinates.x, x0),
      y: this.parseCoordinate(coordinates.y, y0),
    }
    this.state.currentPoint = endPoint
    return {
      startPoint,
      endPoint,
      arcOffsets: {
        i: this.parseCoordinate(coordinates.i, 0),
        j: this.parseCoordinate(coordinates.j, 0),
        a: this.parseCoordinate(coordinates.a, 0),
      },
      stepRepeat: { x: 0, y: 0, i: 1, j: 1 },
    }
  }

  private parseCoordinate(coordinate: string | undefined, defaultValue: number): number {
    if (typeof coordinate !== "string") return defaultValue
    if (coordinate.includes(".") || coordinate === "0") return Number(coordinate)

    const [integerPlaces, decimalPlaces] = this.state.coordinateFormat
    const digits = integerPlaces + decimalPlaces
    const [sign, signlessCoordinate] =
      coordinate.startsWith("+") || coordinate.startsWith("-") ? [coordinate[0], coordinate.slice(1)] : ["+", coordinate]
    const padded = this.state.zeroSuppression === TRAILING ? signlessCoordinate.padEnd(digits, "0") : signlessCoordinate.padStart(digits, "0")
    const leading = padded.slice(0, padded.length - decimalPlaces)
    const trailing = padded.slice(padded.length - decimalPlaces)
    return Number(`${sign}${leading}.${trailing}`)
  }

  private flushCurrentSurface(): void {
    if (!this.currentSurface) return
    this.emitShape(this.currentSurface)
    this.currentSurface = undefined
  }

  private emitShape(shape: Shapes.Shape): void {
    this.convertShapeUnits(shape, this.state.units)
    if (this.stepRepeatStack.length > 0) {
      this.stepRepeatStack[this.stepRepeatStack.length - 1].shapes.push(shape)
      return
    }
    if (this.blockStack.length > 0) {
      this.blockStack[this.blockStack.length - 1].shapes.push(shape)
      return
    }
    this.image.children.push(shape)
  }

  private convertShapeUnits(shape: Shapes.Shape, units: Units): void {
    shape.units = units
    if (shape.type === Shapes.StepAndRepeat.prototype.type) {
      shape.shapes.map((child) => this.convertShapeUnits(child, units))
      return
    }
    if (shape.type === Shapes.Pad.prototype.type && shape.symbol.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
      shape.symbol.shapes.map((child) => this.convertShapeUnits(child, units))
      return
    }
    if (
      (shape.type === Shapes.Pad.prototype.type || shape.type === Shapes.Line.prototype.type || shape.type === Shapes.Arc.prototype.type) &&
      shape.symbol.type === SymbolTypeIdentifier.SYMBOL_DEFINITION
    ) {
      shape.symbol.units = units
    }
  }

  private getArcCenter(location: Location): Point {
    if (this.ambiguousArcCenter && this.arcDirection) {
      return getAmbiguousArcCenter(location, this.arcDirection)
    }
    return {
      x: location.startPoint.x + location.arcOffsets.i,
      y: location.startPoint.y + location.arcOffsets.j,
    }
  }

  private parseCoordinateDigits(digits: string): Format | undefined {
    if (!/^\d{2}$/.test(digits)) return undefined
    const integer = Number(digits[0])
    const decimal = Number(digits[1])
    return Number.isFinite(integer) && Number.isFinite(decimal) ? [integer, decimal] : undefined
  }

  private parseApertureDefinition(
    template: string,
    params: string[],
  ): { shape: SimpleShape | { type: typeof MACRO_SHAPE; name: string; variableValues: number[] }; hole: HoleShape | undefined } {
    const tag = template.toUpperCase()
    const values = params.map((value) => Number(value)).filter((value) => Number.isFinite(value))

    if (tag === "C") {
      return {
        shape: { type: CIRCLE, diameter: values[0] ?? 0 },
        hole: this.holeFromNumbers(values.slice(1)),
      }
    }

    if (tag === "R" || tag === "O") {
      return {
        shape: { type: tag === "R" ? RECTANGLE : OBROUND, xSize: values[0] ?? 0, ySize: values[1] ?? 0 },
        hole: this.holeFromNumbers(values.slice(2)),
      }
    }

    if (tag === "P") {
      return {
        shape: { type: POLYGON, diameter: values[0] ?? 0, vertices: values[1] ?? 0, rotation: values[2] ?? 0 },
        hole: this.holeFromNumbers(values.slice(3)),
      }
    }

    return {
      shape: {
        type: MACRO_SHAPE,
        name: template,
        variableValues: values,
      },
      hole: undefined,
    }
  }

  private holeFromNumbers(values: number[]): HoleShape | undefined {
    if (values.length === 0) return undefined
    if (values.length === 1) {
      return { type: CIRCLE, diameter: values[0] }
    }
    return { type: RECTANGLE, xSize: values[0], ySize: values[1] }
  }

  private createTool(
    code: string,
    shape: SimpleShape | { type: typeof MACRO_SHAPE; name: string; variableValues: number[] },
    hole: HoleShape | undefined,
  ): Tool {
    if (shape.type === MACRO_SHAPE) {
      return createMacro({
        type: "macroTool",
        name: shape.name,
        dcode: code,
        macro: this.macroDefinitions[shape.name] ?? [],
        variableValues: shape.variableValues,
      } as MacroTool)
    }

    if (shape.type === CIRCLE) {
      return new Symbols.RoundSymbol({
        id: `274x_D${code}`,
        outer_dia: shape.diameter,
        inner_dia: hole?.type === CIRCLE ? hole.diameter : 0,
      })
    }

    if (shape.type === RECTANGLE) {
      return new Symbols.RectangleSymbol({
        id: `274x_D${code}`,
        width: shape.xSize,
        height: shape.ySize,
        inner_dia: hole?.type === CIRCLE ? hole.diameter : 0,
      })
    }

    if (shape.type === OBROUND) {
      return new Symbols.OvalSymbol({
        id: `274x_D${code}`,
        width: shape.xSize,
        height: shape.ySize,
        inner_dia: hole?.type === CIRCLE ? hole.diameter : 0,
      })
    }

    return new Symbols.PolygonSymbol({
      id: `274x_D${code}`,
      outer_dia: shape.diameter,
      corners: shape.vertices,
      inner_dia: hole?.type === CIRCLE ? hole.diameter : 0,
      line_width: 0,
      angle: (shape.rotation ?? 0) * -1,
    })
  }

  private mergeCoordinates(base: GerberCoordinates, next: GerberCoordinates): GerberCoordinates {
    return {
      x0: next.x0 ?? base.x0,
      y0: next.y0 ?? base.y0,
      x: next.x ?? base.x,
      y: next.y ?? base.y,
      i: next.i ?? base.i,
      j: next.j ?? base.j,
      a: next.a ?? base.a,
    }
  }

  private createEmptyCoordinates(): GerberCoordinates {
    return { x0: undefined, y0: undefined, x: undefined, y: undefined, i: undefined, j: undefined, a: undefined }
  }

  private graphicFromDCode(code: number | undefined): GraphicType | undefined {
    if (code === 1) return SEGMENT
    if (code === 2) return MOVE
    if (code === 3) return SHAPE
    return undefined
  }
}

export function parseGerberWithChevrotain(file: string): ImageTree {
  const lexingResult = GerberLexer.tokenize(file)
  if (lexingResult.errors.length > 0) {
    throw new Error(
      `Gerber lexing failed with ${lexingResult.errors.length} error(s):\n${lexingResult.errors
        .map((err) => `- Line ${err.line}, Column ${err.column}: ${err.message}`)
        .join("\n")}`,
    )
  }

  parser.input = lexingResult.tokens
  const cst = parser.program()
  if (parser.errors.length > 0) {
    throw new Error(
      `Gerber parse failed with ${parser.errors.length} error(s):\n${parser.errors.map((err) => `- ${err.message} => Cause: ${err.cause}, Token: ${JSON.stringify(err.token)}, Context: ${JSON.stringify(err.context)}, Stack: ${err.stack}`).join("\n")}`,
    )
  }

  const visitor = new GerberToTreeVisitor()
  return visitor.visit(cst) as ImageTree
}
