import React from 'react'
import '../App.css'
import * as Symbols from './symbols'
import * as Shapes from './shapes'
import { RenderEngine } from './engine'
import { Button, Switch, Badge, Box } from '@mantine/core'
// import { IPlotRecord, ISymbolRecord } from './types'
// import { vec2 } from 'gl-matrix'
// import { PointerEvent } from './engine'

// N == Number of Shapes
const N_PADS = 1000
const N_LINES = 50
const N_ARCS = 50
const N_SURFACES = 3
const N_MACROS = 10

const SURFACE_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_SURFACES)
  .fill(0)
  .map((_, i) => {
    SURFACE_RECORDS_ARRAY.push(new Shapes.Surface({
      polarity: 1,
    }).addContours([
      new Shapes.Contour({
        poly_type: 1,
        // Start point.
        xs: 0 + i * 0.1,
        ys: 0 + i * 0.1,
      })
        .addSegments([
          // new Shapes.Contour_Line_Segment({
          //   x: 0.02 + i * 0.1,
          //   y: -0.02 + i * 0.1,
          // }),
          new Shapes.Contour_Arc_Segment({
            x: 0.02 + i * 0.1,
            y: -0.02 + i * 0.1,
            xc: 0.015 + i * 0.1,
            yc: -0.005 + i * 0.1,
            // computer the center coordinates of the Shapes.Arc with a radius of 0.1
            clockwise: 0,
          }),
          new Shapes.Contour_Line_Segment({
            x: 0.05 + i * 0.1,
            y: -0.02 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: 0.05 + i * 0.1,
            y: 0.05 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: -0.05 + i * 0.1,
            y: 0.05 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: -0.05 + i * 0.1,
            y: -0.05 + i * 0.1,
          }),
          // new Contour_Arc_Segment_Record({
          //   x: -0.5 + i,
          //   y: -0.5 + i,
          //   xc: -0.5 + i,
          //   yc: 0 + i,
          //   // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          //   clockwise: 0,
          // }),
          new Shapes.Contour_Line_Segment({
            x: 0 + i * 0.1,
            y: 0 + i * 0.1,
          }),
        ]),
      new Shapes.Contour({
        poly_type: 0,
        // Start point.
        xs: 0.04 + i * 0.1,
        ys: 0.04 + i * 0.1,
      })
        .addSegments([
          new Shapes.Contour_Line_Segment({
            x: 0.04 + i * 0.1,
            y: 0.03 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: 0.03 + i * 0.1,
            y: 0.03 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: 0.03 + i * 0.1,
            y: 0.04 + i * 0.1,
          }),
          new Shapes.Contour_Line_Segment({
            x: 0.04 + i * 0.1,
            y: 0.04 + i * 0.1,
          }),
        ]),
      // new Shapes.Contour({
      //   poly_type: 0,
      //   // Start point.
      //   xs: 0.04 + i * 0.1,
      //   ys: 0.04 + i * 0.1,
      // })
      //   .addSegments([
      //     new Shapes.Contour_Line_Segment({
      //       x: 0.04 + i * 0.1,
      //       y: 0.03 + i * 0.1,
      //     }),
      //     new Shapes.Contour_Line_Segment({
      //       x: 0.03 + i * 0.1,
      //       y: 0.03 + i * 0.1,
      //     }),
      //     new Shapes.Contour_Line_Segment({
      //       x: 0.03 + i * 0.1,
      //       y: 0.04 + i * 0.1,
      //     }),
      //     new Shapes.Contour_Line_Segment({
      //       x: 0.04 + i * 0.1,
      //       y: 0.04 + i * 0.1,
      //     }),
      //   ])
    ]))
  })


const SYMBOLS: Symbols.StandardSymbol[] = []

new Array<number>(Symbols.STANDARD_SYMBOLS.length)
  .fill(0)
  .map((_, i) => {
    const sym =
      new Symbols.StandardSymbol({
        id: 'symbol' + i, // id
        symbol: i, // symbol
        width: 0.01, // width, square side, diameter
        height: 0.01, // height
        corner_radius: 0.002, // corner radius
        corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
        outer_dia: 0.01, // — Outer diameter of the shape
        inner_dia: 0.008, // — Inner diameter of the shape
        line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
        line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
        angle: 0, // — Angle of the spoke from 0 degrees
        gap: 0.001, // — Gap
        num_spokes: 2, // — Number of spokes
        round: 0, // —r|s == 1|0 — Support for rounded or straight corners
        cut_size: 0, // — Size of the cut ( see corner radius )
        ring_width: 0.001, // — Ring width
        ring_gap: 0.004, // — Ring gap
        num_rings: 2 // — Number of rings
      })

    SYMBOLS.push(sym)
  })

const round_sym =
  new Symbols.StandardSymbol({
    id: 'round', // id
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Round, // symbol
    width: 0.01, // width, square side, diameter
    height: 0.01, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(round_sym)

const square_sym =
  new Symbols.StandardSymbol({
    id: 'round', // id
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.01, // width, square side, diameter
    height: 0.01, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(square_sym)


const square2_sym =
  new Symbols.StandardSymbol({
    id: 'round', // id
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.04, // width, square side, diameter
    height: 0.04, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(square2_sym)


const PAD_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_PADS)
  .fill(0).map((_, i) => {
    PAD_RECORDS_ARRAY.push(new Shapes.Pad({
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: i % Object.keys(Symbols.STANDARD_SYMBOLS).length,
      symbol: SYMBOLS[i % SYMBOLS.length],
      // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      resize_factor: Math.random() + 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 10,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const LINE_RECORDS_ARRAY_NEG: Shapes.Shape[] = []
new Array<number>(N_LINES)
  .fill(0).map((_, i) => {
    LINE_RECORDS_ARRAY_NEG.push(new Shapes.Line({

      // Start point.
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: i % 2 == 0 ? square_sym : round_sym,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      polarity: 0,
    }))
  })

const LINE_RECORDS_ARRAY_POS: Shapes.Shape[] = []
new Array<number>(N_LINES)
  .fill(0).map((_, i) => {
    LINE_RECORDS_ARRAY_POS.push(new Shapes.Line({
      // Start point.
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: i % 2 == 0 ? square_sym : round_sym,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      polarity: 1,
    }))
  })


const ARC_RECORDS_ARRAY: Shapes.Arc[] = []
new Array<number>(N_ARCS)
  .fill(0).map((_, i) => {
    const start_angle = Math.abs(Math.random()) * 360
    const end_angle = Math.abs(Math.random()) * 360
    const radius = Math.abs(Math.random()) * 0.1
    const center_x = (Math.random() - 0.5) * 1
    const center_y = (Math.random() - 0.5) * 1
    function degreesToRadians(degrees: number): number {
      return degrees * (Math.PI / 180);
    }
    ARC_RECORDS_ARRAY.push(new Shapes.Arc({
      // Center point.
      xc: center_x,
      yc: center_y,

      // Start point.
      xs: center_x + Math.cos(degreesToRadians(start_angle)) * radius,
      ys: center_y + Math.sin(degreesToRadians(start_angle)) * radius,

      // End point.
      xe: center_x + Math.cos(degreesToRadians(end_angle)) * radius,
      ye: center_y + Math.sin(degreesToRadians(end_angle)) * radius,

      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: round_sym,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      clockwise: Math.random() > 0.5 ? 1 : 0,
      // clockwise: 0,
    }))
  })

const MACROS_ARRAY: Symbols.Symbol[] = []
new Array<number>(10)
  .fill(0).map((_, i) => {
    MACROS_ARRAY.push(new Symbols.MacroSymbol({
      id: 'macro' + i, // id
      shapes: [
        // PAD_RECORDS_ARRAY[i],
        // PAD_RECORDS_ARRAY[i + 1],
        // LINE_RECORDS_ARRAY_POS[i],
        // LINE_RECORDS_ARRAY_POS[i + 1],
        // LINE_RECORDS_ARRAY_NEG[i],
        // LINE_RECORDS_ARRAY_NEG[i + 1],
        // ARC_RECORDS_ARRAY[i],
        // ARC_RECORDS_ARRAY[i + 1],
        SURFACE_RECORDS_ARRAY[i]
      ]
    }))
  })

const MACRO_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_MACROS)
  .fill(0).map((_, i) => {
    MACRO_RECORDS_ARRAY.push(new Shapes.Pad({
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      polarity: Math.random() > 0.5 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 20,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const large_square_sym =
  new Symbols.StandardSymbol({
    id: 'round', // id
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.5, // width, square side, diameter
    height: 0.5, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })


const OVERLAPPING_PADS_ARRAY: Shapes.Pad[] = []
new Array<number>(3)
  .fill(0).map((_, i) => {
    OVERLAPPING_PADS_ARRAY.push(new Shapes.Pad({
      // Center point.
      x: i / 8,
      y: i / 9,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: large_square_sym,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: 1,
      polarity: i % 2 == 0 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const OVERLAPPING_MACROS_ARRAY: Symbols.Symbol[] = []

new Array<number>(1)
  .fill(0).map((_, i) => {
    OVERLAPPING_MACROS_ARRAY.push(new Symbols.MacroSymbol({
      id: 'macro' + i, // id
      shapes: OVERLAPPING_PADS_ARRAY,
      // flattenening a macro will cause the macro to be drawn as a single shape, rather than as a collection of shapes.
      // negative shapes within the macro will be subtracted from the positive shapes and not have an effect on the rest of the image.
      // negatives will act like holes in the macro, rather than being drawn as negative shapes.
      flatten: false
    }))
  })

const SPOOF_OVERLAPPING_MACROS_ARRAY: Symbols.Symbol[] = []

new Array<number>(1)
  .fill(0).map((_, i) => {
    SPOOF_OVERLAPPING_MACROS_ARRAY.push(new Symbols.MacroSymbol({
      id: 'macro' + i, // id
      shapes: [OVERLAPPING_PADS_ARRAY[0]],
      // flattenening a macro will cause the macro to be drawn as a single shape, rather than as a collection of shapes.
      // negative shapes within the macro will be subtracted from the positive shapes and not have an effect on the rest of the image.
      // negatives will act like holes in the macro, rather than being drawn as negative shapes.
      flatten: true
    }))
  })

const OVERLAPPING_MACRO_RECORDS_ARRAY: Shapes.Pad[] = []
new Array<number>(10)
  .fill(0).map((_, i) => {
    OVERLAPPING_MACRO_RECORDS_ARRAY.push(new Shapes.Pad({
      // Center point.
      x: i / 10,
      y: -i / 10,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: OVERLAPPING_MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: 1,
      polarity: i % 2 == 0 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const SPOOF_OVERLAPPING_MACRO_RECORDS_ARRAY: Shapes.Pad[] = []
new Array<number>(10)
  .fill(0).map((_, i) => {
    SPOOF_OVERLAPPING_MACRO_RECORDS_ARRAY.push(new Shapes.Pad({
      // Center point.
      x: i / 10 + 1,
      y: -i / 10 + 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: SPOOF_OVERLAPPING_MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: 1,
      polarity: i % 2 == 0 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const POLYLINE_RECORDS_ARRAY: Shapes.PolyLine[] = []
new Array<number>(1)
  .fill(0).map((_, i) => {
    POLYLINE_RECORDS_ARRAY.push(new Shapes.PolyLine({
      // Start point.
      // xs: (Math.random() - 0.5) * 1,
      // ys: (Math.random() - 0.5) * 1,
      xs: 0,
      ys: 0,

      cornertype: 'miter',

      pathtype: 'square',
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      polarity: 1,
      width: 0.05,
    }).addLines([
      {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
      },
      {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
      },
      {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
      },
      {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
      },
      {
        x: 0.0,
        y: 0.5,
      },
      {
        x: 0.5,
        y: 0.5,
      },
      {
        x: 0.0,
        y: -1.0,
      },
      {
        x: -0.5,
        y: -0.5,
      }
    ]))

  })

const DUPLICATE_POLYLINE_RECORDS_ARRAY: Shapes.StepAndRepeat[] = []
new Array<number>(1)
  .fill(0).map((_, i) => {
    DUPLICATE_POLYLINE_RECORDS_ARRAY.push(
      new Shapes.StepAndRepeat({
        shapes: POLYLINE_RECORDS_ARRAY,
        repeats: [
        {
          datum: [0, 0],
          mirror: 0,
          rotation: 0,
          scale: 1,
        },
        {
          datum: [1, 0],
          mirror: 1,
          rotation: 0,
          scale: 1,
        },
        // {
        //   datum: [0, 0],
        //   mirror: 0,
        //   rotation: 0,
        //   scale: 2,
        // }
      ]
      })
    )

  })

function REGLApp(): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(document.createElement('div'))
  const [engine, setEngine] = React.useState<RenderEngine>()

  React.useEffect(() => {
    const Engine = new RenderEngine({
      container: containerRef.current,
      attributes: {
        antialias: false,
      }
    })

    Engine.settings.OUTLINE_MODE = true
    // Engine.settings.FLATTEN_MACROS = true
    // Engine.SETTINGS.BACKGROUND_COLOR = [1, 1, 1, 1]



    Engine.addLayer({
      name: 'origin',
      color: [1, 1, 1],
      transform: {
        datum: [0, 0],
        scale: 1,
        rotation: 0,
      },
      image: [
        new Shapes.Pad({
          // Center point.
          x: 0,
          y: 0,
          // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
          // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
          symbol: round_sym,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          // resize_factor: Math.random() + 1,
          resize_factor: 1,
          // Polarity. 0 = negative, 1 = positive
          polarity: 1,
          // Shapes.Pad orientation (degrees)
          // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
          rotation: 0,
          // 0 = no mirror, 1 = mirror
          mirror: 0
        })
      ]
    })

    Engine.addLayer({
      name: 'pads',
      transform: {
        datum: [0.5, 0],
        scale: 1,
        rotation: 0,
        mirror: 1,
      },
      image: PAD_RECORDS_ARRAY
    })

    Engine.addLayer({
      name: '+/- lines',
      transform: {
        // datum: [0.5, 0],
        // scale: 1,
        // rotation: 0,
        // mirror: true,
      },
      image: [...LINE_RECORDS_ARRAY_POS, ...LINE_RECORDS_ARRAY_NEG]
    })

    // const layer2 = Engine.addLayer({
    //   name: 'layer2',
    //   image: ARC_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'layer3',
    //   image: MACRO_RECORDS_ARRAY
    // })

    const macroLayer = Engine.addLayer({
      name: 'overlapping-macro',
      image: OVERLAPPING_MACRO_RECORDS_ARRAY
    })

    const polylineLayer = Engine.addLayer({
      name: 'polyline',
      image: POLYLINE_RECORDS_ARRAY
    })

    Engine.addLayer({
      name: 'duplicate-polyline',
      image: DUPLICATE_POLYLINE_RECORDS_ARRAY
    })

    // setTimeout(() => {
    //   // arcs.value.map(a => a.value.polarity = 0)
    //   // arcs.value[0].value.polarity = 0
    //   // layer2.records.map(a => a.value.polarity = Math.random() > 0.5 ? 1 : 0)
    //   console.log('triggering update')
    //   // console.log(macroLayer.records.map(a => a.value.polarity))
    //   // macroLayer.records.map(a => a.value.polarity = 0)
    //   macroLayer.records.map(record => {
    //     if (record instanceof Shapes.Pad && record.symbol instanceof Symbols.MacroSymbol) {
    //       // record.value.x = Math.random()
    //       // record.value.y = Math.random()
    //       // record.polarity = 0
    //       // record.polarity = 1
    //       // record.polarity = Math.random() > 0.5 ? 1 : 0
    //       record.polarity = record.index % 2 == 0 ? 1 : 0
    //       // record.value.symbol.value.shapes.map(shape => {
    //       //   if (shape.value instanceof Shapes.Pad) {
    //       //     shape.value.polarity = Math.random() > 0.5 ? 1 : 0
    //       //   }
    //       // })
    //       // record.value.symbol.value.shapes.map(shape => {
    //       //   if (shape.value instanceof Shapes.Pad) {
    //       //     shape.value.polarity = Math.random() > 0.5 ? 1 : 0
    //       //   }
    //       // })
    //     }
    //   })
    //   // console.log(macroLayer.records)
    //   // console.log('triggered update')
    //   Engine.render(true)
    // }, 2000)


    // console.log(Engine.symbols.records.get('round')?.value)
    // Engine.symbols.refresh()
    // Engine.render(true)



    Engine.addLayer({
      name: 'surface-arc-combo',
      image: [...SURFACE_RECORDS_ARRAY, ...ARC_RECORDS_ARRAY]
    })

    Engine.addLayer({
      name: 'surfaces',
      image: SURFACE_RECORDS_ARRAY
    })

    Engine.layers.map(l => l.visible = false)
    Engine.render(true)

    Engine.pointer.addEventListener('pointerdown', console.log)

    setEngine(Engine)

    return () => {
      Engine.pointer.removeEventListener('pointerdown', console.log)
      Engine.destroy()
    }

  }, [])

  return (
    <>
      <div
        ref={containerRef}
        id="container-element"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      {engine ?

        <Box style={{
          width: '100px'
        }}>
          <StatsWidget />
          <Button
            onClick={(): void => { engine.layers.map(l => l.color = [Math.random(), Math.random(), Math.random()]) && engine.render(true) }}>
            Randomize Colors
          </Button>
          <br />
          Outline Mode
          <Switch
            defaultChecked={engine.settings.OUTLINE_MODE}
            onChange={(e): void => { engine.settings.OUTLINE_MODE = e.target.checked }} />
          <br />
          Zoom To Cursor
          <Switch
            defaultChecked={engine.settings.ZOOM_TO_CURSOR}
            onChange={(e): void => { engine.settings.ZOOM_TO_CURSOR = e.target.checked }} />
          {
            engine.layers.map((layer, i) => {
              return (
                <div key={i}>
                  {layer.name}
                  <Switch
                    defaultChecked={layer.visible}
                    onChange={(e): void => {
                      layer.visible = e.target.checked
                      engine.render(true)
                    }} />
                </div>
              )
            })
          }
        </Box>

        : null}
    </>
  )
}

function StatsWidget(): JSX.Element {
  const [fps, setFPS] = React.useState<number>(0)
  const [avgFPS, setAvgFPS] = React.useState<number>(0)

  let totalFPS = 0
  const frameTimes: number[] = []
  let frameCursor = 0
  const maxFrames = 100
  let numFrames = 0

  let then = performance.now()
  function updateFPS(now: number): void {
    now *= 0.001
    const deltaTime = now - then
    then = now
    const fps = 1 / deltaTime
    setFPS(Math.round(fps))
    totalFPS += fps - (frameTimes[frameCursor] || 0)
    frameTimes[frameCursor++] = fps
    numFrames = Math.max(numFrames, frameCursor)
    frameCursor %= maxFrames
    const avgFPS = totalFPS / numFrames
    setAvgFPS(Math.round(avgFPS))
    requestAnimationFrame(updateFPS)
  }

  React.useEffect(() => {
    requestAnimationFrame(updateFPS)
  }, [])


  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 10,
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: 12,
      pointerEvents: 'none',
      zIndex: 100,
      userSelect: 'none',
    }}>
      <div>FPS: {fps}</div>
      <div>Avg FPS: {avgFPS}</div>
    </div>
  )
}


export default REGLApp
