import * as Shapes from "@src/data/shape/shape"
import * as Symbols from "@src/data/shape/symbol/symbol"
import { SymbolTypeIdentifier } from "@src/types"
import {
  type CstNode,
  type CstNodeLocation,
  CstParser,
  createToken,
  generateCstDts,
  type IToken,
  Lexer,
  type ParserMethod,
  type Rule,
} from "chevrotain"
import { vec2 } from "gl-matrix"
import { getAmbiguousArcCenter } from "./arcMath"
import * as Constants from "./constants"
import type * as cst from "./gerbercst"
import type * as Types from "./types"
import type { ArcDirection, GerberMacroOperator, MacroPrimitiveCode, MacroValue } from "./types"

const DefaultTokens = {
  WhiteSpace: createToken({ name: "WhiteSpace", pattern: /[ \t]+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true, group: Lexer.SKIPPED }),

  // Primative tokens
  Percent: createToken({ name: "Percent", pattern: /%/ }),
  Star: createToken({ name: "Star", pattern: /\*/ }),
  Comma: createToken({ name: "Comma", pattern: /,/ }),
  Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?\d*|\.\d+)/ }),

  // Names consist of upper- or lower-case letters, underscores (‘_’), dots (‘.’), a dollar sign (‘$’) and digits. The first character cannot be a digit. Name = [a-zA-Z_.$]{[a-zA-Z_.0-9]+}
  // Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/ }),
  // Strings are made up of all valid characters except the reserved characters CR, LF, ‘%’ and ‘*’. [a-zA-Z0-9_+-/!?<>”’(){}.\|&@# ,;$:=]+
  // String: createToken({ name: "String", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ,;$:=]+/ }),

  // FS Format specification. Sets the coordinate format, e.g. the number of decimals.
  FS: createToken({ name: "FS", pattern: /FS/i }),
  // MO Mode. Sets the unit to inch or mm.
  MO: createToken({ name: "MO", pattern: /MO(IN|MM)/i }),
  // AD Aperture define. Defines a template based aperture and assigns a D code to it.
  AD: createToken({ name: "AD", pattern: /ADD\d{2,}/i, push_mode: "NameMode" }),
  // AM Aperture macro. Defines a macro aperture template.
  AM: createToken({ name: "AM", pattern: /AM/i, push_mode: "MacroMode" }),
  // AB Aperture block. Defines a block aperture and assigns a D-code to it.
  AB: createToken({ name: "AB", pattern: /AB/i }),
  // LP Load polarity. Loads the polarity object transformation parameter.
  LP: createToken({ name: "LP", pattern: /LP/i, push_mode: "NameMode" }),
  // LM Load mirror. Loads the mirror object transformation parameter.
  LM: createToken({ name: "LM", pattern: /LM/i, push_mode: "NameMode" }),
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

  // The codes D01, D02, D03 have a special function and are called operation codes. They are used together with coordinate data to form commands called operations.
  // D01 Interpolate operation. Outside a region statement D01 creates a draw or arc object using the current aperture. Inside it creates a linear or circular contoursegment. After the D01 command the current point is moved to draw/arc end point.
  D01: createToken({ name: "D01", pattern: /D0*1(?!\d)/i }),
  // D02 Move operation. D02 does not create a graphics object but moves the current point to the coordinate in the D02 command.
  D02: createToken({ name: "D02", pattern: /D0*2(?!\d)/i }),
  // D03 Flash operation. Creates a flash object with the current aperture. After the D03 command the current point is moved to the flash point.
  D03: createToken({ name: "D03", pattern: /D0*3(?!\d)/i }),
  // Dnn (nn≥10) Sets the current aperture to D code nn.
  Dnn: createToken({ name: "Dnn", pattern: /D(?:[1-9][0-9]+)/i }),

  // I Incremental Notation is deprecated since revision I1 from December 2012.
  L: createToken({ name: "L", pattern: /L(?=[AI])/i }),
  // Trailing zero omission is deprecated since revision 2015.06.
  T: createToken({ name: "T", pattern: /T(?=[AI])/i }),

  // Axis tokens for coordinates. A coordinate is a number prefixed with an axis identifier, e.g. X12.34 or Y-56.78
  X: createToken({ name: "X", pattern: /X/i }),
  Y: createToken({ name: "Y", pattern: /Y/i }),
  I: createToken({ name: "I", pattern: /I/i }),
  J: createToken({ name: "J", pattern: /J/i }),
  A: createToken({ name: "A", pattern: /A/i }),
  B: createToken({ name: "B", pattern: /B/i }),

  // TF Attribute file. Set a file attribute.
  TF: createToken({ name: "TF", pattern: /TF/i, push_mode: "AttributeMode" }),
  // TA Attribute aperture. Add an aperture attribute to the dictionary or modify it.
  TA: createToken({ name: "TA", pattern: /TA/i, push_mode: "AttributeMode" }),
  // TO Attribute object. Add an object attribute to the dictionary or modify it.
  TO: createToken({ name: "TO", pattern: /TO/i, push_mode: "AttributeMode" }),
  // TD Attribute delete. Delete one or all attributes in the dictionary
  TD: createToken({ name: "TD", pattern: /TD/i, push_mode: "AttributeMode" }),

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
  POS: createToken({ name: "POS", pattern: /POS/i }),
  NEG: createToken({ name: "NEG", pattern: /NEG/i }),
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
  IN: createToken({ name: "IN", pattern: /IN/i, push_mode: "NameMode" }), // conflics with other IN token.
  // IN Sets the name of the file image. Has no effect. It is comment. These commands can only be used once, at the beginning of the file. Use G04 for comments. See 4.14. Sometimes used.
  LN: createToken({ name: "LN", pattern: /LN/i, push_mode: "NameMode" }),
  // SR Step and repeat. Open or closes a step and repeat statement. These constructions are deprecated since revision 2016.01.
  SR: createToken({ name: "SR", pattern: /SR/i }),
  /** END OF DEPRECATED COMMANDS */
} as const

const MacroTokens = {
  WhiteSpace: createToken({ name: "MacroWhiteSpace", pattern: /[ \t]+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "MacroNewLine", pattern: /\r?\n/, line_breaks: true, group: Lexer.SKIPPED }),
  MacroVariable: createToken({ name: "MacroVariable", pattern: /\$[0-9]*[1-9][0-9]*/ }),
  // Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?\d*|\.\d+)/ }),
  UnsignedNumber: createToken({ name: "UnsignedNumber", pattern: /\d+\.?\d*|\.\d+/ }),
  Percent: createToken({ name: "Percent", pattern: /%/, pop_mode: true }),
  Star: createToken({ name: "Star", pattern: /\*/ }),
  Comma: createToken({ name: "Comma", pattern: /,/ }),
  Equals: createToken({ name: "Equals", pattern: /=/ }),
  LParen: createToken({ name: "LParen", pattern: /\(/ }),
  RParen: createToken({ name: "RParen", pattern: /\)/ }),
  AddSubOperator: createToken({ name: "AddSubOperator", pattern: /[+-]/ }),
  MulDivOperator: createToken({ name: "MulDivOperator", pattern: /[xX\\/]/ }),
  Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/ }),
  CommentPrimative: createToken({ name: "CommentPrimative", pattern: /0 /, push_mode: "CommentMode" }),
  // String: createToken({ name: "String", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ,;$:=]+/ }),
} as const

const CommentTokens = {
  // Comment: createToken({ name: "Comment", pattern: /[^*\r\n]*/i, pop_mode: true }),
  String: createToken({ name: "String", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ,;$:=]+/, pop_mode: true }),
}

const NameTokens = {
  // SPEC CORRECT REGEX
  // Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/, pop_mode: true }),
  // COMMONLY USED REGEX THAT ALLOWS FOR MORE INVALID NAMES, BUT IT'S FINE BECAUSE WE'LL JUST WARN ABOUT THEM LATER IN THE PROCESSING PIPELINE
  Name: createToken({ name: "Name", pattern: /[._a-zA-Z0-9$][-._a-zA-Z0-9]*/, pop_mode: true }),
}

const AttributeTokens = {
  Name: createToken({ name: "Name", pattern: /[._a-zA-Z$][._a-zA-Z0-9]*/ }),
  Comma: createToken({ name: "Comma", pattern: /,/, push_mode: "AttributeValueMode" }),
  Star: createToken({ name: "Star", pattern: /\*/, pop_mode: true }),
}

const AttributeValueTokens = {
  // Remove Commans from Attribute Fields, will be seperated by the parser and we don't want to allow them in attribute names or values since that can cause confusion.
  Field: createToken({ name: "Field", pattern: /[a-zA-Z0-9_+-/!?<>”’(){}.\\|&@# ;$:=]+/, pop_mode: true }),
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
  // DefaultTokens.MM,
  DefaultTokens.IN,
  DefaultTokens.L,
  DefaultTokens.T,
  DefaultTokens.X,
  DefaultTokens.Y,
  DefaultTokens.I,
  DefaultTokens.J,
  DefaultTokens.A,
  DefaultTokens.B,
  DefaultTokens.POS,
  DefaultTokens.NEG,
  DefaultTokens.Number,
  // DefaultTokens.Name,
  // DefaultTokens.String,
]

// The order of Token definitions passed to the Lexer is important. The first PATTERN to match will be chosen, not the longest.
const MacroModeTokens = [
  MacroTokens.WhiteSpace,
  MacroTokens.NewLine,
  MacroTokens.MacroVariable,
  MacroTokens.CommentPrimative,
  MacroTokens.AddSubOperator,
  MacroTokens.MulDivOperator,
  MacroTokens.UnsignedNumber,
  // MacroTokens.Number,
  MacroTokens.Percent,
  MacroTokens.Star,
  MacroTokens.Comma,
  MacroTokens.Equals,
  MacroTokens.LParen,
  MacroTokens.RParen,
  MacroTokens.Name,
]

const CommentModeTokens = [CommentTokens.String]

const NameModeTokens = [NameTokens.Name]

const AttributeModeTokens = [AttributeTokens.Name, AttributeTokens.Comma, AttributeTokens.Star]

const AttributeValueModeTokens = [AttributeValueTokens.Field]

const multiModeLexerDefinition = {
  modes: {
    DefaultMode: DefaultModeTokens,
    MacroMode: MacroModeTokens,
    CommentMode: CommentModeTokens,
    NameMode: NameModeTokens,
    AttributeMode: AttributeModeTokens,
    AttributeValueMode: AttributeValueModeTokens,
  },
  defaultMode: "DefaultMode",
}

// add onlyStart position tracking to reduce memory usage since we don't need the full position tracking for error reporting, we just need to know where the error is in the file and not the exact line and column.
export const GerberLexer = new Lexer(multiModeLexerDefinition, { positionTracking: "onlyStart" })

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
  linearInterpolationCommand!: ParserMethod<unknown[], CstNode>
  circularInterpolationClockwiseCommand!: ParserMethod<unknown[], CstNode>
  circularInterpolationCounterClockwiseCommand!: ParserMethod<unknown[], CstNode>

  commentCommand!: ParserMethod<unknown[], CstNode>
  endCommand!: ParserMethod<unknown[], CstNode>
  inlineInterpolateOperationCommand!: ParserMethod<unknown[], CstNode>
  operationCode!: ParserMethod<unknown[], CstNode>
  quadrantSingleCommand!: ParserMethod<unknown[], CstNode>
  quadrantMultiCommand!: ParserMethod<unknown[], CstNode>
  regionStartCommand!: ParserMethod<unknown[], CstNode>
  regionEndCommand!: ParserMethod<unknown[], CstNode>
  dCodeCommand!: ParserMethod<unknown[], CstNode>
  operationCommand!: ParserMethod<unknown[], CstNode>

  // unknownWordCommand!: ParserMethod<unknown[], CstNode>

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

  star!: ParserMethod<unknown[], CstNode>
  percent!: ParserMethod<unknown[], CstNode>

  // DEPRECATED COMMANDS
  prepareApertureCommand!: ParserMethod<unknown[], CstNode>
  prepareFlashCommand!: ParserMethod<unknown[], CstNode>
  inchModeCommand!: ParserMethod<unknown[], CstNode>
  metricModeCommand!: ParserMethod<unknown[], CstNode>
  optionalStopCommand!: ParserMethod<unknown[], CstNode>
  absoluteNotationCommand!: ParserMethod<unknown[], CstNode>
  incrementalNotationCommand!: ParserMethod<unknown[], CstNode>
  imagePolarityCommand!: ParserMethod<unknown[], CstNode>
  axisSelectionCommand!: ParserMethod<unknown[], CstNode>
  imageRotationCommand!: ParserMethod<unknown[], CstNode>
  mirrorImageCommand!: ParserMethod<unknown[], CstNode>
  imageOffsetCommand!: ParserMethod<unknown[], CstNode>
  scaleFactorCommand!: ParserMethod<unknown[], CstNode>
  imageNameCommand!: ParserMethod<unknown[], CstNode>
  loadNameCommand!: ParserMethod<unknown[], CstNode>

  // ATTRIBUTES
  fileAttributesCommand!: ParserMethod<unknown[], CstNode>
  apertureAttributesCommand!: ParserMethod<unknown[], CstNode>
  objectAttributesCommand!: ParserMethod<unknown[], CstNode>
  deleteAttributesCommand!: ParserMethod<unknown[], CstNode>

  constructor() {
    super(multiModeLexerDefinition, {
      recoveryEnabled: true,
      // maxLookahead: 20,
    })

    // console.log("can delete star?" , this.canTokenTypeBeDeletedInRecovery(DefaultTokens.Star))

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
        // { ALT: (): CstNode => this.SUBRULE(this.apertureMacroCommand) }, // Aperture Macros aput here to allow the closing % to return to the default mode for the rest of the file.
        { ALT: (): CstNode => this.SUBRULE(this.star) },
      ])
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
      this.SUBRULE(this.percent)
      // There can be only one extended command between each pair of ‘%’ delimiters. It is allowed to put line separators between data blocks of a single command. - Gerber File Format Specification 2021-02, section 3.5.3
      // But from experience, some files have more than 1 data block(s) in a single extended command, so we will allow that as well since it doesn't cause any issues.
      this.AT_LEAST_ONE(() => {
        this.SUBRULE(this.extendedCommandDataBlock)
      })
      // this.CONSUME2(DefaultTokens.Percent)
      this.SUBRULE2(this.percent)
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
        { ALT: (): CstNode => this.SUBRULE(this.apertureMacroCommand) }, //(moved out)
        { ALT: (): CstNode => this.SUBRULE(this.polarityCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.mirroringCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.rotationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.scalingCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.stepRepeatOpenCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.stepRepeatCloseCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.blockApertureOpenCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.blockApertureCloseCommand) },
        // DEPRECATED COMMANDS
        { ALT: (): CstNode => this.SUBRULE(this.imagePolarityCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.axisSelectionCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.imageRotationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.mirrorImageCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.imageOffsetCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.scaleFactorCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.imageNameCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.loadNameCommand) },
        // ATTRIBUTE COMMANDS
        { ALT: (): CstNode => this.SUBRULE(this.fileAttributesCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.apertureAttributesCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.objectAttributesCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.deleteAttributesCommand) },
      ])
      this.SUBRULE(this.star)
      // this.CONSUME(DefaultTokens.Star)
    })

    this.RULE("functionCodeCommand", () => {
      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.commentCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.endCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.inlineInterpolateOperationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.linearInterpolationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.circularInterpolationClockwiseCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.circularInterpolationCounterClockwiseCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.quadrantSingleCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.quadrantMultiCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.regionStartCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.regionEndCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.dCodeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.operationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.absoluteNotationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.incrementalNotationCommand) },
        // DEPRECATED COMMANDS
        { ALT: (): CstNode => this.SUBRULE(this.prepareApertureCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.prepareFlashCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.inchModeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.metricModeCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.optionalStopCommand) },
      ])
      // this.CONSUME(DefaultTokens.Star)
      this.SUBRULE(this.star)
    })

    this.RULE("star", () => {
      this.OR([
        { ALT: (): IToken => this.CONSUME(DefaultTokens.Star) },
        { ALT: (): IToken => this.CONSUME2(AttributeTokens.Star) },
        { ALT: (): IToken => this.CONSUME3(MacroTokens.Star) },
      ])
    })

    this.RULE("percent", () => {
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.Percent) }, { ALT: (): IToken => this.CONSUME2(MacroTokens.Percent) }])
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
    })

    // <AD command> = ADD<D-code number><Template>[,<Modifiers set>]*
    this.RULE("apertureDefinitionCommand", () => {
      this.CONSUME(DefaultTokens.AD)
      this.CONSUME(NameTokens.Name)
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
      this.CONSUME(DefaultTokens.AM)
      this.CONSUME(MacroTokens.Name)
      this.AT_LEAST_ONE({
        GATE: (): boolean => this.LA(2).tokenType !== MacroTokens.Percent,
        DEF: () => {
          this.CONSUME(MacroTokens.Star)
          this.SUBRULE(this.macroBlock)
        },
      })
    })

    this.RULE("macroBlock", () => {
      this.OR([{ ALT: (): CstNode => this.SUBRULE(this.macroVariableDefinition) }, { ALT: (): CstNode => this.SUBRULE(this.macroPrimitive) }])
    })

    // <Variable definition> = $K=<Arithmetic expression>
    this.RULE("macroVariableDefinition", () => {
      this.CONSUME(MacroTokens.MacroVariable)
      this.CONSUME(MacroTokens.Equals)
      this.SUBRULE(this.expression)
    })

    // <Primitive> = <Primitive code>,<Modifier>{,<Modifier>}|<Comment>
    this.RULE("macroPrimitive", () => {
      this.OR([
        {
          GATE: (): boolean => this.LA(1).image === "0 ",
          // GATE: (): boolean => this.LA(1).tokenType === MacroTokens.Number && this.LA(1).image === "0",
          // GATE: (): boolean => this.LA(1).tokenType === MacroTokens.CommentPrimative,
          ALT: (): CstNode => this.SUBRULE(this.macroCommentPrimitive),
        },
        { ALT: (): CstNode => this.SUBRULE(this.macroParameterizedPrimitive) },
      ])
    })

    this.RULE("macroCommentPrimitive", () => {
      this.CONSUME(MacroTokens.CommentPrimative)
      this.CONSUME(CommentTokens.String)
    })

    this.RULE("macroParameterizedPrimitive", () => {
      this.CONSUME(MacroTokens.UnsignedNumber)
      this.AT_LEAST_ONE(() => {
        this.SUBRULE(this.macroParameter)
      })
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
      this.CONSUME(NameTokens.Name)
    })

    // <LM command> = LM(N|X|Y|XY)*
    this.RULE("mirroringCommand", () => {
      this.CONSUME(DefaultTokens.LM)
      this.CONSUME(NameTokens.Name)
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
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.M02) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.M00) }])
    })

    // <G01 command> = G01*
    this.RULE("linearInterpolationCommand", () => {
      this.CONSUME(DefaultTokens.G01)
    })

    // <G02 command> = G02*
    this.RULE("circularInterpolationClockwiseCommand", () => {
      this.CONSUME(DefaultTokens.G02)
    })

    // <G03 command> = G03*
    this.RULE("circularInterpolationCounterClockwiseCommand", () => {
      this.CONSUME(DefaultTokens.G03)
    })

    this.RULE("inlineInterpolateOperationCommand", () => {
      // this.OR([
      //   { ALT: (): IToken => this.CONSUME(DefaultTokens.G01) },
      //   { ALT: (): IToken => this.CONSUME(DefaultTokens.G02) },
      //   { ALT: (): IToken => this.CONSUME(DefaultTokens.G03) },
      // ])
      // this.OPTION(() => {
      // this.SUBRULE(this.coordinateData)
      // })
      // this.OPTION2(() => {
      // this.SUBRULE(this.operationCode)
      // })

      this.OR([
        { ALT: (): CstNode => this.SUBRULE(this.linearInterpolationCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.circularInterpolationClockwiseCommand) },
        { ALT: (): CstNode => this.SUBRULE(this.circularInterpolationCounterClockwiseCommand) },
      ])
      this.SUBRULE(this.operationCommand)
    })

    this.RULE("operationCommand", () => {
      this.OR([
        {
          // GATE: (): boolean => {
          //   const tokenType = this.LA(1).tokenType
          //   return (
          //     tokenType === DefaultTokens.X ||
          //     tokenType === DefaultTokens.Y ||
          //     tokenType === DefaultTokens.I ||
          //     tokenType === DefaultTokens.J ||
          //     tokenType === DefaultTokens.A
          //   )
          // },
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

    // <Dnn command> = D<D-code number>*
    this.RULE("dCodeCommand", () => {
      this.CONSUME(DefaultTokens.Dnn)
    })

    this.RULE("coordinateData", () => {
      this.AT_LEAST_ONE(() => {
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

    /** ATTRIBUTES */

    // <TF command> = %TF<AttributeName>[,<AttributeValue>]*%
    // <AttributeValue> = <Field>{,<Field>}
    this.RULE("fileAttributesCommand", () => {
      this.CONSUME(DefaultTokens.TF)
      this.CONSUME(AttributeTokens.Name)
      this.MANY(() => {
        this.CONSUME(AttributeTokens.Comma)
        this.CONSUME(AttributeValueTokens.Field)
      })
    })

    // <TA command> = %TA<AttributeName>[,<AttributeValue>]*%
    // <AttributeValue> = <Field>{,<Field>}
    this.RULE("apertureAttributesCommand", () => {
      this.CONSUME(DefaultTokens.TA)
      this.CONSUME(AttributeTokens.Name)
      this.MANY(() => {
        this.CONSUME(AttributeTokens.Comma)
        this.CONSUME(AttributeValueTokens.Field)
      })
    })

    // <TO command> = %TO<AttributeName>[,<AttributeValue>]*%
    // <AttributeValue> = <Field>{,<Field>}
    this.RULE("objectAttributesCommand", () => {
      this.CONSUME(DefaultTokens.TO)
      this.CONSUME(AttributeTokens.Name)
      this.MANY(() => {
        this.CONSUME(AttributeTokens.Comma)
        this.CONSUME(AttributeValueTokens.Field)
      })
    })

    // <TD command> = %TD[<AttributeName>]*%
    this.RULE("deleteAttributesCommand", () => {
      this.CONSUME(DefaultTokens.TD)
      this.OPTION(() => {
        this.CONSUME(AttributeTokens.Name)
      })
    })

    /** END ATTRIBUTES */

    /** DEPRECATED COMMANDS */

    // G54 Select aperture This historic code optionally precedes an aperture selection D-code. It has no effect. Sometimes used.
    this.RULE("prepareApertureCommand", () => {
      this.CONSUME(DefaultTokens.G54)
      // this.CONSUME(DefaultTokens.Dnn)
      this.SUBRULE(this.dCodeCommand)
    })

    // This historic code optionally precedes D03 code. It has no effect. Very rarely used nowadays.
    this.RULE("prepareFlashCommand", () => {
      this.CONSUME(DefaultTokens.G55)
      this.CONSUME(DefaultTokens.D03)
    })

    // These historic codes perform a function handled by the MO command. See 4.2. Sometimes used.
    this.RULE("inchModeCommand", () => {
      this.CONSUME(DefaultTokens.G70)
    })

    this.RULE("metricModeCommand", () => {
      this.CONSUME(DefaultTokens.G71)
    })

    // This historic code has no effect. Very rarely used nowadays.
    this.RULE("optionalStopCommand", () => {
      this.CONSUME(DefaultTokens.M01)
    })

    // These historic codes perform a function handled by the FS command. See 4.1. Very rarely used nowadays.
    this.RULE("absoluteNotationCommand", () => {
      this.CONSUME(DefaultTokens.G90)
    })

    this.RULE("incrementalNotationCommand", () => {
      this.CONSUME(DefaultTokens.G91)
    })

    // IP can only be used once, at the beginning of the file. Sometimes used, and then usually as %IPPOS*% to confirm the default – a positive image; it then has no effect. As it is not clear how %IPNEG*% must be handled it is probably a waste of time to try to fully implement it, and sufficient to give a warning if an image is negative.
    // <IP command> = IP(POS|NEG)*
    this.RULE("imagePolarityCommand", () => {
      this.CONSUME(DefaultTokens.IP)
      this.OR([{ ALT: (): IToken => this.CONSUME(DefaultTokens.POS) }, { ALT: (): IToken => this.CONSUME(DefaultTokens.NEG) }])
    })

    // These commands can only be used once, at the beginning of the file. The order of execution is always MI, SF, OF, IR and AS, independent of their order of appearance in the file.
    // <AS command> = AS(AXBY|AYBX)*
    this.RULE("axisSelectionCommand", () => {
      this.CONSUME(DefaultTokens.AS)
      this.OR([
        {
          ALT: () => {
            this.CONSUME(DefaultTokens.A)
            this.CONSUME(DefaultTokens.X)
            this.CONSUME(DefaultTokens.B)
            this.CONSUME(DefaultTokens.Y)
          },
        },
        {
          ALT: () => {
            this.CONSUME2(DefaultTokens.A)
            this.CONSUME2(DefaultTokens.Y)
            this.CONSUME2(DefaultTokens.B)
            this.CONSUME2(DefaultTokens.X)
          },
        },
      ])
    })

    // <IR command> = IR(0|90|180|270)*
    this.RULE("imageRotationCommand", () => {
      this.CONSUME(DefaultTokens.IR)
      this.CONSUME(DefaultTokens.Number)
    })

    // <MI command> = MI[A(0|1)][B(0|1)]*
    this.RULE("mirrorImageCommand", () => {
      this.CONSUME(DefaultTokens.MI)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.A)
        this.CONSUME(DefaultTokens.Number)
      })
      this.OPTION2(() => {
        this.CONSUME(DefaultTokens.B)
        this.CONSUME2(DefaultTokens.Number)
      })
    })

    // <OF command> = OF[A<Offset>][B<Offset>]*
    this.RULE("imageOffsetCommand", () => {
      this.CONSUME(DefaultTokens.OF)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.A)
        this.CONSUME(DefaultTokens.Number)
      })
      this.OPTION2(() => {
        this.CONSUME(DefaultTokens.B)
        this.CONSUME2(DefaultTokens.Number)
      })
    })

    // <SF command> = SF[A<Factor>][B<Factor>]*
    this.RULE("scaleFactorCommand", () => {
      this.CONSUME(DefaultTokens.SF)
      this.OPTION(() => {
        this.CONSUME(DefaultTokens.A)
        this.CONSUME(DefaultTokens.Number)
      })
      this.OPTION2(() => {
        this.CONSUME(DefaultTokens.B)
        this.CONSUME2(DefaultTokens.Number)
      })
    })

    // <IN command> = IN<Name>*
    // Sets the name of the file image. Has no effect. It is comment.
    this.RULE("imageNameCommand", () => {
      this.CONSUME(DefaultTokens.IN)
      this.CONSUME(NameTokens.Name)
    })

    // <LN command> = LN<Name>*
    // Loads a name. Has no effect. It is a comment.
    this.RULE("loadNameCommand", () => {
      this.CONSUME(DefaultTokens.LN)
      this.CONSUME(NameTokens.Name)
    })

    /** END DEPRECATED COMMANDS */

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

interface BlockContext {
  code: string
  shapes: Shapes.Shape[]
}

interface VisitorState {
  units: Types.UnitsType
  coordinateFormat: Types.Format
  coordinateMode: Types.Mode
  zeroSuppression: Types.ZeroSuppression
  done: boolean
  currentToolCode: string | undefined
  operation: Types.GraphicType | undefined
}

const defaultTool: Tool = new Symbols.NullSymbol({ id: "274x_NULL" })

type VariableValues = Record<string, number>
type Position = [x: number, y: number]

interface AttributeDictionary {
  [attributeName: string]: string | undefined
}
export class GerberToTreeVisitor extends BaseCstVisitor {
  public readonly image: Shapes.Shape[] = []

  public readonly macroDefinitions: Partial<Record<string, Types.MacroBlock[]>> = {}
  public readonly toolDefinitions: Partial<Record<string, Tool>> = {}

  private state: VisitorState = {
    units: Constants.IN,
    coordinateFormat: [2, 4],
    zeroSuppression: Constants.LEADING,
    coordinateMode: Constants.ABSOLUTE,
    done: false,
    currentToolCode: undefined,
    operation: undefined,
  }

  private location: Types.Location = {
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
    arcOffsets: {
      i: 0,
      j: 0,
      a: 0,
    },
  }

  public fileAttributes: AttributeDictionary = {}
  public apertureAttributes: AttributeDictionary = {}
  public objectAttributes: AttributeDictionary = {}

  private currentTransform: { polarity: Types.Polarity; mirror: Types.Mirroring; rotation: Types.Rotation; scale: Types.Scaling } = {
    polarity: Constants.DARK,
    mirror: Constants.NO_MIRROR,
    rotation: 0,
    scale: 1,
  }

  private currentSurface: Shapes.Surface | undefined
  private arcDirection: ArcDirection | undefined
  private ambiguousArcCenter = false
  private regionMode = false
  private readonly blockStack: BlockContext[] = []
  private readonly stepRepeatStack: Shapes.StepAndRepeat[] = []

  public errors: { message: string; location: CstNodeLocation | undefined }[] = []

  constructor() {
    super()
    this.validateVisitor()
  }

  program(ctx: cst.ProgramCstChildren): Shapes.Shape[] {
    ctx.command?.map(this.visit, this)

    if (!this.state.done) {
      this.endCommand({})
    }

    return this.image
  }

  command(ctx: cst.CommandCstChildren): void {
    Object.values(ctx).forEach(this.visit, this)
  }

  extendedCommandDataBlock(ctx: cst.ExtendedCommandDataBlockCstChildren): void {
    Object.values(ctx).forEach(this.visit, this)
  }

  extendedCommand(ctx: cst.ExtendedCommandCstChildren): void {
    Object.values(ctx).forEach(this.visit, this)
  }

  functionCodeCommand(ctx: cst.FunctionCodeCommandCstChildren): void {
    Object.values(ctx).forEach(this.visit, this)
  }

  star(_ctx: cst.StarCstChildren): void {
    // Star is just a separator and doesn't have any meaning on its own, so we don't need to do anything here.
  }

  percent(_ctx: cst.PercentCstChildren): void {
    // Percent is just a separator and doesn't have any meaning on its own, so we don't need to do anything here.
  }

  formatSpecificationCommand(ctx: cst.FormatSpecificationCommandCstChildren): void {
    const xDigits = ctx.Number[0].image

    if (!/^\d{2}$/.test(xDigits)) return undefined
    const integer = Number(xDigits[0])
    const decimal = Number(xDigits[1])

    if (!Number.isFinite(integer) || !Number.isFinite(decimal)) return undefined

    this.state.coordinateFormat[0] = integer
    this.state.coordinateFormat[1] = decimal
    this.state.zeroSuppression = ctx.T ? Constants.TRAILING : Constants.LEADING
    this.state.coordinateMode = ctx.A ? Constants.ABSOLUTE : Constants.INCREMENTAL
    if (this.state.coordinateMode === Constants.INCREMENTAL) {
      this.errors.push({
        message: `Incremental notation is deprecated and not fully supported by this parser. Use absolute notation (G90) instead for better compatibility.`,
        location: ctx.A?.[0],
      })
    }
  }

  unitsCommand(ctx: cst.UnitsCommandCstChildren): void {
    const unitsString = ctx.MO[0].image.slice(2).toUpperCase()
    if (unitsString === "MM") {
      this.state.units = Constants.MM
    } else if (unitsString === "IN") {
      this.state.units = Constants.IN
    }
  }

  apertureDefinitionCommand(ctx: cst.ApertureDefinitionCommandCstChildren): void {
    const name = ctx.Name[0].image

    const code = ctx.AD[0].image.slice(3)
    const params = ctx.modifiersSet ? (this.visit(ctx.modifiersSet[0]) as string[]) : []

    this.state.currentToolCode = code

    const nameUpperCase = name.toUpperCase()
    const values = params.map((value) => Number(value)).filter((value) => Number.isFinite(value))

    // Circle
    // C,<Diameter>[X<Hole diameter>]
    if (nameUpperCase === "C") {
      this.toolDefinitions[code] = new Symbols.RoundSymbol({
        id: `274x_D${code}`,
        outer_dia: values[0] ?? 0,
        // TODO: support rectangular holes
        inner_dia: values[1] ?? 0,
        units: this.state.units,
        attributes: { ...this.apertureAttributes },
      })
      if (values.length >= 2) {
        this.errors.push({
          message: `Rectangular holes in standard shapes are not supported by the render engine (yet), so the hole diameter parameter will be treated as a circular hole. If you need rectangular holes, you can use a custom macro shape instead.`,
          location: ctx.modifiersSet?.[0].location,
        })
      }
      return
    }

    // Rectangle
    // R,<X size>X<Y size>[X<Hole diameter>]
    if (nameUpperCase === "R") {
      this.toolDefinitions[code] = new Symbols.RectangleSymbol({
        id: `274x_D${code}`,
        width: values[0] ?? 0,
        height: values[1] ?? 0,
        // TODO: support rectangular holes
        inner_dia: values[2] ?? 0,
        units: this.state.units,
        attributes: { ...this.apertureAttributes },
      })
      if (values.length >= 2) {
        this.errors.push({
          message: `Rectangular holes in standard shapes are not supported by the render engine (yet), so the hole diameter parameter will be treated as a circular hole. If you need rectangular holes, you can use a custom macro shape instead.`,
          location: ctx.modifiersSet?.[0].location,
        })
      }
      return
    }

    // Obround
    // O,<X size>X<Y size>[X<Hole diameter>]
    if (nameUpperCase === "O") {
      this.toolDefinitions[code] = new Symbols.OvalSymbol({
        id: `274x_D${code}`,
        width: values[0] ?? 0,
        height: values[1] ?? 0,
        // TODO: support rectangular holes
        inner_dia: values[2] ?? 0,
        units: this.state.units,
        attributes: { ...this.apertureAttributes },
      })
      if (values.length >= 2) {
        this.errors.push({
          message: `Rectangular holes in standard shapes are not supported by the render engine (yet), so the hole diameter parameter will be treated as a circular hole. If you need rectangular holes, you can use a custom macro shape instead.`,
          location: ctx.modifiersSet?.[0].location,
        })
      }
      return
    }

    // Polygon
    // P,<Outer diameter>X<Number of vertices>[X<Rotation>[X<Hole diameter>]]
    if (nameUpperCase === "P") {
      this.toolDefinitions[code] = new Symbols.PolygonSymbol({
        id: `274x_D${code}`,
        outer_dia: values[0] ?? 0,
        corners: values[1] ?? 0,
        angle: (values[2] ?? 0) * -1,
        // TODO: support rectangular holes
        inner_dia: values[3] ?? 0,
        line_width: 0,
        units: this.state.units,
        attributes: { ...this.apertureAttributes },
      })
      if (values.length >= 2) {
        this.errors.push({
          message: `Rectangular holes in standard shapes are not supported by the render engine (yet), so the hole diameter parameter will be treated as a circular hole. If you need rectangular holes, you can use a custom macro shape instead.`,
          location: ctx.modifiersSet?.[0].location,
        })
      }
      return
    }

    // Macro
    const shapes: Shapes.Shape[] = []
    const macro = this.macroDefinitions[name] ?? []
    const variableValues: VariableValues = Object.fromEntries(values.map((value, index) => [`$${index + 1}`, value]))

    for (const block of macro) {
      if (block.type === Constants.MACRO_VARIABLE) {
        variableValues[block.name] = this.solveExpression(block.value, variableValues)
      }

      if (block.type === Constants.MACRO_PRIMITIVE) {
        const parameters = block.parameters.map((p) => {
          return this.solveExpression(p, variableValues)
        })

        shapes.push(this.createMacroPrimitive(block.code, parameters))
      }
    }

    // micro optimization
    let flatten = true
    if (shapes.every((s) => "polarity" in s && s.polarity == 1)) {
      flatten = false
    }

    this.toolDefinitions[code] = new Symbols.MacroSymbol({
      id: `274x_D${code}-${name}`,
      shapes,
      flatten,
      attributes: { ...this.apertureAttributes },
    })
  }

  modifiersSet(ctx: cst.ModifiersSetCstChildren): string[] {
    return ctx.Number.map((token) => token.image)
  }

  polarityCommand(ctx: cst.PolarityCommandCstChildren): void {
    if (this.currentSurface) {
      this.flushCurrentSurface()
    }
    const value = ctx.Name[0].image.toUpperCase()
    this.currentTransform.polarity = value === "C" ? Constants.CLEAR : Constants.DARK
  }

  mirroringCommand(ctx: cst.MirroringCommandCstChildren): void {
    const value = ctx.Name[0].image.toUpperCase()
    this.currentTransform.mirror = value === "X" ? Constants.X : value === "Y" ? Constants.Y : value === "XY" ? Constants.XY : Constants.NO_MIRROR
  }

  rotationCommand(ctx: cst.RotationCommandCstChildren): void {
    const rotation = Number(ctx.Number[0].image)
    if (Number.isFinite(rotation)) {
      this.currentTransform.rotation = rotation
    }
  }

  scalingCommand(ctx: cst.ScalingCommandCstChildren): void {
    const scaling = Number(ctx.Number[0].image)
    if (Number.isFinite(scaling)) {
      this.currentTransform.scale = scaling
    }
  }

  stepRepeatOpenCommand(ctx: cst.StepRepeatOpenCommandCstChildren): void {
    this.flushCurrentSurface()
    const values = ctx.Number.map((token) => Number(token.image)) ?? []
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
        units: this.state.units,
      }),
    )
  }

  stepRepeatCloseCommand(ctx: cst.StepRepeatCloseCommandCstChildren): void {
    this.flushCurrentSurface()
    const stepRepeat = this.stepRepeatStack.pop()
    if (stepRepeat) {
      this.emitShape(stepRepeat)
    } else {
      this.errors.push({ message: "Mismatched step and repeat close command", location: ctx.SR[0] })
    }
  }

  blockApertureOpenCommand(ctx: cst.BlockApertureOpenCommandCstChildren): void {
    const codeToken = ctx.Dnn[0].image
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
      attributes: { ...this.apertureAttributes },
    })
  }

  commentCommand(_ctx: cst.CommentCommandCstChildren): void {}

  endCommand(_ctx: cst.EndCommandCstChildren): void {
    this.flushCurrentSurface()
    while (this.stepRepeatStack.length > 0) {
      this.stepRepeatCloseCommand({ SR: [] })
    }
    this.state.done = true
  }

  linearInterpolationCommand(_ctx: cst.LinearInterpolationCommandCstChildren): void {
    this.arcDirection = undefined
  }

  circularInterpolationClockwiseCommand(_ctx: cst.CircularInterpolationClockwiseCommandCstChildren): void {
    this.arcDirection = "cw"
  }

  circularInterpolationCounterClockwiseCommand(_ctx: cst.CircularInterpolationCounterClockwiseCommandCstChildren): void {
    this.arcDirection = "ccw"
  }

  inlineInterpolateOperationCommand(ctx: cst.InlineInterpolateOperationCommandCstChildren): void {
    ctx.linearInterpolationCommand && this.visit(ctx.linearInterpolationCommand)
    ctx.circularInterpolationClockwiseCommand && this.visit(ctx.circularInterpolationClockwiseCommand)
    ctx.circularInterpolationCounterClockwiseCommand && this.visit(ctx.circularInterpolationCounterClockwiseCommand)
    this.visit(ctx.operationCommand)
  }

  operationCommand(ctx: cst.OperationCommandCstChildren): void {
    ctx.coordinateData && this.visit(ctx.coordinateData)
    ctx.operationCode && this.visit(ctx.operationCode)

    if (this.state.operation === undefined) {
      this.errors.push({
        message: "Missing operation code, cannot determine graphic type for interpolation command",
        location: ctx.operationCode?.[0].location ?? ctx.coordinateData?.[0].location,
      })
      return
    }

    if (this.state.operation === Constants.MOVE) {
      this.flushCurrentSurface()
      return
    }

    if (this.state.operation === Constants.SHAPE) {
      this.flushCurrentSurface()
      this.emitShape(
        new Shapes.Pad({
          symbol: this.getCurrentTool(),
          x: this.location.endPoint.x,
          y: this.location.endPoint.y,
          rotation: this.currentTransform.rotation,
          mirror_x: this.currentTransform.mirror === "x" || this.currentTransform.mirror === "xy" ? 1 : 0,
          mirror_y: this.currentTransform.mirror === "y" || this.currentTransform.mirror === "xy" ? 1 : 0,
          resize_factor: this.currentTransform.scale,
          polarity: this.currentTransform.polarity === Constants.DARK ? 1 : 0,
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        }),
      )
      return
    }

    if (this.state.operation !== Constants.SEGMENT) {
      return
    }

    if (this.regionMode) {
      if (!this.currentSurface) {
        this.currentSurface = new Shapes.Surface({
          polarity: this.currentTransform.polarity === Constants.DARK ? 1 : 0,
          units: this.state.units,
          attributes: { ...this.objectAttributes, ...this.apertureAttributes },
        }).addContour(
          new Shapes.Contour({
            xs: this.location.startPoint.x,
            ys: this.location.startPoint.y,
          }),
        )
      }

      if (!this.arcDirection) {
        this.currentSurface.contours[0].addSegment(
          new Shapes.Contour_Line_Segment({
            x: this.location.endPoint.x,
            y: this.location.endPoint.y,
          }),
        )
        return
      }

      const center = this.getArcCenter(this.location)
      this.currentSurface.contours[0].addSegment(
        new Shapes.Contour_Arc_Segment({
          x: this.location.endPoint.x,
          y: this.location.endPoint.y,
          xc: center.x ?? this.location.endPoint.x,
          yc: center.y ?? this.location.endPoint.y,
          clockwise: this.arcDirection === "cw" ? 1 : 0,
        }),
      )
      return
    }

    const tool = this.getCurrentTool()
    if (tool.type === SymbolTypeIdentifier.MACRO_DEFINITION) {
      // warn about using macro tools in interpolation commands, since it's not clear how to apply transformations to the primitives inside the macro
      this.errors.push({
        message:
          "Using macro tools in interpolation commands may lead to unexpected results, since it's not clear how to apply transformations to the primitives inside the macro. Use with caution.",
        location: ctx.operationCode?.[0].location ?? ctx.coordinateData?.[0].location,
      })
      return
    }

    if (!this.arcDirection) {
      this.emitShape(
        new Shapes.Line({
          symbol: tool,
          polarity: this.currentTransform.polarity === Constants.DARK ? 1 : 0,
          xs: this.location.startPoint.x,
          ys: this.location.startPoint.y,
          xe: this.location.endPoint.x,
          ye: this.location.endPoint.y,
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        }),
      )
      return
    }

    const center = this.getArcCenter(this.location)
    this.emitShape(
      new Shapes.Arc({
        symbol: tool,
        polarity: this.currentTransform.polarity === Constants.DARK ? 1 : 0,
        xs: this.location.startPoint.x,
        ys: this.location.startPoint.y,
        xe: this.location.endPoint.x,
        ye: this.location.endPoint.y,
        xc: center.x ?? this.location.endPoint.x,
        yc: center.y ?? this.location.endPoint.y,
        clockwise: this.arcDirection === "cw" ? 1 : 0,
        units: this.state.units,
        attributes: { ...this.objectAttributes },
      }),
    )
  }

  operationCode(ctx: cst.OperationCodeCstChildren): void {
    if (ctx.D01) {
      this.state.operation = Constants.SEGMENT
    } else if (ctx.D02) {
      this.state.operation = Constants.MOVE
    } else if (ctx.D03) {
      this.state.operation = Constants.SHAPE
    } else {
      this.state.operation = undefined
      this.errors.push({ message: "Missing/Unknown Operation Code Command", location: undefined })
    }
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

  dCodeCommand(ctx: cst.DCodeCommandCstChildren): void {
    const image = ctx.Dnn[0].image
    if (!image) return

    const code = Number(image.slice(1))
    if (!Number.isFinite(code)) return
    if (code >= 10) {
      this.state.currentToolCode = String(code)
      return
    }
  }

  coordinateData(ctx: cst.CoordinateDataCstChildren): void {
    const newStartPoint = { ...this.location.endPoint }
    ctx.coordinateField.map(this.visit, this)
    this.location.startPoint = newStartPoint
  }

  coordinateField(ctx: cst.CoordinateFieldCstChildren): void {
    ctx.aCoordinate && this.visit(ctx.aCoordinate)
    ctx.jCoordinate && this.visit(ctx.jCoordinate)
    ctx.iCoordinate && this.visit(ctx.iCoordinate)
    ctx.yCoordinate && this.visit(ctx.yCoordinate)
    ctx.xCoordinate && this.visit(ctx.xCoordinate)
  }

  private parseCoordinate = (coordinate: string | undefined, defaultValue: number): number => {
    if (coordinate === undefined) return defaultValue
    if (coordinate.includes(".") || coordinate === "0") return Number(coordinate)

    const [integerPlaces, decimalPlaces] = this.state.coordinateFormat
    const digits = integerPlaces + decimalPlaces
    const [sign, signlessCoordinate] =
      coordinate.startsWith("+") || coordinate.startsWith("-") ? [coordinate[0], coordinate.slice(1)] : ["+", coordinate]
    const padded =
      this.state.zeroSuppression === Constants.TRAILING ? signlessCoordinate.padEnd(digits, "0") : signlessCoordinate.padStart(digits, "0")
    const leading = padded.slice(0, padded.length - decimalPlaces)
    const trailing = padded.slice(padded.length - decimalPlaces)
    return Number(`${sign}${leading}.${trailing}`)
  }

  xCoordinate(ctx: cst.XCoordinateCstChildren): void {
    if (this.state.coordinateMode === Constants.INCREMENTAL) {
      this.location.endPoint.x += this.parseCoordinate(ctx.Number[0].image, 0)
    } else {
      this.location.endPoint.x = this.parseCoordinate(ctx.Number[0].image, this.location.endPoint.x)
    }
  }

  yCoordinate(ctx: cst.YCoordinateCstChildren): void {
    if (this.state.coordinateMode === Constants.INCREMENTAL) {
      this.location.endPoint.y += this.parseCoordinate(ctx.Number[0].image, 0)
    } else {
      this.location.endPoint.y = this.parseCoordinate(ctx.Number[0].image, this.location.endPoint.y)
    }
  }

  iCoordinate(ctx: cst.ICoordinateCstChildren): void {
    this.location.arcOffsets.i = this.parseCoordinate(ctx.Number[0].image, 0)
  }

  jCoordinate(ctx: cst.JCoordinateCstChildren): void {
    this.location.arcOffsets.j = this.parseCoordinate(ctx.Number[0].image, 0)
  }

  aCoordinate(ctx: cst.ACoordinateCstChildren): void {
    this.location.arcOffsets.a = this.parseCoordinate(ctx.Number[0].image, 0)
  }

  currentMacroBlocks: Types.MacroBlock[] = []

  apertureMacroCommand(ctx: cst.ApertureMacroCommandCstChildren): void {
    const name = ctx.Name[0].image
    if (!name) {
      this.errors.push({ message: "Macro definition missing name", location: ctx.AM[0] })
      return
    }

    this.currentMacroBlocks = []
    const macroBlockNodes = ctx.macroBlock ?? []
    macroBlockNodes.map((node) => this.visit(node))
    this.macroDefinitions[name] = this.currentMacroBlocks
    this.currentMacroBlocks = []
  }

  macroBlock(ctx: cst.MacroBlockCstChildren): void {
    if (ctx.macroVariableDefinition != undefined) {
      ctx.macroVariableDefinition.map((node) => this.visit(node))
    }
    if (ctx.macroPrimitive != undefined) {
      ctx.macroPrimitive.map((node) => this.visit(node))
    }
  }

  macroVariableDefinition(ctx: cst.MacroVariableDefinitionCstChildren): void {
    const name = ctx.MacroVariable[0].image ?? "$1"
    const expressionNodes = ctx.expression
    const value = expressionNodes.length > 0 ? (this.visit(expressionNodes[0]) as MacroValue) : 0
    this.currentMacroBlocks.push({ type: Constants.MACRO_VARIABLE, name, value })
  }

  macroPrimitive(ctx: cst.MacroPrimitiveCstChildren): void {
    if (ctx.macroCommentPrimitive) {
      ctx.macroCommentPrimitive.map((node) => this.visit(node))
    }
    if (ctx.macroParameterizedPrimitive) {
      ctx.macroParameterizedPrimitive.map((node) => this.visit(node))
    }
  }

  macroCommentPrimitive(_ctx: cst.MacroCommentPrimitiveCstChildren): void {}

  macroParameterizedPrimitive(ctx: cst.MacroParameterizedPrimitiveCstChildren): void {
    const code = ctx.UnsignedNumber[0].image ?? "0"

    const parameterNodes = ctx.macroParameter
    this.currentMacroBlocks.push({
      type: Constants.MACRO_PRIMITIVE,
      code: code as MacroPrimitiveCode,
      parameters: parameterNodes.map((node) => this.visit(node) as MacroValue),
    })
  }

  macroCommentPart(_ctx: cst.MacroCommentPartCstChildren): void {}

  macroParameter(ctx: cst.MacroParameterCstChildren): MacroValue {
    const expressionNodes = ctx.expression
    return expressionNodes.length > 0 ? (this.visit(expressionNodes[0]) as MacroValue) : 0
  }

  expression(ctx: cst.ExpressionCstChildren): MacroValue {
    const termNodes = ctx.term
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
    const factorNodes = ctx.factor
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
    const expressionNodes = ctx.expression ?? []
    if (expressionNodes.length > 0) return this.visit(expressionNodes[0]) as MacroValue
    if (ctx.MacroVariable?.[0]) return ctx.MacroVariable[0].image
    const numericToken = ctx.UnsignedNumber?.[0]
    return numericToken ? Number(numericToken.image) : 0
  }

  // DEPRECATED COMMANDS
  prepareApertureCommand(ctx: cst.PrepareApertureCommandCstChildren): void {
    this.visit(ctx.dCodeCommand)
  }

  prepareFlashCommand(_ctx: cst.PrepareFlashCommandCstChildren): void {
    // This command is deprecated, but if we encounter it, we should still set the current tool to the specified D-code, since that's the only effect it has.
    this.state.operation = Constants.SHAPE
  }

  inchModeCommand(): void {
    this.state.units = Constants.IN
  }

  metricModeCommand(): void {
    this.state.units = Constants.MM
  }

  optionalStopCommand(): void {
    // This command is deprecated and has no effect, so we can safely ignore it.
  }

  absoluteNotationCommand(_ctx: cst.AbsoluteNotationCommandCstChildren): void {
    // Absolute notation is the default and is specified by the "A" in the FS command. It is also specified by the "A" in the G90 command, but this is deprecated since revision I1 from December 2012.
    this.state.coordinateMode = Constants.ABSOLUTE
  }

  incrementalNotationCommand(ctx: cst.IncrementalNotationCommandCstChildren): void {
    // Incremental Notation is deprecated since revision I1 from December 2012.
    this.state.coordinateMode = Constants.INCREMENTAL
    this.errors.push({
      message: `Incremental notation is deprecated, but still supported in this parser. "Incremental notation was sometimes used as a simplistic compression when saving a few bytes
was a fantastic advantage, and before the invention of Lempel-Ziv-Welch (LZW) and other
lossless compression methods. The problem is that the accumulation of rounding errors leads to
significant loss or precision. This results in poor registration, invalid arcs, self-intersecting
contours, often resulting in scrap. Avoid incremental notation like the plague." - Gerber File Format Specification, Revision 2019.06`,
      location: ctx.G91[0],
    })
  }

  imagePolarityCommand(ctx: cst.ImagePolarityCommandCstChildren): void {
    const value = ctx.POS ? "POS" : ctx.NEG ? "NEG" : "POS"
    if (value === "NEG") {
      this.errors.push({
        message: "Negative images are not fully supported, and may not render correctly.",
        location: ctx.NEG?.[0] ?? ctx.POS?.[0] ?? undefined,
      })
    }
  }

  axisSelectionCommand(_ctx: cst.AxisSelectionCommandCstChildren): void {
    // TODO: Warn if the axes are swapped, since that can cause confusion for users and may indicate an error in the file.
  }

  imageRotationCommand(_ctx: cst.ImageRotationCommandCstChildren): void {
    // const rotation = Number(ctx.Number[0].image)
    // TODO: warn for non 0 rotation
  }

  mirrorImageCommand(_ctx: cst.MirrorImageCommandCstChildren): void {
    // TODO: implement or warn
  }

  imageOffsetCommand(_ctx: cst.ImageOffsetCommandCstChildren): void {
    // TODO: implement or warn
  }

  scaleFactorCommand(_ctx: cst.ScaleFactorCommandCstChildren): void {
    // TODO: implement or warn
  }

  imageNameCommand(_ctx: cst.ImageNameCommandCstChildren): void {
    // This command is deprecated and has no effect, so we can safely ignore it.
  }

  loadNameCommand(_ctx: cst.LoadNameCommandCstChildren): void {
    // This command is deprecated and has no effect, so we can safely ignore it.
  }

  // ATTRIBUTES

  fileAttributesCommand(ctx: cst.FileAttributesCommandCstChildren): void {
    const name = ctx.Name[0].image
    const value = ctx.Field ? ctx.Field.map((token) => token.image).join(",") : undefined
    this.fileAttributes[name] = value
  }

  apertureAttributesCommand(ctx: cst.ApertureAttributesCommandCstChildren): void {
    const name = ctx.Name[0].image
    const value = ctx.Field ? ctx.Field.map((token) => token.image).join(",") : undefined
    this.apertureAttributes[name] = value
  }

  objectAttributesCommand(ctx: cst.ObjectAttributesCommandCstChildren): void {
    const name = ctx.Name[0].image
    const value = ctx.Field ? ctx.Field.map((token) => token.image).join(",") : undefined
    this.objectAttributes[name] = value
  }

  deleteAttributesCommand(ctx: cst.DeleteAttributesCommandCstChildren): void {
    if (ctx.Name && ctx.Name[0]) {
      const name = ctx.Name[0].image
      delete this.fileAttributes[name]
      delete this.apertureAttributes[name]
      delete this.objectAttributes[name]
    } else {
      this.fileAttributes = {}
      this.apertureAttributes = {}
      this.objectAttributes = {}
    }
  }

  private getCurrentTool(): Tool {
    return typeof this.state.currentToolCode === "string" ? (this.toolDefinitions[this.state.currentToolCode] ?? defaultTool) : defaultTool
  }

  private flushCurrentSurface(): void {
    if (!this.currentSurface) return
    this.emitShape(this.currentSurface)
    this.currentSurface = undefined
  }

  private emitShape(shape: Shapes.Shape): void {
    if (this.stepRepeatStack.length > 0) {
      this.stepRepeatStack[this.stepRepeatStack.length - 1].shapes.push(shape)
      return
    }
    if (this.blockStack.length > 0) {
      this.blockStack[this.blockStack.length - 1].shapes.push(shape)
      return
    }
    this.image.push(shape)
  }

  private getArcCenter(location: Types.Location): Types.Point {
    if (this.ambiguousArcCenter && this.arcDirection) {
      return getAmbiguousArcCenter(location, this.arcDirection)
    }
    return {
      x: location.startPoint.x + location.arcOffsets.i,
      y: location.startPoint.y + location.arcOffsets.j,
    }
  }

  // MACRO STUFF

  // Helper function: Rotate and shift point
  private rotateAndShift(point: Position, shift: Position, degrees = 0): Position {
    const rotation = (degrees * Math.PI) / 180
    const [sin, cos] = [Math.sin(rotation), Math.cos(rotation)]
    const [x, y] = point
    const nextX = x * cos - y * sin + shift[0]
    const nextY = x * sin + y * cos + shift[1]
    return [nextX, nextY]
  }

  private rotate = (p: Position, angle: number): Position => this.rotateAndShift(p, [0, 0], angle)

  private solveExpression(expression: MacroValue, variables: VariableValues): number {
    if (typeof expression === "number") return expression
    if (typeof expression === "string") return variables[expression]

    const left = this.solveExpression(expression.left, variables)
    const right = this.solveExpression(expression.right, variables)

    switch (expression.operator) {
      case "+": {
        return left + right
      }

      case "-": {
        return left - right
      }

      case "x": {
        return left * right
      }

      case "/": {
        return left / right
      }
    }
  }

  private createMacroPrimitive(code: MacroPrimitiveCode, parameters: number[]): Shapes.Shape {
    switch (code) {
      case Constants.MACRO_CIRCLE: {
        const [exposure, diameter, cx0, cy0, degrees] = parameters
        const [cx, cy] = this.rotate([cx0, cy0], degrees)

        return new Shapes.Pad({
          polarity: exposure === 1 ? 1 : 0,
          x: cx,
          y: cy,
          symbol: new Symbols.RoundSymbol({
            outer_dia: diameter,
            inner_dia: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_VECTOR_LINE:
      case Constants.MACRO_VECTOR_LINE_DEPRECATED: {
        const [exposure, width, sx, sy, ex, ey, degrees] = parameters
        const [xs, ys] = this.rotate([sx, sy], degrees)
        const [xe, ye] = this.rotate([ex, ey], degrees)

        return new Shapes.Line({
          polarity: exposure === 1 ? 1 : 0,
          xs: xs,
          ys: ys,
          xe: xe,
          ye: ye,
          symbol: new Symbols.SquareSymbol({
            width: width,
            height: 0,
            inner_dia: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_CENTER_LINE: {
        const [exposure, width, height, cx, cy, degrees] = parameters
        const [x, y] = this.rotate([cx, cy], degrees)

        return new Shapes.Pad({
          polarity: exposure === 1 ? 1 : 0,
          rotation: degrees,
          x: x,
          y: y,
          symbol: new Symbols.RectangleSymbol({
            width: width,
            height: height,
            inner_dia: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_LOWER_LEFT_LINE_DEPRECATED: {
        const [exposure, width, height, x, y, degrees] = parameters
        const [xs, ys] = this.rotate([x, y], degrees)

        return new Shapes.Pad({
          polarity: exposure === 1 ? 1 : 0,
          rotation: degrees,
          x: xs + width / 2,
          y: ys + height / 2,
          symbol: new Symbols.RectangleSymbol({
            width: width,
            height: height,
            inner_dia: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          units: this.state.units,
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_OUTLINE: {
        const [exposure, , ...coords] = parameters.slice(0, -1)
        const degrees = parameters[parameters.length - 1]
        const [xs, ys] = this.rotate([coords[0], coords[1]], degrees)

        const segments = coords
          .map((p, i) => {
            if (i % 2 === 0 && i >= 2) {
              const [x, y] = this.rotate([p, coords[i + 1]], degrees)
              return new Shapes.Contour_Line_Segment({
                x: x,
                y: y,
              })
            }
            return undefined
          })
          .filter((s): s is Shapes.Contour_Line_Segment => s !== undefined)
        return new Shapes.Surface({
          polarity: exposure === 1 ? 1 : 0,
          units: this.state.units,
          attributes: { ...this.objectAttributes, ...this.apertureAttributes },
        }).addContour(
          new Shapes.Contour({
            poly_type: 1,
            xs: xs,
            ys: ys,
            segments: segments,
          }),
        )
      }

      case Constants.MACRO_POLYGON: {
        const [exposure, vertices, cx, cy, diameter, degrees] = parameters

        const [x, y] = this.rotate([cx, cy], degrees)

        return new Shapes.Pad({
          polarity: exposure === 1 ? 1 : 0,
          x: x,
          y: y,
          rotation: degrees,
          units: this.state.units,
          symbol: new Symbols.PolygonSymbol({
            outer_dia: diameter,
            corners: vertices,
            inner_dia: 0,
            line_width: 0,
            angle: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_MOIRE_DEPRECATED: {
        const [cx0, cy0, d, ringThx, ringGap, ringN, lineThx, lineLength, degrees] = parameters
        const [cx, cy] = this.rotate([cx0, cy0], degrees)

        return new Shapes.Pad({
          polarity: 1,
          x: cx,
          y: cy,
          rotation: degrees,
          units: this.state.units,
          symbol: new Symbols.MoireGerberSymbol({
            outer_dia: d,
            ring_gap: ringGap,
            ring_width: ringThx,
            num_rings: ringN,
            line_width: lineThx,
            line_length: lineLength,
            angle: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          attributes: { ...this.objectAttributes },
        })
      }

      case Constants.MACRO_THERMAL: {
        const [cx0, cy0, od, id, gap, degrees] = parameters
        const [x, y] = this.rotate([cx0, cy0], degrees)

        return new Shapes.Pad({
          polarity: 1,
          x: x,
          y: y,
          rotation: degrees,
          units: this.state.units,
          symbol: new Symbols.SquaredRoundThermalSymbol({
            outer_dia: od,
            inner_dia: id,
            gap: gap,
            num_spokes: 4,
            angle: 0,
            units: this.state.units,
            attributes: { ...this.apertureAttributes },
          }),
          attributes: { ...this.objectAttributes },
        })
      }
    }
  }
}

export function parseGerberWithChevrotain(file: string): Shapes.Shape[] {
  const lexingResult = GerberLexer.tokenize(file)
  if (lexingResult.errors.length > 0) {
    // throw new Error(
    //   `Gerber lexing failed with ${lexingResult.errors.length} error(s):\n${lexingResult.errors
    //     .map((err) => `- Line ${err.line}, Column ${err.column}: ${err.message}`)
    //     .join("\n")}`,
    // )
    console.warn(
      `Gerber lexing produced ${lexingResult.errors.length} error(s). This may indicate that the file is not fully compliant with the Gerber specification, and may lead to incorrect parsing results.`,
    )
    console.warn(
      `Gerber lexing failed with ${lexingResult.errors.length} error(s):\n${lexingResult.errors.map((err) => `- Line ${err.line}, Column ${err.column}: ${err.message}`).join("\n")}`,
    )
  }

  parser.input = lexingResult.tokens
  const cst = parser.program()
  if (parser.errors.length > 0) {
    // throw new Error(
    //   `Gerber parse failed with ${parser.errors.length} error(s):\n${parser.errors.map((err) => `- ${err.message} => Cause: ${err.cause}, Token: ${JSON.stringify(err.token)}, Context: ${JSON.stringify(err.context)}, Stack: ${err.stack}`).join("\n")}`,
    // )
    console.warn(
      `Gerber parsing produced ${parser.errors.length} error(s). This may indicate that the file is not fully compliant with the Gerber specification, and may lead to incorrect parsing results.`,
    )
    console.warn(
      `Gerber parse produced ${parser.errors.length} error(s):\n${parser.errors.map((err) => `- ${err.message} => Cause: ${err.cause}, Token: ${JSON.stringify(err.token)}, Context: ${JSON.stringify(err.context)}, Stack: ${err.stack}`).join("\n")}`,
    )
  }

  const visitor = new GerberToTreeVisitor()
  // visitor.warnings
  return visitor.visit(cst) as Shapes.Shape[]
}
