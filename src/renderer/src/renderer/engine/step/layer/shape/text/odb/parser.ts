import { Lexer, createToken, CstParser, CstNode, ParserMethod, IToken, Rule } from "chevrotain"
import { generateCstDts } from "chevrotain"
import standardFont from "./standard?raw"

const SHXTokens = {
  WhiteSpace: createToken({ name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED }),
  NewLine: createToken({ name: "NewLine", pattern: /\r?\n/, line_breaks: true }),
  Number: createToken({ name: "Number", pattern: /[+-]?(?:\d+\.?(?:\d+)?|\.\d+)/ }),
  CharacterStart: createToken({ name: "CharacterStart", pattern: /CHAR/ }),
  CharacterEnd: createToken({ name: "CharacterEnd", pattern: /ECHAR/ }),
  Positive: createToken({ name: "Positive", pattern: /P/ }),
  Negative: createToken({ name: "Negative", pattern: /N/ }),
  XSize: createToken({ name: "XSize", pattern: /XSIZE/ }),
  YSize: createToken({ name: "YSize", pattern: /YSIZE/ }),
  Offset: createToken({ name: "Offset", pattern: /OFFSET/ }),
  Character: createToken({ name: "Character", pattern: /./ }),
  Round: createToken({ name: "Round", pattern: /R/ }),
  Square: createToken({ name: "Square", pattern: /S/ }),
} as const

const SHXTokensList = Object.values(SHXTokens)

export const SHXLexer = new Lexer(SHXTokensList)

class SHXParser extends CstParser {
  program!: ParserMethod<unknown[], CstNode>
  header!: ParserMethod<unknown[], CstNode>
  character!: ParserMethod<unknown[], CstNode>
  characterBody!: ParserMethod<unknown[], CstNode>
  xSize!: ParserMethod<unknown[], CstNode>
  ySize!: ParserMethod<unknown[], CstNode>
  offset!: ParserMethod<unknown[], CstNode>
  line!: ParserMethod<unknown[], CstNode>

  constructor() {
    super(SHXTokensList, {
      recoveryEnabled: true,
      // maxLookahead: 2,
    })

    this.RULE("program", () => {
      this.MANY(() => {
        this.SUBRULE(this.character)
      })
    })

    this.RULE("header", () => {
      this.SUBRULE(this.xSize)
      this.SUBRULE(this.ySize)
      this.SUBRULE(this.offset)
    })

    this.RULE("character", () => {
      this.CONSUME(SHXTokens.CharacterStart)
      this.CONSUME(SHXTokens.Character)
      this.CONSUME(SHXTokens.NewLine)
      this.SUBRULE(this.characterBody)
      this.CONSUME(SHXTokens.CharacterEnd)
    })

    this.RULE("characterBody", () => {
      this.MANY(() => {
        this.SUBRULE(this.line)
      })
    })

    this.RULE("xSize", () => {
      this.CONSUME(SHXTokens.XSize)
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.NewLine)
    })

    this.RULE("ySize", () => {
      this.CONSUME(SHXTokens.YSize)
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.NewLine)
    })

    this.RULE("offset", () => {
      this.CONSUME(SHXTokens.Offset)
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.NewLine)
    })

    this.RULE("line", () => {
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.Number)
      this.OR([{ ALT: (): IToken => this.CONSUME(SHXTokens.Positive) }, { ALT: (): IToken => this.CONSUME(SHXTokens.Negative) }])
      this.OR([{ ALT: (): IToken => this.CONSUME(SHXTokens.Round) }, { ALT: (): IToken => this.CONSUME(SHXTokens.Square) }])
      this.CONSUME(SHXTokens.Number)
      this.CONSUME(SHXTokens.NewLine)
    })

    this.performSelfAnalysis()
  }
}

export const parser = new SHXParser()
export const productions: Record<string, Rule> = parser.getGAstProductions()

const GENERATEDTS = false
if (GENERATEDTS) {
  const dtsString = generateCstDts(productions)
  console.log(dtsString)
}

const BaseCstVisitor = parser.getBaseCstVisitorConstructor()
// const BaseCstVisitor = parser.getBaseCstVisitorConstructorWithDefaults();

export class SHXToShapesVisitor extends BaseCstVisitor {
  constructor() {
    super()
    this.validateVisitor()
  }
}

const lexingResult = SHXLexer.tokenize(standardFont)
parser.input = lexingResult.tokens
const result = parser.program()
const visitor = new SHXToShapesVisitor()
visitor.visit(result)
