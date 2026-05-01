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
  star?: StarCstNode[];
};

export interface ExtendedCommandCstNode extends CstNode {
  name: "extendedCommand";
  children: ExtendedCommandCstChildren;
}

export type ExtendedCommandCstChildren = {
  percent: (PercentCstNode)[];
  extendedCommandDataBlock: ExtendedCommandDataBlockCstNode[];
};

export interface ExtendedCommandDataBlockCstNode extends CstNode {
  name: "extendedCommandDataBlock";
  children: ExtendedCommandDataBlockCstChildren;
}

export type ExtendedCommandDataBlockCstChildren = {
  formatSpecificationCommand?: FormatSpecificationCommandCstNode[];
  unitsCommand?: UnitsCommandCstNode[];
  apertureDefinitionCommand?: ApertureDefinitionCommandCstNode[];
  apertureMacroCommand?: ApertureMacroCommandCstNode[];
  polarityCommand?: PolarityCommandCstNode[];
  mirroringCommand?: MirroringCommandCstNode[];
  rotationCommand?: RotationCommandCstNode[];
  scalingCommand?: ScalingCommandCstNode[];
  stepRepeatOpenCommand?: StepRepeatOpenCommandCstNode[];
  stepRepeatCloseCommand?: StepRepeatCloseCommandCstNode[];
  blockApertureOpenCommand?: BlockApertureOpenCommandCstNode[];
  blockApertureCloseCommand?: BlockApertureCloseCommandCstNode[];
  imagePolarityCommand?: ImagePolarityCommandCstNode[];
  axisSelectionCommand?: AxisSelectionCommandCstNode[];
  imageRotationCommand?: ImageRotationCommandCstNode[];
  mirrorImageCommand?: MirrorImageCommandCstNode[];
  imageOffsetCommand?: ImageOffsetCommandCstNode[];
  scaleFactorCommand?: ScaleFactorCommandCstNode[];
  imageNameCommand?: ImageNameCommandCstNode[];
  loadNameCommand?: LoadNameCommandCstNode[];
  fileAttributesCommand?: FileAttributesCommandCstNode[];
  apertureAttributesCommand?: ApertureAttributesCommandCstNode[];
  objectAttributesCommand?: ObjectAttributesCommandCstNode[];
  deleteAttributesCommand?: DeleteAttributesCommandCstNode[];
  star: StarCstNode[];
};

export interface FunctionCodeCommandCstNode extends CstNode {
  name: "functionCodeCommand";
  children: FunctionCodeCommandCstChildren;
}

export type FunctionCodeCommandCstChildren = {
  commentCommand?: CommentCommandCstNode[];
  endCommand?: EndCommandCstNode[];
  inlineInterpolateOperationCommand?: InlineInterpolateOperationCommandCstNode[];
  linearInterpolationCommand?: LinearInterpolationCommandCstNode[];
  circularInterpolationClockwiseCommand?: CircularInterpolationClockwiseCommandCstNode[];
  circularInterpolationCounterClockwiseCommand?: CircularInterpolationCounterClockwiseCommandCstNode[];
  quadrantSingleCommand?: QuadrantSingleCommandCstNode[];
  quadrantMultiCommand?: QuadrantMultiCommandCstNode[];
  regionStartCommand?: RegionStartCommandCstNode[];
  regionEndCommand?: RegionEndCommandCstNode[];
  dCodeCommand?: DCodeCommandCstNode[];
  operationCommand?: OperationCommandCstNode[];
  absoluteNotationCommand?: AbsoluteNotationCommandCstNode[];
  incrementalNotationCommand?: IncrementalNotationCommandCstNode[];
  prepareApertureCommand?: PrepareApertureCommandCstNode[];
  prepareFlashCommand?: PrepareFlashCommandCstNode[];
  inchModeCommand?: InchModeCommandCstNode[];
  metricModeCommand?: MetricModeCommandCstNode[];
  optionalStopCommand?: OptionalStopCommandCstNode[];
  star: StarCstNode[];
};

export interface StarCstNode extends CstNode {
  name: "star";
  children: StarCstChildren;
}

export type StarCstChildren = {
  Star?: (IToken)[];
};

export interface PercentCstNode extends CstNode {
  name: "percent";
  children: PercentCstChildren;
}

export type PercentCstChildren = {
  Percent?: (IToken)[];
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
};

export interface ApertureDefinitionCommandCstNode extends CstNode {
  name: "apertureDefinitionCommand";
  children: ApertureDefinitionCommandCstChildren;
}

export type ApertureDefinitionCommandCstChildren = {
  AD: IToken[];
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
  CommentPrimative: IToken[];
  String: IToken[];
};

export interface MacroParameterizedPrimitiveCstNode extends CstNode {
  name: "macroParameterizedPrimitive";
  children: MacroParameterizedPrimitiveCstChildren;
}

export type MacroParameterizedPrimitiveCstChildren = {
  UnsignedNumber: IToken[];
  macroParameter: MacroParameterCstNode[];
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
  M02?: IToken[];
  M00?: IToken[];
};

export interface LinearInterpolationCommandCstNode extends CstNode {
  name: "linearInterpolationCommand";
  children: LinearInterpolationCommandCstChildren;
}

export type LinearInterpolationCommandCstChildren = {
  G01: IToken[];
};

export interface CircularInterpolationClockwiseCommandCstNode extends CstNode {
  name: "circularInterpolationClockwiseCommand";
  children: CircularInterpolationClockwiseCommandCstChildren;
}

export type CircularInterpolationClockwiseCommandCstChildren = {
  G02: IToken[];
};

export interface CircularInterpolationCounterClockwiseCommandCstNode extends CstNode {
  name: "circularInterpolationCounterClockwiseCommand";
  children: CircularInterpolationCounterClockwiseCommandCstChildren;
}

export type CircularInterpolationCounterClockwiseCommandCstChildren = {
  G03: IToken[];
};

export interface InlineInterpolateOperationCommandCstNode extends CstNode {
  name: "inlineInterpolateOperationCommand";
  children: InlineInterpolateOperationCommandCstChildren;
}

export type InlineInterpolateOperationCommandCstChildren = {
  linearInterpolationCommand?: LinearInterpolationCommandCstNode[];
  circularInterpolationClockwiseCommand?: CircularInterpolationClockwiseCommandCstNode[];
  circularInterpolationCounterClockwiseCommand?: CircularInterpolationCounterClockwiseCommandCstNode[];
  operationCommand: OperationCommandCstNode[];
};

export interface OperationCommandCstNode extends CstNode {
  name: "operationCommand";
  children: OperationCommandCstChildren;
}

export type OperationCommandCstChildren = {
  coordinateData?: CoordinateDataCstNode[];
  operationCode?: (OperationCodeCstNode)[];
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

export interface DCodeCommandCstNode extends CstNode {
  name: "dCodeCommand";
  children: DCodeCommandCstChildren;
}

export type DCodeCommandCstChildren = {
  Dnn: IToken[];
};

export interface CoordinateDataCstNode extends CstNode {
  name: "coordinateData";
  children: CoordinateDataCstChildren;
}

export type CoordinateDataCstChildren = {
  coordinateField: CoordinateFieldCstNode[];
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

export interface FileAttributesCommandCstNode extends CstNode {
  name: "fileAttributesCommand";
  children: FileAttributesCommandCstChildren;
}

export type FileAttributesCommandCstChildren = {
  TF: IToken[];
  Name: IToken[];
  Comma?: IToken[];
  Field?: IToken[];
};

export interface ApertureAttributesCommandCstNode extends CstNode {
  name: "apertureAttributesCommand";
  children: ApertureAttributesCommandCstChildren;
}

export type ApertureAttributesCommandCstChildren = {
  TA: IToken[];
  Name: IToken[];
  Comma?: IToken[];
  Field?: IToken[];
};

export interface ObjectAttributesCommandCstNode extends CstNode {
  name: "objectAttributesCommand";
  children: ObjectAttributesCommandCstChildren;
}

export type ObjectAttributesCommandCstChildren = {
  TO: IToken[];
  Name: IToken[];
  Comma?: IToken[];
  Field?: IToken[];
};

export interface DeleteAttributesCommandCstNode extends CstNode {
  name: "deleteAttributesCommand";
  children: DeleteAttributesCommandCstChildren;
}

export type DeleteAttributesCommandCstChildren = {
  TD: IToken[];
  Name?: IToken[];
};

export interface PrepareApertureCommandCstNode extends CstNode {
  name: "prepareApertureCommand";
  children: PrepareApertureCommandCstChildren;
}

export type PrepareApertureCommandCstChildren = {
  G54: IToken[];
  dCodeCommand: DCodeCommandCstNode[];
};

export interface PrepareFlashCommandCstNode extends CstNode {
  name: "prepareFlashCommand";
  children: PrepareFlashCommandCstChildren;
}

export type PrepareFlashCommandCstChildren = {
  G55: IToken[];
  D03: IToken[];
};

export interface InchModeCommandCstNode extends CstNode {
  name: "inchModeCommand";
  children: InchModeCommandCstChildren;
}

export type InchModeCommandCstChildren = {
  G70: IToken[];
};

export interface MetricModeCommandCstNode extends CstNode {
  name: "metricModeCommand";
  children: MetricModeCommandCstChildren;
}

export type MetricModeCommandCstChildren = {
  G71: IToken[];
};

export interface OptionalStopCommandCstNode extends CstNode {
  name: "optionalStopCommand";
  children: OptionalStopCommandCstChildren;
}

export type OptionalStopCommandCstChildren = {
  M01: IToken[];
};

export interface AbsoluteNotationCommandCstNode extends CstNode {
  name: "absoluteNotationCommand";
  children: AbsoluteNotationCommandCstChildren;
}

export type AbsoluteNotationCommandCstChildren = {
  G90: IToken[];
};

export interface IncrementalNotationCommandCstNode extends CstNode {
  name: "incrementalNotationCommand";
  children: IncrementalNotationCommandCstChildren;
}

export type IncrementalNotationCommandCstChildren = {
  G91: IToken[];
};

export interface ImagePolarityCommandCstNode extends CstNode {
  name: "imagePolarityCommand";
  children: ImagePolarityCommandCstChildren;
}

export type ImagePolarityCommandCstChildren = {
  IP: IToken[];
  POS?: IToken[];
  NEG?: IToken[];
};

export interface AxisSelectionCommandCstNode extends CstNode {
  name: "axisSelectionCommand";
  children: AxisSelectionCommandCstChildren;
}

export type AxisSelectionCommandCstChildren = {
  AS: IToken[];
  A?: (IToken)[];
  X?: (IToken)[];
  B?: (IToken)[];
  Y?: (IToken)[];
};

export interface ImageRotationCommandCstNode extends CstNode {
  name: "imageRotationCommand";
  children: ImageRotationCommandCstChildren;
}

export type ImageRotationCommandCstChildren = {
  IR: IToken[];
  Number: IToken[];
};

export interface MirrorImageCommandCstNode extends CstNode {
  name: "mirrorImageCommand";
  children: MirrorImageCommandCstChildren;
}

export type MirrorImageCommandCstChildren = {
  MI: IToken[];
  A?: IToken[];
  Number?: (IToken)[];
  B?: IToken[];
};

export interface ImageOffsetCommandCstNode extends CstNode {
  name: "imageOffsetCommand";
  children: ImageOffsetCommandCstChildren;
}

export type ImageOffsetCommandCstChildren = {
  OF: IToken[];
  A?: IToken[];
  Number?: (IToken)[];
  B?: IToken[];
};

export interface ScaleFactorCommandCstNode extends CstNode {
  name: "scaleFactorCommand";
  children: ScaleFactorCommandCstChildren;
}

export type ScaleFactorCommandCstChildren = {
  SF: IToken[];
  A?: IToken[];
  Number?: (IToken)[];
  B?: IToken[];
};

export interface ImageNameCommandCstNode extends CstNode {
  name: "imageNameCommand";
  children: ImageNameCommandCstChildren;
}

export type ImageNameCommandCstChildren = {
  IN: IToken[];
  Name: IToken[];
};

export interface LoadNameCommandCstNode extends CstNode {
  name: "loadNameCommand";
  children: LoadNameCommandCstChildren;
}

export type LoadNameCommandCstChildren = {
  LN: IToken[];
  Name: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  program(children: ProgramCstChildren, param?: IN): OUT;
  command(children: CommandCstChildren, param?: IN): OUT;
  extendedCommand(children: ExtendedCommandCstChildren, param?: IN): OUT;
  extendedCommandDataBlock(children: ExtendedCommandDataBlockCstChildren, param?: IN): OUT;
  functionCodeCommand(children: FunctionCodeCommandCstChildren, param?: IN): OUT;
  star(children: StarCstChildren, param?: IN): OUT;
  percent(children: PercentCstChildren, param?: IN): OUT;
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
  linearInterpolationCommand(children: LinearInterpolationCommandCstChildren, param?: IN): OUT;
  circularInterpolationClockwiseCommand(children: CircularInterpolationClockwiseCommandCstChildren, param?: IN): OUT;
  circularInterpolationCounterClockwiseCommand(children: CircularInterpolationCounterClockwiseCommandCstChildren, param?: IN): OUT;
  inlineInterpolateOperationCommand(children: InlineInterpolateOperationCommandCstChildren, param?: IN): OUT;
  operationCommand(children: OperationCommandCstChildren, param?: IN): OUT;
  operationCode(children: OperationCodeCstChildren, param?: IN): OUT;
  quadrantSingleCommand(children: QuadrantSingleCommandCstChildren, param?: IN): OUT;
  quadrantMultiCommand(children: QuadrantMultiCommandCstChildren, param?: IN): OUT;
  regionStartCommand(children: RegionStartCommandCstChildren, param?: IN): OUT;
  regionEndCommand(children: RegionEndCommandCstChildren, param?: IN): OUT;
  dCodeCommand(children: DCodeCommandCstChildren, param?: IN): OUT;
  coordinateData(children: CoordinateDataCstChildren, param?: IN): OUT;
  coordinateField(children: CoordinateFieldCstChildren, param?: IN): OUT;
  xCoordinate(children: XCoordinateCstChildren, param?: IN): OUT;
  yCoordinate(children: YCoordinateCstChildren, param?: IN): OUT;
  iCoordinate(children: ICoordinateCstChildren, param?: IN): OUT;
  jCoordinate(children: JCoordinateCstChildren, param?: IN): OUT;
  aCoordinate(children: ACoordinateCstChildren, param?: IN): OUT;
  fileAttributesCommand(children: FileAttributesCommandCstChildren, param?: IN): OUT;
  apertureAttributesCommand(children: ApertureAttributesCommandCstChildren, param?: IN): OUT;
  objectAttributesCommand(children: ObjectAttributesCommandCstChildren, param?: IN): OUT;
  deleteAttributesCommand(children: DeleteAttributesCommandCstChildren, param?: IN): OUT;
  prepareApertureCommand(children: PrepareApertureCommandCstChildren, param?: IN): OUT;
  prepareFlashCommand(children: PrepareFlashCommandCstChildren, param?: IN): OUT;
  inchModeCommand(children: InchModeCommandCstChildren, param?: IN): OUT;
  metricModeCommand(children: MetricModeCommandCstChildren, param?: IN): OUT;
  optionalStopCommand(children: OptionalStopCommandCstChildren, param?: IN): OUT;
  absoluteNotationCommand(children: AbsoluteNotationCommandCstChildren, param?: IN): OUT;
  incrementalNotationCommand(children: IncrementalNotationCommandCstChildren, param?: IN): OUT;
  imagePolarityCommand(children: ImagePolarityCommandCstChildren, param?: IN): OUT;
  axisSelectionCommand(children: AxisSelectionCommandCstChildren, param?: IN): OUT;
  imageRotationCommand(children: ImageRotationCommandCstChildren, param?: IN): OUT;
  mirrorImageCommand(children: MirrorImageCommandCstChildren, param?: IN): OUT;
  imageOffsetCommand(children: ImageOffsetCommandCstChildren, param?: IN): OUT;
  scaleFactorCommand(children: ScaleFactorCommandCstChildren, param?: IN): OUT;
  imageNameCommand(children: ImageNameCommandCstChildren, param?: IN): OUT;
  loadNameCommand(children: LoadNameCommandCstChildren, param?: IN): OUT;
}
