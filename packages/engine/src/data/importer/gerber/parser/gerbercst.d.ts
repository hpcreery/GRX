import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface ProgramCstNode extends CstNode {
  name: "program";
  children: ProgramCstChildren;
}

export type ProgramCstChildren = {
  command?: CommandCstNode[];
};

export interface CommandCstNode extends CstNode {
  name: "command";
  children: CommandCstChildren;
}

export type CommandCstChildren = {
  functionCodeCommand?: FunctionCodeCommandCstNode[];
  extendedCommand?: ExtendedCommandCstNode[];
  apertureMacroCommand?: ApertureMacroCommandCstNode[];
};

export interface ExtendedCommandDataBlockCstNode extends CstNode {
  name: "extendedCommandDataBlock";
  children: ExtendedCommandDataBlockCstChildren;
}

export type ExtendedCommandDataBlockCstChildren = {
  formatSpecificationCommand?: FormatSpecificationCommandCstNode[];
  unitsCommand?: UnitsCommandCstNode[];
  apertureDefinitionCommand?: ApertureDefinitionCommandCstNode[];
  polarityCommand?: PolarityCommandCstNode[];
  mirroringCommand?: MirroringCommandCstNode[];
  rotationCommand?: RotationCommandCstNode[];
  scalingCommand?: ScalingCommandCstNode[];
  stepRepeatOpenCommand?: StepRepeatOpenCommandCstNode[];
  stepRepeatCloseCommand?: StepRepeatCloseCommandCstNode[];
  blockApertureOpenCommand?: BlockApertureOpenCommandCstNode[];
  blockApertureCloseCommand?: BlockApertureCloseCommandCstNode[];
  Star: IToken[];
};

export interface ExtendedCommandCstNode extends CstNode {
  name: "extendedCommand";
  children: ExtendedCommandCstChildren;
}

export type ExtendedCommandCstChildren = {
  Percent: (IToken)[];
  extendedCommandDataBlock: ExtendedCommandDataBlockCstNode[];
};

export interface FunctionCodeCommandCstNode extends CstNode {
  name: "functionCodeCommand";
  children: FunctionCodeCommandCstChildren;
}

export type FunctionCodeCommandCstChildren = {
  commentCommand?: CommentCommandCstNode[];
  endCommand?: EndCommandCstNode[];
  inlineInterpolateOperationCommand?: InlineInterpolateOperationCommandCstNode[];
  quadrantSingleCommand?: QuadrantSingleCommandCstNode[];
  quadrantMultiCommand?: QuadrantMultiCommandCstNode[];
  regionStartCommand?: RegionStartCommandCstNode[];
  regionEndCommand?: RegionEndCommandCstNode[];
  g54ToolChangeCommand?: G54ToolChangeCommandCstNode[];
  dCodeCommand?: DCodeCommandCstNode[];
  operationCommand?: OperationCommandCstNode[];
  Star: IToken[];
};

export interface FormatSpecificationCommandCstNode extends CstNode {
  name: "formatSpecificationCommand";
  children: FormatSpecificationCommandCstChildren;
}

export type FormatSpecificationCommandCstChildren = {
  FS: IToken[];
  L?: IToken[];
  T?: IToken[];
  A?: IToken[];
  I?: IToken[];
  X: IToken[];
  Number: (IToken)[];
  Y: IToken[];
};

export interface UnitsCommandCstNode extends CstNode {
  name: "unitsCommand";
  children: UnitsCommandCstChildren;
}

export type UnitsCommandCstChildren = {
  MO: IToken[];
  MM?: IToken[];
  IN?: IToken[];
};

export interface ApertureDefinitionCommandCstNode extends CstNode {
  name: "apertureDefinitionCommand";
  children: ApertureDefinitionCommandCstChildren;
}

export type ApertureDefinitionCommandCstChildren = {
  AD: IToken[];
  Dnn: IToken[];
  Name: IToken[];
  Comma?: IToken[];
  modifiersSet?: ModifiersSetCstNode[];
};

export interface ModifiersSetCstNode extends CstNode {
  name: "modifiersSet";
  children: ModifiersSetCstChildren;
}

export type ModifiersSetCstChildren = {
  Number: (IToken)[];
  X?: IToken[];
};

export interface ApertureMacroCommandCstNode extends CstNode {
  name: "apertureMacroCommand";
  children: ApertureMacroCommandCstChildren;
}

export type ApertureMacroCommandCstChildren = {
  Percent: (IToken)[];
  AM: IToken[];
  Name: IToken[];
  Star: IToken[];
  macroBlock: MacroBlockCstNode[];
};

export interface MacroBlockCstNode extends CstNode {
  name: "macroBlock";
  children: MacroBlockCstChildren;
}

export type MacroBlockCstChildren = {
  macroVariableDefinition?: MacroVariableDefinitionCstNode[];
  macroPrimitive?: MacroPrimitiveCstNode[];
};

export interface MacroVariableDefinitionCstNode extends CstNode {
  name: "macroVariableDefinition";
  children: MacroVariableDefinitionCstChildren;
}

export type MacroVariableDefinitionCstChildren = {
  MacroVariable: IToken[];
  Equals: IToken[];
  expression: ExpressionCstNode[];
  Star: IToken[];
};

export interface MacroPrimitiveCstNode extends CstNode {
  name: "macroPrimitive";
  children: MacroPrimitiveCstChildren;
}

export type MacroPrimitiveCstChildren = {
  macroCommentPrimitive?: MacroCommentPrimitiveCstNode[];
  macroParameterizedPrimitive?: MacroParameterizedPrimitiveCstNode[];
};

export interface MacroCommentPrimitiveCstNode extends CstNode {
  name: "macroCommentPrimitive";
  children: MacroCommentPrimitiveCstChildren;
}

export type MacroCommentPrimitiveCstChildren = {
  UnsignedNumber: IToken[];
  String: IToken[];
  Star: IToken[];
};

export interface MacroParameterizedPrimitiveCstNode extends CstNode {
  name: "macroParameterizedPrimitive";
  children: MacroParameterizedPrimitiveCstChildren;
}

export type MacroParameterizedPrimitiveCstChildren = {
  UnsignedNumber: IToken[];
  macroParameter: MacroParameterCstNode[];
  Star: IToken[];
};

export interface MacroCommentPartCstNode extends CstNode {
  name: "macroCommentPart";
  children: MacroCommentPartCstChildren;
}

export type MacroCommentPartCstChildren = {
  
};

export interface MacroParameterCstNode extends CstNode {
  name: "macroParameter";
  children: MacroParameterCstChildren;
}

export type MacroParameterCstChildren = {
  Comma: IToken[];
  expression: ExpressionCstNode[];
};

export interface ExpressionCstNode extends CstNode {
  name: "expression";
  children: ExpressionCstChildren;
}

export type ExpressionCstChildren = {
  term: (TermCstNode)[];
  AddSubOperator?: IToken[];
};

export interface TermCstNode extends CstNode {
  name: "term";
  children: TermCstChildren;
}

export type TermCstChildren = {
  factor: (FactorCstNode)[];
  MulDivOperator?: IToken[];
};

export interface FactorCstNode extends CstNode {
  name: "factor";
  children: FactorCstChildren;
}

export type FactorCstChildren = {
  LParen?: IToken[];
  expression?: ExpressionCstNode[];
  RParen?: IToken[];
  MacroVariable?: IToken[];
  UnsignedNumber?: IToken[];
};

export interface PolarityCommandCstNode extends CstNode {
  name: "polarityCommand";
  children: PolarityCommandCstChildren;
}

export type PolarityCommandCstChildren = {
  LP: IToken[];
  Name: IToken[];
};

export interface MirroringCommandCstNode extends CstNode {
  name: "mirroringCommand";
  children: MirroringCommandCstChildren;
}

export type MirroringCommandCstChildren = {
  LM: IToken[];
  Name: IToken[];
};

export interface RotationCommandCstNode extends CstNode {
  name: "rotationCommand";
  children: RotationCommandCstChildren;
}

export type RotationCommandCstChildren = {
  LR: IToken[];
  Number: IToken[];
};

export interface ScalingCommandCstNode extends CstNode {
  name: "scalingCommand";
  children: ScalingCommandCstChildren;
}

export type ScalingCommandCstChildren = {
  LS: IToken[];
  Number: IToken[];
};

export interface StepRepeatOpenCommandCstNode extends CstNode {
  name: "stepRepeatOpenCommand";
  children: StepRepeatOpenCommandCstChildren;
}

export type StepRepeatOpenCommandCstChildren = {
  SR: IToken[];
  X: IToken[];
  Number: (IToken)[];
  Y: IToken[];
  I: IToken[];
  J: IToken[];
};

export interface StepRepeatCloseCommandCstNode extends CstNode {
  name: "stepRepeatCloseCommand";
  children: StepRepeatCloseCommandCstChildren;
}

export type StepRepeatCloseCommandCstChildren = {
  SR: IToken[];
};

export interface BlockApertureOpenCommandCstNode extends CstNode {
  name: "blockApertureOpenCommand";
  children: BlockApertureOpenCommandCstChildren;
}

export type BlockApertureOpenCommandCstChildren = {
  AB: IToken[];
  Dnn: IToken[];
};

export interface BlockApertureCloseCommandCstNode extends CstNode {
  name: "blockApertureCloseCommand";
  children: BlockApertureCloseCommandCstChildren;
}

export type BlockApertureCloseCommandCstChildren = {
  AB: IToken[];
};

export interface CommentCommandCstNode extends CstNode {
  name: "commentCommand";
  children: CommentCommandCstChildren;
}

export type CommentCommandCstChildren = {
  G04: IToken[];
  String: IToken[];
};

export interface EndCommandCstNode extends CstNode {
  name: "endCommand";
  children: EndCommandCstChildren;
}

export type EndCommandCstChildren = {
  M02: IToken[];
};

export interface InlineInterpolateOperationCommandCstNode extends CstNode {
  name: "inlineInterpolateOperationCommand";
  children: InlineInterpolateOperationCommandCstChildren;
}

export type InlineInterpolateOperationCommandCstChildren = {
  G01?: IToken[];
  G02?: IToken[];
  G03?: IToken[];
  coordinateData?: CoordinateDataCstNode[];
  operationCode?: OperationCodeCstNode[];
};

export interface OperationCodeCstNode extends CstNode {
  name: "operationCode";
  children: OperationCodeCstChildren;
}

export type OperationCodeCstChildren = {
  D01?: IToken[];
  D02?: IToken[];
  D03?: IToken[];
};

export interface QuadrantSingleCommandCstNode extends CstNode {
  name: "quadrantSingleCommand";
  children: QuadrantSingleCommandCstChildren;
}

export type QuadrantSingleCommandCstChildren = {
  G74: IToken[];
};

export interface QuadrantMultiCommandCstNode extends CstNode {
  name: "quadrantMultiCommand";
  children: QuadrantMultiCommandCstChildren;
}

export type QuadrantMultiCommandCstChildren = {
  G75: IToken[];
};

export interface RegionStartCommandCstNode extends CstNode {
  name: "regionStartCommand";
  children: RegionStartCommandCstChildren;
}

export type RegionStartCommandCstChildren = {
  G36: IToken[];
};

export interface RegionEndCommandCstNode extends CstNode {
  name: "regionEndCommand";
  children: RegionEndCommandCstChildren;
}

export type RegionEndCommandCstChildren = {
  G37: IToken[];
};

export interface G54ToolChangeCommandCstNode extends CstNode {
  name: "g54ToolChangeCommand";
  children: G54ToolChangeCommandCstChildren;
}

export type G54ToolChangeCommandCstChildren = {
  G54: IToken[];
  Dnn: IToken[];
};

export interface DCodeCommandCstNode extends CstNode {
  name: "dCodeCommand";
  children: DCodeCommandCstChildren;
}

export type DCodeCommandCstChildren = {
  Dnn: IToken[];
};

export interface OperationCommandCstNode extends CstNode {
  name: "operationCommand";
  children: OperationCommandCstChildren;
}

export type OperationCommandCstChildren = {
  coordinateData?: CoordinateDataCstNode[];
  operationCode?: (OperationCodeCstNode)[];
};

export interface UnknownWordCommandCstNode extends CstNode {
  name: "unknownWordCommand";
  children: UnknownWordCommandCstChildren;
}

export type UnknownWordCommandCstChildren = {
  UnknownWordCommand: IToken[];
};

export interface CoordinateDataCstNode extends CstNode {
  name: "coordinateData";
  children: CoordinateDataCstChildren;
}

export type CoordinateDataCstChildren = {
  coordinateField?: CoordinateFieldCstNode[];
};

export interface CoordinateFieldCstNode extends CstNode {
  name: "coordinateField";
  children: CoordinateFieldCstChildren;
}

export type CoordinateFieldCstChildren = {
  xCoordinate?: XCoordinateCstNode[];
  yCoordinate?: YCoordinateCstNode[];
  iCoordinate?: ICoordinateCstNode[];
  jCoordinate?: JCoordinateCstNode[];
  aCoordinate?: ACoordinateCstNode[];
};

export interface XCoordinateCstNode extends CstNode {
  name: "xCoordinate";
  children: XCoordinateCstChildren;
}

export type XCoordinateCstChildren = {
  X: IToken[];
  Number: IToken[];
};

export interface YCoordinateCstNode extends CstNode {
  name: "yCoordinate";
  children: YCoordinateCstChildren;
}

export type YCoordinateCstChildren = {
  Y: IToken[];
  Number: IToken[];
};

export interface ICoordinateCstNode extends CstNode {
  name: "iCoordinate";
  children: ICoordinateCstChildren;
}

export type ICoordinateCstChildren = {
  I: IToken[];
  Number: IToken[];
};

export interface JCoordinateCstNode extends CstNode {
  name: "jCoordinate";
  children: JCoordinateCstChildren;
}

export type JCoordinateCstChildren = {
  J: IToken[];
  Number: IToken[];
};

export interface ACoordinateCstNode extends CstNode {
  name: "aCoordinate";
  children: ACoordinateCstChildren;
}

export type ACoordinateCstChildren = {
  A: IToken[];
  Number: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  program(children: ProgramCstChildren, param?: IN): OUT;
  command(children: CommandCstChildren, param?: IN): OUT;
  extendedCommandDataBlock(children: ExtendedCommandDataBlockCstChildren, param?: IN): OUT;
  extendedCommand(children: ExtendedCommandCstChildren, param?: IN): OUT;
  functionCodeCommand(children: FunctionCodeCommandCstChildren, param?: IN): OUT;
  formatSpecificationCommand(children: FormatSpecificationCommandCstChildren, param?: IN): OUT;
  unitsCommand(children: UnitsCommandCstChildren, param?: IN): OUT;
  apertureDefinitionCommand(children: ApertureDefinitionCommandCstChildren, param?: IN): OUT;
  modifiersSet(children: ModifiersSetCstChildren, param?: IN): OUT;
  apertureMacroCommand(children: ApertureMacroCommandCstChildren, param?: IN): OUT;
  macroBlock(children: MacroBlockCstChildren, param?: IN): OUT;
  macroVariableDefinition(children: MacroVariableDefinitionCstChildren, param?: IN): OUT;
  macroPrimitive(children: MacroPrimitiveCstChildren, param?: IN): OUT;
  macroCommentPrimitive(children: MacroCommentPrimitiveCstChildren, param?: IN): OUT;
  macroParameterizedPrimitive(children: MacroParameterizedPrimitiveCstChildren, param?: IN): OUT;
  macroCommentPart(children: MacroCommentPartCstChildren, param?: IN): OUT;
  macroParameter(children: MacroParameterCstChildren, param?: IN): OUT;
  expression(children: ExpressionCstChildren, param?: IN): OUT;
  term(children: TermCstChildren, param?: IN): OUT;
  factor(children: FactorCstChildren, param?: IN): OUT;
  polarityCommand(children: PolarityCommandCstChildren, param?: IN): OUT;
  mirroringCommand(children: MirroringCommandCstChildren, param?: IN): OUT;
  rotationCommand(children: RotationCommandCstChildren, param?: IN): OUT;
  scalingCommand(children: ScalingCommandCstChildren, param?: IN): OUT;
  stepRepeatOpenCommand(children: StepRepeatOpenCommandCstChildren, param?: IN): OUT;
  stepRepeatCloseCommand(children: StepRepeatCloseCommandCstChildren, param?: IN): OUT;
  blockApertureOpenCommand(children: BlockApertureOpenCommandCstChildren, param?: IN): OUT;
  blockApertureCloseCommand(children: BlockApertureCloseCommandCstChildren, param?: IN): OUT;
  commentCommand(children: CommentCommandCstChildren, param?: IN): OUT;
  endCommand(children: EndCommandCstChildren, param?: IN): OUT;
  inlineInterpolateOperationCommand(children: InlineInterpolateOperationCommandCstChildren, param?: IN): OUT;
  operationCode(children: OperationCodeCstChildren, param?: IN): OUT;
  quadrantSingleCommand(children: QuadrantSingleCommandCstChildren, param?: IN): OUT;
  quadrantMultiCommand(children: QuadrantMultiCommandCstChildren, param?: IN): OUT;
  regionStartCommand(children: RegionStartCommandCstChildren, param?: IN): OUT;
  regionEndCommand(children: RegionEndCommandCstChildren, param?: IN): OUT;
  g54ToolChangeCommand(children: G54ToolChangeCommandCstChildren, param?: IN): OUT;
  dCodeCommand(children: DCodeCommandCstChildren, param?: IN): OUT;
  operationCommand(children: OperationCommandCstChildren, param?: IN): OUT;
  unknownWordCommand(children: UnknownWordCommandCstChildren, param?: IN): OUT;
  coordinateData(children: CoordinateDataCstChildren, param?: IN): OUT;
  coordinateField(children: CoordinateFieldCstChildren, param?: IN): OUT;
  xCoordinate(children: XCoordinateCstChildren, param?: IN): OUT;
  yCoordinate(children: YCoordinateCstChildren, param?: IN): OUT;
  iCoordinate(children: ICoordinateCstChildren, param?: IN): OUT;
  jCoordinate(children: JCoordinateCstChildren, param?: IN): OUT;
  aCoordinate(children: ACoordinateCstChildren, param?: IN): OUT;
}
