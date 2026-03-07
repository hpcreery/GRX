import type { CstNode, ICstVisitor, IToken } from "chevrotain"

export interface ProgramCstNode extends CstNode {
  name: "program"
  children: ProgramCstChildren
}

export type ProgramCstChildren = {
  command?: CommandCstNode[]
}

export interface CommandCstNode extends CstNode {
  name: "command"
  children: CommandCstChildren
}

export type CommandCstChildren = {
  units?: UnitsCstNode[]
  incrementalModeSwitch?: IncrementalModeSwitchCstNode[]
  compensationIndex?: CompensationIndexCstNode[]
  toolDefinition?: ToolDefinitionCstNode[]
  toolChange?: ToolChangeCstNode[]
  comment?: CommentCstNode[]
  move?: MoveCstNode[]
  endOfProgramNoRewind?: EndOfProgramNoRewindCstNode[]
  beginPattern?: BeginPatternCstNode[]
  endOfPattern?: EndOfPatternCstNode[]
  repeatPatternOffset?: RepeatPatternOffsetCstNode[]
  optionalStop?: OptionalStopCstNode[]
  endOfStepAndRepeat?: EndOfStepAndRepeatCstNode[]
  stopForInspect?: StopForInspectCstNode[]
  zAxisRoutPositionWithDepthControlledCountoring?: ZAxisRoutPositionWithDepthControlledCountoringCstNode[]
  zAxisRoutPosition?: ZAxisRoutPositionCstNode[]
  retractWithClamping?: RetractWithClampingCstNode[]
  retract?: RetractCstNode[]
  endOfProgramRewind?: EndOfProgramRewindCstNode[]
  longOperatorMessage?: LongOperatorMessageCstNode[]
  operatorMessage?: OperatorMessageCstNode[]
  header?: HeaderCstNode[]
  metricMode?: MetricModeCstNode[]
  inchMode?: InchModeCstNode[]
  routMode?: RoutModeCstNode[]
  linearMove?: LinearMoveCstNode[]
  circularClockwiseMove?: CircularClockwiseMoveCstNode[]
  circularCounterclockwiseMove?: CircularCounterclockwiseMoveCstNode[]
  dwell?: DwellCstNode[]
  drillMode?: DrillModeCstNode[]
  cwCircle?: CwCircleCstNode[]
  ccwCircle?: CcwCircleCstNode[]
  cutterCompensationOff?: CutterCompensationOffCstNode[]
  cutterCompensationLeft?: CutterCompensationLeftCstNode[]
  cutterCompensationRight?: CutterCompensationRightCstNode[]
  absoluteMode?: AbsoluteModeCstNode[]
  incrementalMode?: IncrementalModeCstNode[]
  zeroSet?: ZeroSetCstNode[]
  headerEnd?: HeaderEndCstNode[]
  selectVisionTool?: SelectVisionToolCstNode[]
  singlePointVisionOffset?: SinglePointVisionOffsetCstNode[]
  multiPointVisionOffset?: MultiPointVisionOffsetCstNode[]
  cancelVisionOffset?: CancelVisionOffsetCstNode[]
  visionCorrectedSingleHole?: VisionCorrectedSingleHoleCstNode[]
  visionAutoCalibration?: VisionAutoCalibrationCstNode[]
  cannedSlot?: CannedSlotCstNode[]
  cannedCircle?: CannedCircleCstNode[]
  repeatHole?: RepeatHoleCstNode[]
}

export interface UnitsCstNode extends CstNode {
  name: "units"
  children: UnitsCstChildren
}

export type UnitsCstChildren = {
  Units: IToken[]
  Comma?: IToken[]
  TrailingZeros?: IToken[]
  LeadingZeros?: IToken[]
  Number?: IToken[]
}

export interface IncrementalModeSwitchCstNode extends CstNode {
  name: "incrementalModeSwitch"
  children: IncrementalModeSwitchCstChildren
}

export type IncrementalModeSwitchCstChildren = {
  IncrementalMode: IToken[]
  Comma: IToken[]
  On?: IToken[]
  Off?: IToken[]
}

export interface HeaderEndCstNode extends CstNode {
  name: "headerEnd"
  children: HeaderEndCstChildren
}

export type HeaderEndCstChildren = {
  Percent: IToken[]
}

export interface CommentCstNode extends CstNode {
  name: "comment"
  children: CommentCstChildren
}

export type CommentCstChildren = {
  LParen?: IToken[]
  Semicolon?: IToken[]
  Attribute?: IToken[]
  Text?: IToken[]
  NewLine?: IToken[]
  RParen?: IToken[]
}

export interface CompensationIndexCstNode extends CstNode {
  name: "compensationIndex"
  children: CompensationIndexCstChildren
}

export type CompensationIndexCstChildren = {
  CP: IToken[]
  Comma: IToken[]
  Number: IToken[]
}

export interface ToolChangeCstNode extends CstNode {
  name: "toolChange"
  children: ToolChangeCstChildren
}

export type ToolChangeCstChildren = {
  T: IToken[]
}

export interface ToolDefinitionCstNode extends CstNode {
  name: "toolDefinition"
  children: ToolDefinitionCstChildren
}

export type ToolDefinitionCstChildren = {
  T: IToken[]
  toolDia: ToolDiaCstNode[]
  feed?: FeedCstNode[]
  speed?: SpeedCstNode[]
  retractRate?: RetractRateCstNode[]
  hitCount?: HitCountCstNode[]
  depthOffset?: DepthOffsetCstNode[]
}

export interface ToolDiaCstNode extends CstNode {
  name: "toolDia"
  children: ToolDiaCstChildren
}

export type ToolDiaCstChildren = {
  C: IToken[]
  Number: IToken[]
}

export interface FeedCstNode extends CstNode {
  name: "feed"
  children: FeedCstChildren
}

export type FeedCstChildren = {
  F: IToken[]
  Number?: IToken[]
}

export interface SpeedCstNode extends CstNode {
  name: "speed"
  children: SpeedCstChildren
}

export type SpeedCstChildren = {
  S: IToken[]
  Number?: IToken[]
}

export interface RetractRateCstNode extends CstNode {
  name: "retractRate"
  children: RetractRateCstChildren
}

export type RetractRateCstChildren = {
  B: IToken[]
  Number: IToken[]
}

export interface HitCountCstNode extends CstNode {
  name: "hitCount"
  children: HitCountCstChildren
}

export type HitCountCstChildren = {
  H: IToken[]
  Number: IToken[]
}

export interface DepthOffsetCstNode extends CstNode {
  name: "depthOffset"
  children: DepthOffsetCstChildren
}

export type DepthOffsetCstChildren = {
  Z: IToken[]
  Number: IToken[]
}

export interface XCstNode extends CstNode {
  name: "x"
  children: XCstChildren
}

export type XCstChildren = {
  X: IToken[]
  Number?: IToken[]
}

export interface YCstNode extends CstNode {
  name: "y"
  children: YCstChildren
}

export type YCstChildren = {
  Y: IToken[]
  Number?: IToken[]
}

export interface CoordinateCstNode extends CstNode {
  name: "coordinate"
  children: CoordinateCstChildren
}

export type CoordinateCstChildren = {
  xy?: XyCstNode[]
  xory?: XoryCstNode[]
}

export interface XyCstNode extends CstNode {
  name: "xy"
  children: XyCstChildren
}

export type XyCstChildren = {
  x: XCstNode[]
  y: YCstNode[]
}

export interface XoryCstNode extends CstNode {
  name: "xory"
  children: XoryCstChildren
}

export type XoryCstChildren = {
  x?: XCstNode[]
  y?: YCstNode[]
}

export interface ArcRadiusCstNode extends CstNode {
  name: "arcRadius"
  children: ArcRadiusCstChildren
}

export type ArcRadiusCstChildren = {
  A: IToken[]
  Number: IToken[]
}

export interface ArcCenterCstNode extends CstNode {
  name: "arcCenter"
  children: ArcCenterCstChildren
}

export type ArcCenterCstChildren = {
  I: IToken[]
  Number: IToken[]
  J: IToken[]
}

export interface MoveCstNode extends CstNode {
  name: "move"
  children: MoveCstChildren
}

export type MoveCstChildren = {
  coordinate: CoordinateCstNode[]
  arcRadius?: ArcRadiusCstNode[]
  arcCenter?: ArcCenterCstNode[]
}

export interface EndOfProgramNoRewindCstNode extends CstNode {
  name: "endOfProgramNoRewind"
  children: EndOfProgramNoRewindCstChildren
}

export type EndOfProgramNoRewindCstChildren = {
  M00: IToken[]
  coordinate?: CoordinateCstNode[]
}

export interface BeginPatternCstNode extends CstNode {
  name: "beginPattern"
  children: BeginPatternCstChildren
}

export type BeginPatternCstChildren = {
  M25: IToken[]
}

export interface EndOfPatternCstNode extends CstNode {
  name: "endOfPattern"
  children: EndOfPatternCstChildren
}

export type EndOfPatternCstChildren = {
  M01: IToken[]
}

export interface RepeatPatternOffsetCstNode extends CstNode {
  name: "repeatPatternOffset"
  children: RepeatPatternOffsetCstChildren
}

export type RepeatPatternOffsetCstChildren = {
  M02: IToken[]
  coordinate?: CoordinateCstNode[]
  M70?: IToken[]
  M80?: IToken[]
  M90?: IToken[]
}

export interface OptionalStopCstNode extends CstNode {
  name: "optionalStop"
  children: OptionalStopCstChildren
}

export type OptionalStopCstChildren = {
  M06: IToken[]
  coordinate?: CoordinateCstNode[]
}

export interface EndOfStepAndRepeatCstNode extends CstNode {
  name: "endOfStepAndRepeat"
  children: EndOfStepAndRepeatCstChildren
}

export type EndOfStepAndRepeatCstChildren = {
  M06: IToken[]
}

export interface StopForInspectCstNode extends CstNode {
  name: "stopForInspect"
  children: StopForInspectCstChildren
}

export type StopForInspectCstChildren = {
  M09: IToken[]
  coordinate?: CoordinateCstNode[]
}

export interface ZAxisRoutPositionWithDepthControlledCountoringCstNode extends CstNode {
  name: "zAxisRoutPositionWithDepthControlledCountoring"
  children: ZAxisRoutPositionWithDepthControlledCountoringCstChildren
}

export type ZAxisRoutPositionWithDepthControlledCountoringCstChildren = {
  M14: IToken[]
}

export interface ZAxisRoutPositionCstNode extends CstNode {
  name: "zAxisRoutPosition"
  children: ZAxisRoutPositionCstChildren
}

export type ZAxisRoutPositionCstChildren = {
  M15: IToken[]
}

export interface RetractWithClampingCstNode extends CstNode {
  name: "retractWithClamping"
  children: RetractWithClampingCstChildren
}

export type RetractWithClampingCstChildren = {
  M16: IToken[]
}

export interface RetractCstNode extends CstNode {
  name: "retract"
  children: RetractCstChildren
}

export type RetractCstChildren = {
  M17: IToken[]
}

export interface EndOfProgramRewindCstNode extends CstNode {
  name: "endOfProgramRewind"
  children: EndOfProgramRewindCstChildren
}

export type EndOfProgramRewindCstChildren = {
  M30: IToken[]
  coordinate?: CoordinateCstNode[]
}

export interface LongOperatorMessageCstNode extends CstNode {
  name: "longOperatorMessage"
  children: LongOperatorMessageCstChildren
}

export type LongOperatorMessageCstChildren = {
  M45: IToken[]
  Text?: IToken[]
  EndText?: IToken[]
}

export interface OperatorMessageCstNode extends CstNode {
  name: "operatorMessage"
  children: OperatorMessageCstChildren
}

export type OperatorMessageCstChildren = {
  M47: IToken[]
  Text?: IToken[]
  EndText?: IToken[]
}

export interface HeaderCstNode extends CstNode {
  name: "header"
  children: HeaderCstChildren
}

export type HeaderCstChildren = {
  M48: IToken[]
}

export interface MetricModeCstNode extends CstNode {
  name: "metricMode"
  children: MetricModeCstChildren
}

export type MetricModeCstChildren = {
  M71: IToken[]
}

export interface InchModeCstNode extends CstNode {
  name: "inchMode"
  children: InchModeCstChildren
}

export type InchModeCstChildren = {
  M72: IToken[]
}

export interface RoutModeCstNode extends CstNode {
  name: "routMode"
  children: RoutModeCstChildren
}

export type RoutModeCstChildren = {
  G00: IToken[]
  move: MoveCstNode[]
}

export interface LinearMoveCstNode extends CstNode {
  name: "linearMove"
  children: LinearMoveCstChildren
}

export type LinearMoveCstChildren = {
  G01: IToken[]
  move: MoveCstNode[]
}

export interface CircularClockwiseMoveCstNode extends CstNode {
  name: "circularClockwiseMove"
  children: CircularClockwiseMoveCstChildren
}

export type CircularClockwiseMoveCstChildren = {
  G02: IToken[]
  move: MoveCstNode[]
}

export interface CircularCounterclockwiseMoveCstNode extends CstNode {
  name: "circularCounterclockwiseMove"
  children: CircularCounterclockwiseMoveCstChildren
}

export type CircularCounterclockwiseMoveCstChildren = {
  G03: IToken[]
  move: MoveCstNode[]
}

export interface DwellCstNode extends CstNode {
  name: "dwell"
  children: DwellCstChildren
}

export type DwellCstChildren = {
  G04: IToken[]
  Number: IToken[]
}

export interface DrillModeCstNode extends CstNode {
  name: "drillMode"
  children: DrillModeCstChildren
}

export type DrillModeCstChildren = {
  G05: IToken[]
}

export interface CwCircleCstNode extends CstNode {
  name: "cwCircle"
  children: CwCircleCstChildren
}

export type CwCircleCstChildren = {
  G32: IToken[]
  move: MoveCstNode[]
}

export interface CcwCircleCstNode extends CstNode {
  name: "ccwCircle"
  children: CcwCircleCstChildren
}

export type CcwCircleCstChildren = {
  G33: IToken[]
  move: MoveCstNode[]
}

export interface CutterCompensationOffCstNode extends CstNode {
  name: "cutterCompensationOff"
  children: CutterCompensationOffCstChildren
}

export type CutterCompensationOffCstChildren = {
  G40: IToken[]
}

export interface CutterCompensationLeftCstNode extends CstNode {
  name: "cutterCompensationLeft"
  children: CutterCompensationLeftCstChildren
}

export type CutterCompensationLeftCstChildren = {
  G41: IToken[]
}

export interface CutterCompensationRightCstNode extends CstNode {
  name: "cutterCompensationRight"
  children: CutterCompensationRightCstChildren
}

export type CutterCompensationRightCstChildren = {
  G42: IToken[]
}

export interface AbsoluteModeCstNode extends CstNode {
  name: "absoluteMode"
  children: AbsoluteModeCstChildren
}

export type AbsoluteModeCstChildren = {
  G90: IToken[]
}

export interface IncrementalModeCstNode extends CstNode {
  name: "incrementalMode"
  children: IncrementalModeCstChildren
}

export type IncrementalModeCstChildren = {
  G91: IToken[]
}

export interface ZeroSetCstNode extends CstNode {
  name: "zeroSet"
  children: ZeroSetCstChildren
}

export type ZeroSetCstChildren = {
  G93: IToken[]
  xy: XyCstNode[]
}

export interface SelectVisionToolCstNode extends CstNode {
  name: "selectVisionTool"
  children: SelectVisionToolCstChildren
}

export type SelectVisionToolCstChildren = {
  G34: IToken[]
  Text?: IToken[]
  EndText?: IToken[]
}

export interface SinglePointVisionOffsetCstNode extends CstNode {
  name: "singlePointVisionOffset"
  children: SinglePointVisionOffsetCstChildren
}

export type SinglePointVisionOffsetCstChildren = {
  G35: IToken[]
  coordinate: CoordinateCstNode[]
}

export interface MultiPointVisionOffsetCstNode extends CstNode {
  name: "multiPointVisionOffset"
  children: MultiPointVisionOffsetCstChildren
}

export type MultiPointVisionOffsetCstChildren = {
  G36: IToken[]
  coordinate: CoordinateCstNode[]
}

export interface CancelVisionOffsetCstNode extends CstNode {
  name: "cancelVisionOffset"
  children: CancelVisionOffsetCstChildren
}

export type CancelVisionOffsetCstChildren = {
  G37: IToken[]
}

export interface VisionCorrectedSingleHoleCstNode extends CstNode {
  name: "visionCorrectedSingleHole"
  children: VisionCorrectedSingleHoleCstChildren
}

export type VisionCorrectedSingleHoleCstChildren = {
  G38: IToken[]
  coordinate: CoordinateCstNode[]
}

export interface VisionAutoCalibrationCstNode extends CstNode {
  name: "visionAutoCalibration"
  children: VisionAutoCalibrationCstChildren
}

export type VisionAutoCalibrationCstChildren = {
  G39: IToken[]
  Text?: IToken[]
  EndText?: IToken[]
}

export interface CannedSlotCstNode extends CstNode {
  name: "cannedSlot"
  children: CannedSlotCstChildren
}

export type CannedSlotCstChildren = {
  G85: IToken[]
  coordinate: CoordinateCstNode[]
}

export interface CannedCircleCstNode extends CstNode {
  name: "cannedCircle"
  children: CannedCircleCstChildren
}

export type CannedCircleCstChildren = {
  G84: IToken[]
  x: XCstNode[]
}

export interface RepeatHoleCstNode extends CstNode {
  name: "repeatHole"
  children: RepeatHoleCstChildren
}

export type RepeatHoleCstChildren = {
  R: IToken[]
  Number: IToken[]
  coordinate: CoordinateCstNode[]
}

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  program(children: ProgramCstChildren, param?: IN): OUT
  command(children: CommandCstChildren, param?: IN): OUT
  units(children: UnitsCstChildren, param?: IN): OUT
  incrementalModeSwitch(children: IncrementalModeSwitchCstChildren, param?: IN): OUT
  headerEnd(children: HeaderEndCstChildren, param?: IN): OUT
  comment(children: CommentCstChildren, param?: IN): OUT
  compensationIndex(children: CompensationIndexCstChildren, param?: IN): OUT
  toolChange(children: ToolChangeCstChildren, param?: IN): OUT
  toolDefinition(children: ToolDefinitionCstChildren, param?: IN): OUT
  toolDia(children: ToolDiaCstChildren, param?: IN): OUT
  feed(children: FeedCstChildren, param?: IN): OUT
  speed(children: SpeedCstChildren, param?: IN): OUT
  retractRate(children: RetractRateCstChildren, param?: IN): OUT
  hitCount(children: HitCountCstChildren, param?: IN): OUT
  depthOffset(children: DepthOffsetCstChildren, param?: IN): OUT
  x(children: XCstChildren, param?: IN): OUT
  y(children: YCstChildren, param?: IN): OUT
  coordinate(children: CoordinateCstChildren, param?: IN): OUT
  xy(children: XyCstChildren, param?: IN): OUT
  xory(children: XoryCstChildren, param?: IN): OUT
  arcRadius(children: ArcRadiusCstChildren, param?: IN): OUT
  arcCenter(children: ArcCenterCstChildren, param?: IN): OUT
  move(children: MoveCstChildren, param?: IN): OUT
  endOfProgramNoRewind(children: EndOfProgramNoRewindCstChildren, param?: IN): OUT
  beginPattern(children: BeginPatternCstChildren, param?: IN): OUT
  endOfPattern(children: EndOfPatternCstChildren, param?: IN): OUT
  repeatPatternOffset(children: RepeatPatternOffsetCstChildren, param?: IN): OUT
  optionalStop(children: OptionalStopCstChildren, param?: IN): OUT
  endOfStepAndRepeat(children: EndOfStepAndRepeatCstChildren, param?: IN): OUT
  stopForInspect(children: StopForInspectCstChildren, param?: IN): OUT
  zAxisRoutPositionWithDepthControlledCountoring(children: ZAxisRoutPositionWithDepthControlledCountoringCstChildren, param?: IN): OUT
  zAxisRoutPosition(children: ZAxisRoutPositionCstChildren, param?: IN): OUT
  retractWithClamping(children: RetractWithClampingCstChildren, param?: IN): OUT
  retract(children: RetractCstChildren, param?: IN): OUT
  endOfProgramRewind(children: EndOfProgramRewindCstChildren, param?: IN): OUT
  longOperatorMessage(children: LongOperatorMessageCstChildren, param?: IN): OUT
  operatorMessage(children: OperatorMessageCstChildren, param?: IN): OUT
  header(children: HeaderCstChildren, param?: IN): OUT
  metricMode(children: MetricModeCstChildren, param?: IN): OUT
  inchMode(children: InchModeCstChildren, param?: IN): OUT
  routMode(children: RoutModeCstChildren, param?: IN): OUT
  linearMove(children: LinearMoveCstChildren, param?: IN): OUT
  circularClockwiseMove(children: CircularClockwiseMoveCstChildren, param?: IN): OUT
  circularCounterclockwiseMove(children: CircularCounterclockwiseMoveCstChildren, param?: IN): OUT
  dwell(children: DwellCstChildren, param?: IN): OUT
  drillMode(children: DrillModeCstChildren, param?: IN): OUT
  cwCircle(children: CwCircleCstChildren, param?: IN): OUT
  ccwCircle(children: CcwCircleCstChildren, param?: IN): OUT
  cutterCompensationOff(children: CutterCompensationOffCstChildren, param?: IN): OUT
  cutterCompensationLeft(children: CutterCompensationLeftCstChildren, param?: IN): OUT
  cutterCompensationRight(children: CutterCompensationRightCstChildren, param?: IN): OUT
  absoluteMode(children: AbsoluteModeCstChildren, param?: IN): OUT
  incrementalMode(children: IncrementalModeCstChildren, param?: IN): OUT
  zeroSet(children: ZeroSetCstChildren, param?: IN): OUT
  selectVisionTool(children: SelectVisionToolCstChildren, param?: IN): OUT
  singlePointVisionOffset(children: SinglePointVisionOffsetCstChildren, param?: IN): OUT
  multiPointVisionOffset(children: MultiPointVisionOffsetCstChildren, param?: IN): OUT
  cancelVisionOffset(children: CancelVisionOffsetCstChildren, param?: IN): OUT
  visionCorrectedSingleHole(children: VisionCorrectedSingleHoleCstChildren, param?: IN): OUT
  visionAutoCalibration(children: VisionAutoCalibrationCstChildren, param?: IN): OUT
  cannedSlot(children: CannedSlotCstChildren, param?: IN): OUT
  cannedCircle(children: CannedCircleCstChildren, param?: IN): OUT
  repeatHole(children: RepeatHoleCstChildren, param?: IN): OUT
}
