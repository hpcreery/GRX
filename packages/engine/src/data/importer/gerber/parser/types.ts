
export type GerberMacroOperator = "+" | "-" | "x" | "/"

export interface GerberMacroExpression {
	left: MacroValue
	operator: GerberMacroOperator
	right: MacroValue
}

export interface GerberParserState {
	nodes: object[]
	units: "in" | "mm"
	coordinateFormat: Format
	zeroSuppression: ZeroSuppression
	done: boolean
}

// Common types

import type * as Constants from './constants'

/**
 * Child of a {@linkcode ToolMacro} node
 *
 * @category Macro
 */
export type MacroBlock = MacroComment | MacroVariable | MacroPrimitive;
/**
 * A `MacroComment` represents a comment in a macro and can be safely ignored
 *
 * @category Macro
 */
export interface MacroComment {
    /** Node type */
    type: typeof Constants.MACRO_COMMENT;
    /** Comment string */
    comment: string;
}
/**
 * A `MacroVariable` node assigns a value to the `name` variable in a macro,
 * where that value may be a number or an arithmetic expression.
 *
 * @category Macro
 */
export interface MacroVariable {
    /** Node type */
    type: typeof Constants.MACRO_VARIABLE;
    /** Variable name */
    name: string;
    /** Concrete value or expression to assign to variable */
    value: MacroValue;
}
/**
 * A `MacroPrimitive` node describes a shape to add to the overall macro shape.
 *
 * @category Macro
 */
export interface MacroPrimitive {
    /** Node type */
    type: typeof Constants.MACRO_PRIMITIVE;
    /** Primitive shape type */
    code: MacroPrimitiveCode;
    /** Shape parameter values or expressions */
    parameters: MacroValue[];
}

/**
 * Millimeters or inches
 */
export type UnitsType = typeof Constants.MM | typeof Constants.IN

/**
 * Coordinate string decimal format, where Format[0] represents the maximum
 * number of integer digits in the string and Format[1] represents the number
 * of decimal digits. The decimal point itself is usually implicit.
 */
export type Format = [integerPlaces: number, decimalPlaces: number]

/**
 * Leading or trailing zero-suppression for coordinate strings
 */
export type ZeroSuppression =
  | typeof Constants.LEADING
  | typeof Constants.TRAILING

/**
 * Absolute or incremental coordinates
 */
export type Mode = typeof Constants.ABSOLUTE | typeof Constants.INCREMENTAL

/**
 * Union type of macro primitive shape identifiers
 *
 * @category Macro
 */
export type MacroPrimitiveCode =
  | typeof Constants.MACRO_CIRCLE
  | typeof Constants.MACRO_VECTOR_LINE_DEPRECATED
  | typeof Constants.MACRO_VECTOR_LINE
  | typeof Constants.MACRO_CENTER_LINE
  | typeof Constants.MACRO_LOWER_LEFT_LINE_DEPRECATED
  | typeof Constants.MACRO_OUTLINE
  | typeof Constants.MACRO_POLYGON
  | typeof Constants.MACRO_MOIRE_DEPRECATED
  | typeof Constants.MACRO_THERMAL

/**
 * An arithmetic expression in a macro
 *
 * @category Macro
 */
export interface MacroExpression {
  left: MacroValue
  right: MacroValue
  operator: '+' | '-' | 'x' | '/'
}

/**
 * A value in a macro. The number may be a literal number, a string
 * representing a variable in the macro, or an arithmetic expression.
 *
 * @category Macro
 */
export type MacroValue = number | string | MacroExpression

/**
 * A map of axes to coordinate strings used to define the location of a
 * graphical operation
 */
export type Coordinates = Partial<Record<string, string>>

/**
 * Parameters of a step repeat
 */
export type StepRepeatParameters = Record<string, number>

/**
 * Valid graphical operation types
 */
export type GraphicType =
  | typeof Constants.SHAPE
  | typeof Constants.MOVE
  | typeof Constants.SEGMENT

/**
 * Valid quadrant modes
 */
export type QuadrantModeType = typeof Constants.SINGLE | typeof Constants.MULTI

/**
 * Valid image polarities
 */
export type Polarity = typeof Constants.DARK | typeof Constants.CLEAR
/**
 * Valid image mirroring modes
 */
export type Mirroring = typeof Constants.NO_MIRROR | typeof Constants.X | typeof Constants.Y | typeof Constants.XY;
/**
 * Valid image scaling modes
 */
export type Scaling = number;
/**
 * Valid image rotation modes
 */
export type Rotation = number;

/**
 * A 2D point with x and y coordinates
 */
export interface Point {
  x: number
  y: number
}

/**
 * Location information for arc operations
 */
export interface Location {
  startPoint: Point
  endPoint: Point
  arcOffsets: { i: number; j: number; a: number }
}

/**
 * Step and repeat definition parameters
 */
export interface StepRepeatDefinition {
  x: number
  y: number
  i: number
  j: number
}

export type ArcDirection = typeof Constants.CW | typeof Constants.CCW