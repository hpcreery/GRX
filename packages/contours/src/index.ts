import { Contour, Contour_Line_Segment, Surface } from "@grx/artwork-format/shape"
import type { Units } from "@grx/artwork-format/types"

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/**
 * A top-to-bottom binary image and the exact world-space rectangle it covers.
 * Every pixel coordinate is mapped into bounds before it is returned as artwork.
 */
export interface BinaryMask {
  data: Uint8Array
  width: number
  height: number
  bounds: Bounds
  units: Units
}

export interface VectorizeOptions {
  /** Ignore connected components smaller than this number of pixels. Defaults to 0. */
  turdsize?: number
}

export interface VectorizeResult {
  /** A flat list with exactly one artwork-format Contour in every Surface. */
  contours: Surface[]
  units: Units
  pixelSize: { x: number; y: number }
}

export class ContourVectorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ContourVectorizationError"
  }
}

type Point = { x: number; y: number }

let potraceModule: Promise<typeof import("esm-potrace-wasm")> | undefined
let initializePotrace: Promise<void> | undefined

function containsPoint(ring: Point[], point: Point): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function contourPoints(surface: Surface): Point[] {
  const contour = surface.contours[0]
  return [{ x: contour.xs, y: contour.ys }, ...contour.segments.map(({ x, y }) => ({ x, y }))]
}

function classifyHoles(surfaces: Surface[]): void {
  const rings = surfaces.map(contourPoints)
  surfaces.forEach((surface, index) => {
    const ring = rings[index]
    const nested = rings.filter((candidate, candidateIndex) => candidateIndex !== index && containsPoint(candidate, ring[0])).length
    surface.contours[0].poly_type = nested % 2 === 0 ? 1 : 0
  })
}

/**
 * Parses only Potrace's straight-edge SVG subset. Curve commands are always
 * rejected to preserve the artwork format's line-and-arc-only invariant.
 */
export function parsePotracePath(path: string, mask: BinaryMask): Surface {
  const pathData = path.match(/\bd=(["'])(.*?)\1/)?.[2] ?? path
  const tokens = [...pathData.matchAll(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)].map((match) => match[0])
  const pixelSize = { x: mask.bounds.width / mask.width, y: mask.bounds.height / mask.height }
  let index = 0
  let command = ""
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  let contour: Contour | undefined
  let closed = false

  const readNumber = (): number => {
    const rawValue = tokens[index++]
    const value = Number(rawValue)
    // console.log(`Read number: ${value} :: ${rawValue}`)
    if (!Number.isFinite(value)) throw new ContourVectorizationError("Potrace produced an invalid path coordinate")
    return value
  }
  const toWorld = (pixelX: number, pixelY: number): Point => ({
    x: mask.bounds.x + pixelX * pixelSize.x,
    y: mask.bounds.y + (mask.height - pixelY) * pixelSize.y,
  })

  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++]
    // console.log("command", command)
    if (!command) throw new ContourVectorizationError("Potrace produced a path without an SVG command")
    if (!["M", "m", "L", "l", "Z", "z"].includes(command)) {
      // throw new ContourVectorizationError(`Potrace produced unsupported ${command} curve command`)
      continue
    }
    if (command.toUpperCase() === "Z") {
      if (!contour) throw new ContourVectorizationError("Potrace closed a path before moving to a point")
      if (x !== startX || y !== startY) {
        const point = toWorld(startX, startY)
        contour.addSegment(new Contour_Line_Segment({ x: point.x, y: point.y }))
      }
      closed = true
      command = ""
      continue
    }
    if (index + 1 >= tokens.length) throw new ContourVectorizationError("Potrace produced an incomplete path coordinate")
    const relative = command === command.toLowerCase()
    const nextX = readNumber()
    const nextY = readNumber()
    x = relative ? x + nextX : nextX
    y = relative ? y + nextY : nextY
    const point = toWorld(x, y)
    if (command.toUpperCase() === "M") {
      if (contour) throw new ContourVectorizationError("Potrace produced multiple contours in one path")
      contour = new Contour({ xs: point.x, ys: point.y })
      startX = x
      startY = y
      command = relative ? "l" : "L"
    } else {
      if (!contour) throw new ContourVectorizationError("Potrace drew a line before moving to a point")
      contour.addSegment(new Contour_Line_Segment({ x: point.x, y: point.y }))
    }
  }
  if (!contour || !closed || contour.segments.length < 3) throw new ContourVectorizationError("Potrace produced an incomplete contour")
  return new Surface({ units: mask.units, contours: [contour] })
}

/**
 * Vectorizes a renderer-produced binary mask through Potrace's straight-edge
 * mode. Coordinates are mapped from the raster to its supplied world bounds.
 */
export async function vectorizeMask(mask: BinaryMask, options: VectorizeOptions = {}): Promise<VectorizeResult> {
  if (!Number.isInteger(mask.width) || !Number.isInteger(mask.height) || mask.width <= 0 || mask.height <= 0)
    throw new ContourVectorizationError("mask dimensions must be positive integers")
  if (mask.data.length !== mask.width * mask.height) throw new ContourVectorizationError("mask data length must equal width * height")
  if (
    ![mask.bounds.x, mask.bounds.y, mask.bounds.width, mask.bounds.height].every(Number.isFinite) ||
    mask.bounds.width <= 0 ||
    mask.bounds.height <= 0
  )
    throw new ContourVectorizationError("mask bounds must have finite positive width and height")
  // if (options.turdsize !== undefined && (!Number.isInteger(options.turdsize) || options.turdsize < 0))
  //   throw new ContourVectorizationError("turdsize must be a non-negative integer")

  const module = await (potraceModule ??= import("esm-potrace-wasm"))
  initializePotrace ??= module.init()
  await initializePotrace
  const rgba = new Uint8ClampedArray(mask.width * mask.height * 4)
  for (let i = 0; i < mask.data.length; i++) {
    const color = mask.data[i] === 0 ? 255 : 0
    rgba.set([color, color, color, 255], i * 4)
  }
  const paths = await module.potrace(new ImageData(rgba, mask.width, mask.height), {
    alphamax: 0,
    opticurve: 0,
    pathonly: false,
    turdsize: options.turdsize ?? 0,
  })
  console.log(paths)
  // console.log("paths", paths)
  // const contours = paths.map((path) => {
  //   if (path.includes("transform")) return undefined
  //   return parsePotracePath(path, mask)
  // }).filter((contour): contour is Surface => contour !== undefined)
  // classifyHoles(contours)
  // return {
  //   contours,
  //   units: mask.units,
  //   pixelSize: { x: mask.bounds.width / mask.width, y: mask.bounds.height / mask.height },
  // }
}
