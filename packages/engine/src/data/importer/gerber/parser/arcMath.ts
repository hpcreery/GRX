// Arc mathematics for calculating arc centers in ambiguous arc mode

import * as Constants from "./constants"
import type { ArcDirection, Location, Point } from "./types"

type Position = [x: number, y: number]
type ArcPosition = [x: number, y: number, theta: number]

export function getAmbiguousArcCenter(location: Location, arcDirection: ArcDirection): Point {
  const { startPoint, endPoint, arcOffsets } = location
  const radius = arcOffsets.a > 0 ? arcOffsets.a : (arcOffsets.i ** 2 + arcOffsets.j ** 2) ** 0.5
  // Get the center candidates and select the candidate with the smallest arc
  const [_start, _end, center] = findCenterCandidates(location, radius)
    .map((centerPoint) => {
      return getArcPositions(startPoint, endPoint, centerPoint, arcDirection)
    })
    .sort(([startA, endA], [startB, endB]) => {
      const absSweepA = Math.abs(endA[2] - startA[2])
      const absSweepB = Math.abs(endB[2] - startB[2])
      return absSweepA - absSweepB
    })[0]

  return {
    x: center[0],
    y: center[1],
  }
}

export function getArcPositions(
  startPoint: Point,
  endPoint: Point,
  centerPoint: Point,
  arcDirection: ArcDirection,
): [start: ArcPosition, end: ArcPosition, center: Position] {
  let startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x)
  let endAngle = Math.atan2(endPoint.y - centerPoint.y, endPoint.x - centerPoint.x)

  // If counter-clockwise, end angle should be greater than start angle
  if (arcDirection === Constants.CCW) {
    endAngle = endAngle > startAngle ? endAngle : endAngle + Math.PI * 2
  } else {
    startAngle = startAngle > endAngle ? startAngle : startAngle + Math.PI * 2
  }

  return [
    [startPoint.x, startPoint.y, startAngle],
    [endPoint.x, endPoint.y, endAngle],
    [centerPoint.x, centerPoint.y],
  ]
}

// Find arc center candidates by finding the intersection points
// of two circles with `radius` centered on the start and end points
// https://math.stackexchange.com/a/1367732
function findCenterCandidates(location: Location, radius: number): Point[] {
  // This function assumes that start and end are different points
  const { x: x1, y: y1 } = location.startPoint
  const { x: x2, y: y2 } = location.endPoint

  // Distance between the start and end points
  const [dx, dy] = [x2 - x1, y2 - y1]
  const [sx, sy] = [x2 + x1, y2 + y1]
  const distance = Math.sqrt(dx ** 2 + dy ** 2)

  // If the distance to the midpoint equals the arc radius, then there is
  // exactly one intersection at the midpoint; if the distance to the midpoint
  // is greater than the radius, assume we've got a rounding error and just use
  // the midpoint
  if (radius <= distance / 2) {
    return [{ x: x1 + dx / 2, y: y1 + dy / 2 }]
  }

  // No good name for these variables, but it's how the math works out
  const factor = Math.sqrt((4 * radius ** 2) / distance ** 2 - 1)
  const [xBase, yBase] = [sx / 2, sy / 2]
  const [xAddend, yAddend] = [(dy * factor) / 2, (dx * factor) / 2]

  return [
    { x: xBase + xAddend, y: yBase - yAddend },
    { x: xBase - xAddend, y: yBase + yAddend },
  ]
}
