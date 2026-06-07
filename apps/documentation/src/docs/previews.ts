import {
  Arc,
  Contour,
  Contour_Arc_Segment,
  Contour_Line_Segment,
  DatumArc,
  DatumLine,
  DatumPoint,
  DatumText,
  Line,
  Pad,
  PolyLine,
  type Shape,
  StepAndRepeat,
  Surface,
} from "@grx/artwork-format/shape"
import {
  ButterflySymbol,
  ChamferedRectangleSymbol,
  CircleThermalSymbol,
  ConstrainedRectangleThermalSymbol,
  DiamondSymbol,
  EllipseSymbol,
  HalfOvalSymbol,
  HoleSymbol,
  HorizontalHexagonSymbol,
  MoireGerberSymbol,
  MoireODBSymbol,
  NullSymbol,
  OctagonSymbol,
  OvalDonutSymbol,
  OvalSymbol,
  PolygonSymbol,
  RectangleDonutSymbol,
  RectangleSymbol,
  RectangleThermalOpenCornersSymbol,
  RectangleThermalSymbol,
  RoundDonutSymbol,
  RoundedRectangleDonutSymbol,
  RoundedRectangleSymbol,
  RoundedSquareDonutSymbol,
  RoundSymbol,
  SquareButterflySymbol,
  SquareCircleThermalSymbol,
  SquareDonutSymbol,
  SquareRoundDonutSymbol,
  SquareSymbol,
  TriangleSymbol,
  VerticalHexagonSymbol,
} from "@grx/artwork-format/symbol"

export type SliderConfig = {
  type?: "slider"
  label: string
  key: string
  min: number
  max: number
  step: number
  value: number
}

export type ComboConfig = {
  type: "combo"
  label: string
  key: string
  value: number
  options: { label: string; value: number }[]
}

export type InputConfig = {
  type: "input"
  label: string
  key: string
  value: string
  placeholder?: string
}

export type ControlConfig = SliderConfig | ComboConfig | InputConfig
export type ControlValue = number | string

export type PreviewSpec = {
  id: string
  title: string
  description: string
  createShape: (controls: Record<string, ControlValue>) => Shape
  variables: Record<string, ControlConfig>
}

function slider(label: string, key: string, value: number, min: number, max: number, step = 1): SliderConfig {
  return { label, key, value, min, max, step }
}

function combo(label: string, key: string, value: number, options: { label: string; value: number }[]): ComboConfig {
  return { type: "combo", label, key, value, options }
}

function input(label: string, key: string, value: string, placeholder?: string): InputConfig {
  return { type: "input", label, key, value, placeholder }
}

export function getSliderValue(values: Record<string, ControlValue>, key: string, fallback: number): number {
  const value = values[key]
  return typeof value === "number" ? value : fallback
}

export function getInputValue(values: Record<string, ControlValue>, key: string, fallback: string): string {
  const value = values[key]
  return typeof value === "string" ? value : fallback
}

export function getComboValue(
  values: Record<string, ControlValue>,
  key: string,
  fallback: number,
): "round" | "square" | "none" | "chamfer" | "miter" {
  const comboMaps = {
    pathtype: ["round", "square", "none"] as const,
    endtype: ["chamfer", "round", "miter"] as const,
  }

  const options = comboMaps[key as keyof typeof comboMaps]
  if (options == null) {
    return "round"
  }

  const rawValue = typeof values[key] === "number" ? values[key] : fallback
  const normalizedIndex = Math.max(0, Math.min(options.length - 1, Math.round(rawValue)))
  return options[normalizedIndex]
}

export function getInitialControlValues(previews: PreviewSpec[]): Record<string, Record<string, ControlValue>> {
  return Object.fromEntries(
    previews.map((preview) => [preview.id, Object.fromEntries(Object.values(preview.variables).map((entry) => [entry.key, entry.value]))]),
  )
}

function formatSliderNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatControlValue(value: ControlValue): string {
  return typeof value === "string" ? JSON.stringify(value) : formatSliderNumber(value)
}

const symbolConstructorNames: Record<string, string> = {
  null: "NullSymbol",
  round: "RoundSymbol",
  square: "SquareSymbol",
  rectangle: "RectangleSymbol",
  "rounded-rectangle": "RoundedRectangleSymbol",
  "chamfered-rectangle": "ChamferedRectangleSymbol",
  oval: "OvalSymbol",
  diamond: "DiamondSymbol",
  octagon: "OctagonSymbol",
  "round-donut": "RoundDonutSymbol",
  "square-donut": "SquareDonutSymbol",
  "square-round-donut": "SquareRoundDonutSymbol",
  "rounded-square-donut": "RoundedSquareDonutSymbol",
  "rectangle-donut": "RectangleDonutSymbol",
  "rounded-rectangle-donut": "RoundedRectangleDonutSymbol",
  "oval-donut": "OvalDonutSymbol",
  "horizontal-hexagon": "HorizontalHexagonSymbol",
  "vertical-hexagon": "VerticalHexagonSymbol",
  butterfly: "ButterflySymbol",
  "square-butterfly": "SquareButterflySymbol",
  triangle: "TriangleSymbol",
  "half-oval": "HalfOvalSymbol",
  "circle-thermal": "CircleThermalSymbol",
  "rectangle-thermal": "RectangleThermalSymbol",
  "rectangle-thermal-open": "RectangleThermalOpenCornersSymbol",
  "square-circle-thermal": "SquareCircleThermalSymbol",
  "constrained-rectangle-thermal": "ConstrainedRectangleThermalSymbol",
  ellipse: "EllipseSymbol",
  "moire-gerber": "MoireGerberSymbol",
  "moire-odb": "MoireODBSymbol",
  hole: "HoleSymbol",
  polygon: "PolygonSymbol",
}

const shapeCodeExamples: Record<string, string> = {
  "primitive-pad": `const shape = new Pad({\n  symbol: new RoundSymbol({ outer_dia: 18, inner_dia: 0 }),\n})`,
  "primitive-line": `const shape = new Line({\n  xs: -12, ys: 0, xe: 12, ye: 0,\n  symbol: new RectangleSymbol({ width: 4, height: 16, inner_dia: 0 }),\n})`,
  "primitive-arc": `const shape = new Arc({\n  xs: -10, ys: 0, xe: 10, ye: 0, xc: 0, yc: 0,\n  symbol: new RoundSymbol({ outer_dia: 18, inner_dia: 0 }),\n})`,
  surface: `const shape = new Surface({\n  contours: [\n    new Contour({ xs: -14, ys: -10 }).addSegments([\n      new Contour_Line_Segment({ x: 14, y: -10 }),\n      new Contour_Arc_Segment({ x: 14, y: 10, xc: 16, yc: 0, clockwise: 0 }),\n      new Contour_Line_Segment({ x: -14, y: 10 }),\n      new Contour_Line_Segment({ x: -14, y: -10 }),\n    ]),\n  ],\n})`,
  polyline: `const shape = new PolyLine({\n  xs: -14, ys: -14, width: 3,\n  lines: [{ x: 10, y: -14 }, { x: 14, y: 8 }, { x: -4, y: 14 }, { x: -14, y: -2 }],\n})`,
  "step-repeat": `const shape = new StepAndRepeat({\n  shapes: [\n    new Pad({ symbol: new RoundSymbol({ outer_dia: 10, inner_dia: 0 }) }),\n    new PolyLine({ xs: -5, ys: -5, width: 2, lines: [{ x: 5, y: -5 }, { x: 5, y: 5 }] }),\n  ],\n  repeats: [\n    { datum: [22, 0], rotation: 0, scale: 1, mirror_x: 0, mirror_y: 0 },\n    { datum: [0, 22], rotation: 0, scale: 1, mirror_x: 0, mirror_y: 0 },\n  ],\n})`,
  "datum-point": `const shape = new DatumPoint({\n  x: 0, y: 0,\n  symbol: new RoundSymbol({ outer_dia: 12, inner_dia: 0 }),\n})`,
  "datum-text": `const shape = new DatumText({\n  x: 0, y: 0, text: "DATUM",\n})`,
  "datum-line": `const shape = new DatumLine({\n  xs: -12, ys: 0, xe: 12, ye: 0,\n  symbol: new RectangleSymbol({ width: 3, height: 14, inner_dia: 0 }),\n})`,
  "datum-arc": `const shape = new DatumArc({\n  xs: -10, ys: 0, xe: 10, ye: 0, xc: 0, yc: 0,\n  symbol: new RoundSymbol({ outer_dia: 12, inner_dia: 0 }),\n})`,
}

const shapeImportExamples: Record<string, string> = {
  "primitive-pad": `import { Pad } from "@grx/artwork-format/shape"\nimport { RoundSymbol } from "@grx/artwork-format/symbol"`,
  "primitive-line": `import { Line } from "@grx/artwork-format/shape"\nimport { RectangleSymbol } from "@grx/artwork-format/symbol"`,
  "primitive-arc": `import { Arc } from "@grx/artwork-format/shape"\nimport { RoundSymbol } from "@grx/artwork-format/symbol"`,
  surface: `import { Surface, Contour, Contour_Line_Segment, Contour_Arc_Segment } from "@grx/artwork-format/shape"`,
  polyline: `import { PolyLine } from "@grx/artwork-format/shape"`,
  "step-repeat": `import { StepAndRepeat, Pad, PolyLine } from "@grx/artwork-format/shape"\nimport { RoundSymbol } from "@grx/artwork-format/symbol"`,
  "datum-point": `import { DatumPoint } from "@grx/artwork-format/shape"\nimport { RoundSymbol } from "@grx/artwork-format/symbol"`,
  "datum-text": `import { DatumText } from "@grx/artwork-format/shape"`,
  "datum-line": `import { DatumLine } from "@grx/artwork-format/shape"\nimport { RectangleSymbol } from "@grx/artwork-format/symbol"`,
  "datum-arc": `import { DatumArc } from "@grx/artwork-format/shape"\nimport { RoundSymbol } from "@grx/artwork-format/symbol"`,
}

export function buildSymbolCode(preview: PreviewSpec, controls: Record<string, ControlValue>): string {
  const symbolConstructor = symbolConstructorNames[preview.id] ?? "StandardSymbol"
  const controlEntries = Object.values(preview.variables)
  const symbolArgs = controlEntries.length
    ? controlEntries.map((entry) => `    ${entry.key}: ${formatControlValue(controls[entry.key] ?? entry.value)},`).join("\n")
    : "    // No configurable parameters"

  const imports = `import { Pad } from "@grx/artwork-format/shape"\nimport { ${symbolConstructor} } from "@grx/artwork-format/symbol"`

  return `${imports}\n\nconst shape = new Pad({\n  symbol: new ${symbolConstructor}({\n${symbolArgs}\n  }),\n})`
}

export function buildShapeCode(preview: PreviewSpec, controls: Record<string, ControlValue>): string {
  const imports = shapeImportExamples[preview.id] ?? `import { Shape } from "@grx/artwork-format/shape"`
  const body = shapeCodeExamples[preview.id] ?? `const shape = ${preview.title}`
  const controlEntries = Object.values(preview.variables)

  if (controlEntries.length === 0) {
    return `${imports}\n\n${body}`
  }

  const controlValuesBlock = controlEntries.map((entry) => `  ${entry.key}: ${formatControlValue(controls[entry.key] ?? entry.value)},`).join("\n")
  return `${imports}\n\nconst controlValues = {\n${controlValuesBlock}\n}\n\n${body}`
}

export const symbolPreviews: PreviewSpec[] = [
  {
    id: "null",
    title: "Null",
    description: "Blank flash aperture used when a symbol intentionally renders nothing.",
    createShape: (values) => new Pad({ symbol: new NullSymbol({ id: "Null" }), resize_factor: getSliderValue(values, "resize_factor", 1) }),
    variables: { resize_factor: slider("Resize", "resize_factor", 1, 0.1, 4, 0.1) },
  },
  {
    id: "round",
    title: "Round",
    description: "Circular flash aperture.",
    createShape: (values) =>
      new Pad({ symbol: new RoundSymbol({ outer_dia: getSliderValue(values, "outer_dia", 18), inner_dia: getSliderValue(values, "inner_dia", 0) }) }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 58),
    },
  },
  {
    id: "square",
    title: "Square",
    description: "Square aperture for blunt features and pads.",
    createShape: (values) =>
      new Pad({
        symbol: new SquareSymbol({
          width: getSliderValue(values, "width", 18),
          height: getSliderValue(values, "height", 18),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 18, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "rectangle",
    title: "Rectangle",
    description: "Rectangular flash aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new RectangleSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "rounded-rectangle",
    title: "Rounded Rectangle",
    description: "Rectangle with softened corners.",
    createShape: (values) =>
      new Pad({
        symbol: new RoundedRectangleSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "chamfered-rectangle",
    title: "Chamfered Rectangle",
    description: "Rectangle with clipped corners.",
    createShape: (values) =>
      new Pad({
        symbol: new ChamferedRectangleSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      corner_radius: slider("Chamfer Size", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "oval",
    title: "Oval",
    description: "Rounded oval aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new OvalSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "diamond",
    title: "Diamond",
    description: "Diamond-shaped aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new DiamondSymbol({
          width: getSliderValue(values, "width", 18),
          height: getSliderValue(values, "height", 18),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 18, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "octagon",
    title: "Octagon",
    description: "Eight-sided aperture with defined edges.",
    createShape: (values) =>
      new Pad({
        symbol: new OctagonSymbol({
          width: getSliderValue(values, "width", 18),
          height: getSliderValue(values, "height", 18),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 18, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 40),
    },
  },
  {
    id: "round-donut",
    title: "Round Donut",
    description: "Ring aperture with a clear center.",
    createShape: (values) =>
      new Pad({
        symbol: new RoundDonutSymbol({ outer_dia: getSliderValue(values, "outer_dia", 18), inner_dia: getSliderValue(values, "inner_dia", 8) }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 8, 0, 58),
    },
  },
  {
    id: "square-donut",
    title: "Square Donut",
    description: "Square ring aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new SquareDonutSymbol({ outer_dia: getSliderValue(values, "outer_dia", 18), inner_dia: getSliderValue(values, "inner_dia", 8) }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 8, 0, 58),
    },
  },
  {
    id: "square-round-donut",
    title: "Square Round Donut",
    description: "Hybrid square and circular donut.",
    createShape: (values) =>
      new Pad({
        symbol: new SquareRoundDonutSymbol({ outer_dia: getSliderValue(values, "outer_dia", 18), inner_dia: getSliderValue(values, "inner_dia", 8) }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 8, 0, 58),
    },
  },
  {
    id: "rounded-square-donut",
    title: "Rounded Square Donut",
    description: "Rounded square donut aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new RoundedSquareDonutSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 18),
          inner_dia: getSliderValue(values, "inner_dia", 8),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
        }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 8, 0, 58),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
    },
  },
  {
    id: "rectangle-donut",
    title: "Rectangle Donut",
    description: "Rectangular ring aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new RectangleDonutSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          line_width: getSliderValue(values, "line_width", 4),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
    },
  },
  {
    id: "rounded-rectangle-donut",
    title: "Rounded Rectangle Donut",
    description: "Rounded rectangle with an interior cutout.",
    createShape: (values) =>
      new Pad({
        symbol: new RoundedRectangleDonutSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
          line_width: getSliderValue(values, "line_width", 4),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
    },
  },
  {
    id: "oval-donut",
    title: "Oval Donut",
    description: "Oval ring aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new OvalDonutSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 14),
          line_width: getSliderValue(values, "line_width", 4),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
    },
  },
  {
    id: "horizontal-hexagon",
    title: "Horizontal Hexagon",
    description: "Hexagon oriented on its long axis.",
    createShape: (values) =>
      new Pad({
        symbol: new HorizontalHexagonSymbol({
          width: getSliderValue(values, "width", 22),
          height: getSliderValue(values, "height", 14),
          corner_radius: getSliderValue(values, "corner_radius", 2),
        }),
      }),
    variables: {
      width: slider("Width", "width", 22, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
      corner_radius: slider("Corner Radius", "corner_radius", 2, 0, 20),
    },
  },
  {
    id: "vertical-hexagon",
    title: "Vertical Hexagon",
    description: "Hexagon oriented vertically.",
    createShape: (values) =>
      new Pad({
        symbol: new VerticalHexagonSymbol({
          width: getSliderValue(values, "width", 14),
          height: getSliderValue(values, "height", 22),
          corner_radius: getSliderValue(values, "corner_radius", 2),
        }),
      }),
    variables: {
      width: slider("Width", "width", 14, 1, 60),
      height: slider("Height", "height", 22, 1, 60),
      corner_radius: slider("Corner Radius", "corner_radius", 2, 0, 20),
    },
  },
  {
    id: "butterfly",
    title: "Butterfly",
    description: "Round butterfly-style aperture.",
    createShape: (values) => new Pad({ symbol: new ButterflySymbol({ outer_dia: getSliderValue(values, "outer_dia", 18) }) }),
    variables: { outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60) },
  },
  {
    id: "square-butterfly",
    title: "Square Butterfly",
    description: "Square butterfly-style aperture.",
    createShape: (values) => new Pad({ symbol: new SquareButterflySymbol({ width: getSliderValue(values, "width", 18) }) }),
    variables: { width: slider("Width", "width", 18, 1, 60) },
  },
  {
    id: "triangle",
    title: "Triangle",
    description: "Triangular aperture.",
    createShape: (values) =>
      new Pad({ symbol: new TriangleSymbol({ width: getSliderValue(values, "width", 18), height: getSliderValue(values, "height", 18) }) }),
    variables: {
      width: slider("Width", "width", 18, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
    },
  },
  {
    id: "half-oval",
    title: "Half Oval",
    description: "Half oval aperture used for specialized pads.",
    createShape: (values) =>
      new Pad({ symbol: new HalfOvalSymbol({ width: getSliderValue(values, "width", 24), height: getSliderValue(values, "height", 14) }) }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
    },
  },
  {
    id: "circle-thermal",
    title: "Circle Thermal",
    description: "Round thermal aperture with spokes.",
    createShape: (values) =>
      new Pad({
        symbol: new CircleThermalSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 20),
          inner_dia: getSliderValue(values, "inner_dia", 16),
          num_spokes: getSliderValue(values, "num_spokes", 4),
          angle: getSliderValue(values, "angle", 0),
          gap: getSliderValue(values, "gap", 2),
          round: getSliderValue(values, "round", 1),
        }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 20, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 16, 0, 58),
      num_spokes: slider("Spokes", "num_spokes", 4, 1, 8),
      angle: slider("Angle", "angle", 0, 0, 360),
      gap: slider("Gap", "gap", 2, 0, 10),
      round: slider("Roundness", "round", 1, 0, 1),
    },
  },
  {
    id: "rectangle-thermal",
    title: "Rectangle Thermal",
    description: "Rectangular thermal aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new RectangleThermalSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 18),
          line_width: getSliderValue(values, "line_width", 4),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
          num_spokes: getSliderValue(values, "num_spokes", 4),
          angle: getSliderValue(values, "angle", 0),
          gap: getSliderValue(values, "gap", 2),
          round: getSliderValue(values, "round", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
      num_spokes: slider("Spokes", "num_spokes", 4, 1, 8),
      angle: slider("Angle", "angle", 0, 0, 360),
      gap: slider("Gap", "gap", 2, 0, 10),
      round: slider("Roundness", "round", 0, 0, 1),
    },
  },
  {
    id: "rectangle-thermal-open",
    title: "Rectangle Thermal Open Corners",
    description: "Thermal rectangle with open corners.",
    createShape: (values) =>
      new Pad({
        symbol: new RectangleThermalOpenCornersSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 18),
          line_width: getSliderValue(values, "line_width", 4),
          num_spokes: getSliderValue(values, "num_spokes", 4),
          angle: getSliderValue(values, "angle", 0),
          gap: getSliderValue(values, "gap", 2),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
      num_spokes: slider("Spokes", "num_spokes", 4, 1, 8),
      angle: slider("Angle", "angle", 0, 0, 360),
      gap: slider("Gap", "gap", 2, 0, 10),
    },
  },
  {
    id: "square-circle-thermal",
    title: "Square Circle Thermal",
    description: "Square/circle hybrid thermal aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new SquareCircleThermalSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 20),
          inner_dia: getSliderValue(values, "inner_dia", 8),
          num_spokes: getSliderValue(values, "num_spokes", 4),
          angle: getSliderValue(values, "angle", 0),
          gap: getSliderValue(values, "gap", 2),
        }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 20, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 8, 0, 58),
      num_spokes: slider("Spokes", "num_spokes", 4, 1, 8),
      angle: slider("Angle", "angle", 0, 0, 360),
      gap: slider("Gap", "gap", 2, 0, 10),
    },
  },
  {
    id: "constrained-rectangle-thermal",
    title: "Constrained Rectangle Thermal",
    description: "Thermal rectangle with constrained outer form.",
    createShape: (values) =>
      new Pad({
        symbol: new ConstrainedRectangleThermalSymbol({
          width: getSliderValue(values, "width", 24),
          height: getSliderValue(values, "height", 18),
          line_width: getSliderValue(values, "line_width", 4),
          corner_radius: getSliderValue(values, "corner_radius", 3),
          corners: getSliderValue(values, "corners", 15),
          num_spokes: getSliderValue(values, "num_spokes", 4),
          angle: getSliderValue(values, "angle", 0),
          gap: getSliderValue(values, "gap", 2),
          round: getSliderValue(values, "round", 0),
        }),
      }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 18, 1, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
      corner_radius: slider("Corner Radius", "corner_radius", 3, 0, 20),
      corners: slider("Corners Mask", "corners", 15, 0, 15),
      num_spokes: slider("Spokes", "num_spokes", 4, 1, 8),
      angle: slider("Angle", "angle", 0, 0, 360),
      gap: slider("Gap", "gap", 2, 0, 10),
      round: slider("Roundness", "round", 0, 0, 1),
    },
  },
  {
    id: "ellipse",
    title: "Ellipse",
    description: "Elliptical aperture.",
    createShape: (values) =>
      new Pad({ symbol: new EllipseSymbol({ width: getSliderValue(values, "width", 24), height: getSliderValue(values, "height", 14) }) }),
    variables: {
      width: slider("Width", "width", 24, 1, 60),
      height: slider("Height", "height", 14, 1, 60),
    },
  },
  {
    id: "moire-gerber",
    title: "Moire Gerber",
    description: "Gerber moire aperture with rings and lines.",
    createShape: (values) =>
      new Pad({
        symbol: new MoireGerberSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 24),
          ring_width: getSliderValue(values, "ring_width", 2),
          ring_gap: getSliderValue(values, "ring_gap", 2),
          num_rings: getSliderValue(values, "num_rings", 3),
          line_width: getSliderValue(values, "line_width", 1),
          line_length: getSliderValue(values, "line_length", 35),
          angle: getSliderValue(values, "angle", 0),
        }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 24, 1, 80),
      ring_width: slider("Ring Width", "ring_width", 2, 1, 15),
      ring_gap: slider("Ring Gap", "ring_gap", 2, 0, 20),
      num_rings: slider("Number of Rings", "num_rings", 3, 1, 8),
      line_width: slider("Line Width", "line_width", 1, 1, 20),
      line_length: slider("Line Length", "line_length", 35, 1, 80),
      angle: slider("Angle", "angle", 0, 0, 360),
    },
  },
  {
    id: "moire-odb",
    title: "Moire ODB",
    description: "ODB++ moire aperture.",
    createShape: (values) =>
      new Pad({
        symbol: new MoireODBSymbol({
          ring_width: getSliderValue(values, "ring_width", 2),
          ring_gap: getSliderValue(values, "ring_gap", 2),
          num_rings: getSliderValue(values, "num_rings", 3),
          line_width: getSliderValue(values, "line_width", 1),
          line_length: getSliderValue(values, "line_length", 35),
          angle: getSliderValue(values, "angle", 0),
        }),
      }),
    variables: {
      ring_width: slider("Ring Width", "ring_width", 2, 1, 15),
      ring_gap: slider("Ring Gap", "ring_gap", 2, 0, 20),
      num_rings: slider("Number of Rings", "num_rings", 3, 1, 8),
      line_width: slider("Line Width", "line_width", 1, 1, 20),
      line_length: slider("Line Length", "line_length", 35, 1, 80),
      angle: slider("Angle", "angle", 0, 0, 360),
    },
  },
  {
    id: "hole",
    title: "Hole",
    description: "Round hole aperture.",
    createShape: (values) =>
      new Pad({ symbol: new HoleSymbol({ outer_dia: getSliderValue(values, "outer_dia", 16), inner_dia: getSliderValue(values, "inner_dia", 6) }) }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 16, 1, 60),
      inner_dia: slider("Inner Diameter", "inner_dia", 6, 0, 58),
    },
  },
  {
    id: "polygon",
    title: "Polygon",
    description: "Polygonal aperture driven by corner count.",
    createShape: (values) =>
      new Pad({
        symbol: new PolygonSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 18),
          corners: getSliderValue(values, "corners", 6),
          line_width: getSliderValue(values, "line_width", 0),
          inner_dia: getSliderValue(values, "inner_dia", 0),
          angle: getSliderValue(values, "angle", 0),
        }),
      }),
    variables: {
      outer_dia: slider("Outer Diameter", "outer_dia", 18, 1, 60),
      corners: slider("Corners", "corners", 6, 3, 16),
      line_width: slider("Line Width", "line_width", 0, 0, 20),
      inner_dia: slider("Inner Diameter", "inner_dia", 0, 0, 58),
      angle: slider("Angle", "angle", 0, 0, 360),
    },
  },
]

export const shapePreviews: PreviewSpec[] = [
  {
    id: "primitive-pad",
    title: "Pad",
    description: "The core primitive used to flash symbol geometry.",
    createShape: (values) =>
      new Pad({
        x: getSliderValue(values, "x", 0),
        y: getSliderValue(values, "y", 0),
        mirror_x: getSliderValue(values, "mirror_x", 0) as 0 | 1,
        mirror_y: getSliderValue(values, "mirror_y", 0) as 0 | 1,
        polarity: getSliderValue(values, "polarity", 1) as 0 | 1,
        rotation: getSliderValue(values, "rotation", 0),
        resize_factor: getSliderValue(values, "resize_factor", 1),
        symbol: new SquareSymbol({ width: 10, height: 10, inner_dia: 0 }),
      }),
    variables: {
      x: slider("X", "x", 0, -60, 60),
      y: slider("Y", "y", 0, -60, 60),
      mirror_x: slider("Mirror X", "mirror_x", 0, 0, 1),
      mirror_y: slider("Mirror Y", "mirror_y", 0, 0, 1),
      polarity: slider("Polarity", "polarity", 1, 0, 1),
      rotation: slider("Rotation", "rotation", 0, 0, 360),
      resize_factor: slider("Resize Factor", "resize_factor", 1, 0.1, 4, 0.1),
    },
  },
  {
    id: "primitive-line",
    title: "Line",
    description: "A primitive line segment with a visible stroke width.",
    createShape: (values) =>
      new Line({
        xs: getSliderValue(values, "xs", -12),
        ys: getSliderValue(values, "ys", 0),
        xe: getSliderValue(values, "xe", 12),
        ye: getSliderValue(values, "ye", 0),
        symbol: new RectangleSymbol({
          width: getSliderValue(values, "line_width", 4),
          height: getSliderValue(values, "line_height", 16),
          inner_dia: 0,
        }),
      }),
    variables: {
      xs: slider("Start X", "xs", -12, -60, 60),
      ys: slider("Start Y", "ys", 0, -60, 60),
      xe: slider("End X", "xe", 12, -60, 60),
      ye: slider("End Y", "ye", 0, -60, 60),
      line_width: slider("Line Width", "line_width", 4, 1, 20),
      line_height: slider("Aperture Height", "line_height", 16, 1, 60),
    },
  },
  {
    id: "primitive-arc",
    title: "Arc",
    description: "A primitive circular arc.",
    createShape: (values) =>
      new Arc({
        xs: getSliderValue(values, "xs", -10),
        ys: getSliderValue(values, "ys", 0),
        xe: getSliderValue(values, "xe", 10),
        ye: getSliderValue(values, "ye", 0),
        xc: getSliderValue(values, "xc", 0),
        yc: getSliderValue(values, "yc", 0),
        symbol: new RoundSymbol({
          outer_dia: getSliderValue(values, "outer_dia", 3),
          inner_dia: getSliderValue(values, "inner_dia", 0),
        }),
      }),
    variables: {
      xs: slider("Start X", "xs", -10, -60, 60),
      ys: slider("Start Y", "ys", 0, -60, 60),
      xe: slider("End X", "xe", 10, -60, 60),
      ye: slider("End Y", "ye", 0, -60, 60),
      xc: slider("Center X", "xc", 0, -60, 60),
      yc: slider("Center Y", "yc", 0, -60, 60),
      outer_dia: slider("Aperture Diameter", "outer_dia", 3, 1, 10),
      inner_dia: slider("Aperture Hole", "inner_dia", 0, 0, 10),
    },
  },
  {
    id: "surface",
    title: "Surface",
    description: "A filled contour made from line segments and arcs.",
    createShape: (values) => {
      const width = getSliderValue(values, "width", 28)
      const height = getSliderValue(values, "height", 20)
      const arcBulge = getSliderValue(values, "arc_bulge", 2)

      return new Surface({
        contours: [
          new Contour({ xs: -width / 2, ys: -height / 2 }).addSegments([
            new Contour_Line_Segment({ x: width / 2, y: -height / 2 }),
            new Contour_Arc_Segment({ x: width / 2, y: height / 2, xc: width / 2 + arcBulge, yc: 0, clockwise: 0 }),
            new Contour_Line_Segment({ x: -width / 2, y: height / 2 }),
            new Contour_Line_Segment({ x: -width / 2, y: -height / 2 }),
          ]),
        ],
      })
    },
    variables: {
      width: slider("Width", "width", 28, 4, 80),
      height: slider("Height", "height", 20, 4, 80),
      arc_bulge: slider("Arc Bulge", "arc_bulge", 2, 0, 20),
    },
  },
  {
    id: "polyline",
    title: "PolyLine",
    description: "A path made from chained line segments.",
    createShape: (values) => {
      const span = getSliderValue(values, "span", 14)
      const turn = getSliderValue(values, "turn", 8)
      return new PolyLine({
        xs: -span,
        ys: -span,
        polarity: getSliderValue(values, "polarity", 1) as 0 | 1,
        pathtype: getComboValue(values, "pathtype", 0) as "round" | "square" | "none",
        cornertype: getComboValue(values, "endtype", 0) as "chamfer" | "round" | "miter",
        width: getSliderValue(values, "width", 3),
        lines: [
          { x: span, y: -span },
          { x: span, y: turn },
          { x: -turn, y: span },
          { x: -span, y: -turn },
        ],
      })
    },
    variables: {
      width: slider("Line Width", "width", 3, 1, 20),
      span: slider("Span", "span", 14, 4, 60),
      turn: slider("Turn", "turn", 8, -40, 40),
      pathtype: combo("Path Type", "pathtype", 0, [
        { label: "Round", value: 0 },
        { label: "Square", value: 1 },
        { label: "None", value: 2 },
      ]),
      endtype: combo("Corner Type", "endtype", 0, [
        { label: "Chamfer", value: 0 },
        { label: "Round", value: 1 },
        { label: "Miter", value: 2 },
      ]),
    },
  },
  {
    id: "step-repeat",
    title: "Step and Repeat",
    description: "A repeated placement of nested artwork.",
    createShape: (values) =>
      new StepAndRepeat({
        shapes: [
          new Pad({ symbol: new RoundSymbol({ outer_dia: getSliderValue(values, "pad_dia", 10), inner_dia: 0 }) }),
          new PolyLine({
            xs: -5,
            ys: -5,
            width: getSliderValue(values, "line_width", 2),
            lines: [
              { x: 5, y: -5 },
              { x: 5, y: 5 },
            ],
          }),
        ],
        repeats: [
          { datum: [getSliderValue(values, "spacing_x", 22), 0], rotation: 0, scale: 1, mirror_x: 0, mirror_y: 0 },
          { datum: [0, getSliderValue(values, "spacing_y", 22)], rotation: 0, scale: 1, mirror_x: 0, mirror_y: 0 },
        ],
      }),
    variables: {
      pad_dia: slider("Pad Diameter", "pad_dia", 10, 1, 40),
      line_width: slider("Line Width", "line_width", 2, 1, 20),
      spacing_x: slider("Spacing X", "spacing_x", 22, 2, 80),
      spacing_y: slider("Spacing Y", "spacing_y", 22, 2, 80),
    },
  },
  {
    id: "datum-point",
    title: "Datum Point",
    description: "Reference point used for alignment and measurement.",
    createShape: (values) =>
      new DatumPoint({
        x: getSliderValue(values, "x", 0),
        y: getSliderValue(values, "y", 0),
        symbol: new RoundSymbol({ outer_dia: getSliderValue(values, "outer_dia", 12), inner_dia: 0 }),
      }),
    variables: {
      x: slider("X", "x", 0, -60, 60),
      y: slider("Y", "y", 0, -60, 60),
      outer_dia: slider("Diameter", "outer_dia", 0, 0, 40),
    },
  },
  {
    id: "datum-text",
    title: "Datum Text",
    description: "Text annotation rendered by the engine.",
    createShape: (values) =>
      new DatumText({
        x: getSliderValue(values, "x", 0),
        y: getSliderValue(values, "y", 0),
        text: getInputValue(values, "text", "DATUM"),
      }) as unknown as Shape,
    variables: {
      x: slider("X", "x", 0, -60, 60),
      y: slider("Y", "y", 0, -60, 60),
      text: input("Text", "text", "DATUM", "Enter datum text"),
    },
  },
  {
    id: "datum-line",
    title: "Datum Line",
    description: "Datum line geometry used for callouts and measurement.",
    createShape: (values) =>
      new DatumLine({
        xs: getSliderValue(values, "xs", -12),
        ys: getSliderValue(values, "ys", 0),
        xe: getSliderValue(values, "xe", 12),
        ye: getSliderValue(values, "ye", 0),
        symbol: new RectangleSymbol({
          width: getSliderValue(values, "line_width", 0),
          height: getSliderValue(values, "line_height", 0),
          inner_dia: 0,
        }),
      }),
    variables: {
      xs: slider("Start X", "xs", -12, -60, 60),
      ys: slider("Start Y", "ys", 0, -60, 60),
      xe: slider("End X", "xe", 12, -60, 60),
      ye: slider("End Y", "ye", 0, -60, 60),
      line_width: slider("Line Width", "line_width", 0, 0, 20),
      line_height: slider("Aperture Height", "line_height", 0, 0, 60),
    },
  },
  {
    id: "datum-arc",
    title: "Datum Arc",
    description: "Datum arc geometry used for arc measurements.",
    createShape: (values) =>
      new DatumArc({
        xs: getSliderValue(values, "xs", -10),
        ys: getSliderValue(values, "ys", 0),
        xe: getSliderValue(values, "xe", 10),
        ye: getSliderValue(values, "ye", 0),
        xc: getSliderValue(values, "xc", 0),
        yc: getSliderValue(values, "yc", 0),
        symbol: new RoundSymbol({ outer_dia: getSliderValue(values, "outer_dia", 12), inner_dia: 0 }),
      }),
    variables: {
      xs: slider("Start X", "xs", -10, -60, 60),
      ys: slider("Start Y", "ys", 0, -60, 60),
      xe: slider("End X", "xe", 10, -60, 60),
      ye: slider("End Y", "ye", 0, -60, 60),
      xc: slider("Center X", "xc", 0, -60, 60),
      yc: slider("Center Y", "yc", 0, -60, 60),
      outer_dia: slider("Aperture Diameter", "outer_dia", 0, 0, 40),
    },
  },
]

export const frameworkSnippets = {
  react: `import { useEffect, useRef } from "react"\nimport { Renderer } from "@grx/engine"\n\nexport function ArtworkView() {\n  const hostRef = useRef<HTMLDivElement | null>(null)\n\n  useEffect(() => {\n    if (!hostRef.current) return\n\n    const renderer = new Renderer({ container: hostRef.current })\n    renderer.interface.create_project("main")\n    renderer.interface.create_step("main", "main")\n    renderer.addManagedView(hostRef.current, { project: "main", step: "main" })\n\n    return () => renderer.destroy()\n  }, [])\n\n  return <div ref={hostRef} style={{ width: "100%", height: 480 }} />\n}\n`,
  svelte: `<script lang="ts">\n  import { onMount } from "svelte"\n  import { Renderer } from "@grx/engine"\n\n  let host: HTMLDivElement | null = null\n\n  onMount(() => {\n    if (!host) return\n\n    const renderer = new Renderer({ container: host })\n    renderer.interface.create_project("main")\n    renderer.interface.create_step("main", "main")\n    renderer.addManagedView(host, { project: "main", step: "main" })\n\n    return () => renderer.destroy()\n  })\n</script>\n\n<div bind:this={host} style="width: 100%; height: 480px;"></div>\n`,
  vue: `<script setup lang="ts">\nimport { onMounted, onBeforeUnmount, ref } from "vue"\nimport { Renderer } from "@grx/engine"\n\nconst host = ref<HTMLDivElement | null>(null)\nlet renderer: Renderer | null = null\n\nonMounted(() => {\n  if (!host.value) return\n\n  renderer = new Renderer({ container: host.value })\n  renderer.interface.create_project("main")\n  renderer.interface.create_step("main", "main")\n  renderer.addManagedView(host.value, { project: "main", step: "main" })\n})\n\nonBeforeUnmount(() => {\n  renderer?.destroy()\n})\n</script>\n\n<template>\n  <div ref="host" style="width: 100%; height: 480px;"></div>\n</template>\n`,
}

export const projectName = "docs"
export const layerName = "preview"
