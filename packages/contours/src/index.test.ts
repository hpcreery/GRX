import { Contour_Line_Segment, Surface } from "@grx/artwork-format/shape"
import { describe, expect, it } from "vitest"
import { ContourVectorizationError, parsePotracePath } from "./index"

const mask = {
  data: new Uint8Array(100),
  width: 10,
  height: 10,
  bounds: { x: 1, y: 1, width: 10, height: 10 },
  units: "mm" as const,
}

describe("parsePotracePath", () => {
  it("maps Potrace polygon coordinates into the supplied artwork bounds", () => {
    const surface = parsePotracePath("M 0 10 L 10 10 L 10 0 L 0 0 z", mask)
    const contour = surface.contours[0]
    expect(surface).toBeInstanceOf(Surface)
    expect(contour).toMatchObject({ xs: 1, ys: 1 })
    expect(contour.segments).toHaveLength(4)
    expect(contour.segments.at(-1)).toMatchObject({ x: 1, y: 1 })
    expect(contour.segments.every((segment) => segment instanceof Contour_Line_Segment)).toBe(true)
  })

  it("supports relative line commands", () => {
    const surface = parsePotracePath("m 1 1 l 8 0 l 0 8 l -8 0 z", mask)
    expect(surface.contours[0].segments).toHaveLength(4)
    expect(surface.contours[0].segments.at(-1)).toMatchObject({ x: 2, y: 10 })
  })

  it("rejects bezier and arc commands", () => {
    expect(() => parsePotracePath("M 0 0 C 1 1 2 2 3 3 z", mask)).toThrow(ContourVectorizationError)
    expect(() => parsePotracePath("M 0 0 A 1 1 0 0 1 2 2 z", mask)).toThrow(ContourVectorizationError)
    expect(() => parsePotracePath("M 0 0 L 1 0 L 1 1", mask)).toThrow("incomplete contour")
  })
})
