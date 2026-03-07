// Common types

import type * as Constants from "./constants"

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
export type ZeroSuppression = typeof Constants.LEADING | typeof Constants.TRAILING

/**
 * Absolute or incremental coordinates
 */
export type CoordinateMode = typeof Constants.ABSOLUTE | typeof Constants.INCREMENTAL

export interface Point {
  x: number
  y: number
}

export interface PossiblePoints {
  x?: number
  y?: number
}

/**
 * A map of axes to coordinate strings used to define the location of a
 * graphical operation
 */
export type Coordinates = Partial<Record<string, string>>

/**
 * Parameters of a step repeat
 */
// export interface StepRepeatParameters {
//   x: string
//   y: string
//   i: string
//   j: string
// }

export type ArcPosition = [x: number, y: number, theta: number]
export type Position = [x: number, y: number]

export type ArcDirection = typeof Constants.CW_ARC | typeof Constants.CCW_ARC

export type InterpolateModeType = typeof Constants.LINE | typeof Constants.CW_ARC | typeof Constants.CCW_ARC

export type Mode = typeof Constants.DRILL | typeof Constants.ROUT

export type CutterCompensation = typeof Constants.OFF | typeof Constants.LEFT | typeof Constants.RIGHT
