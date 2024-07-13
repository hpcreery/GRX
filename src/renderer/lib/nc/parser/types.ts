// Common types

import type * as Constants from './constants'

// /**
//  * Gerber file or NC drill file
//  */
export type Filetype = typeof Constants.DRILL

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
 * Union type of valid tool shapes
 *
 * @category Shape
 */
export type ToolShape = Circle

// /**
//  * Union type of non-macro tool shapes
//  *
//  * @category Shape
//  */
// export type SimpleShape = Circle

/**
 * Union type of valid tool hole shapes
 *
 * @category Shape
 */
export type HoleShape = Circle

/**
 * A centered circle with a given diameter.
 *
 * @category Shape
 */
export interface Circle {
  type: typeof Constants.CIRCLE
  diameter: number
}

/**
 * A map of axes to coordinate strings used to define the location of a
 * graphical operation
 */
export type Coordinates = Partial<Record<string, string>>

/**
 * Parameters of a step repeat
 */
export interface StepRepeatParameters {
  x: string
  y: string
  i: string
  j: string
}

/**
 * Valid graphical operation types
 */
export type GraphicType =
  | typeof Constants.SHAPE
  | typeof Constants.MOVE
  | typeof Constants.SEGMENT
  | typeof Constants.SLOT

/**
 * Valid interpolations modes
 */
export type InterpolateModeType =
  | typeof Constants.LINE
  | typeof Constants.CW_ARC
  | typeof Constants.CCW_ARC
  | typeof Constants.MOVE
  | typeof Constants.DRILL

// /**
//  * Valid quadrant modes
//  */
// export type QuadrantModeType = typeof Constants.SINGLE | typeof Constants.MULTI

// /**
//  * Valid image polarities
//  */
// export type Polarity = typeof Constants.DARK | typeof Constants.CLEAR

// /**
//  * Valid image mirroring modes
//  */
// export type Mirroring = typeof Constants.NO_MIRROR | typeof Constants.X | typeof Constants.Y | typeof Constants.XY

// /**
//  * Valid image scaling modes
//  */
// export type Scaling = number

// /**
//  * Valid image rotation modes
//  */
// export type Rotation = number
