import React, { useMemo } from "react"
import "../App.css"
import * as Symbols from "./symbols"
import * as Shapes from "./shapes"
import { RenderEngine } from "."
import { Button, Switch, Box, SegmentedControl } from "@mantine/core"
import { PointerEvent, PointerEvents } from "."

// import gdsiiFile from '@lib/gdsii/testdata/GdsIITests_test.gds?url'
// import gdsiiFile from '@lib/gdsii/testdata/inv.gds2?arraybuffer'

import cmp from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.cmp?arraybuffer"
import drd from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.drd?arraybuffer"
import gko from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.gko?arraybuffer"
import plc from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.plc?arraybuffer"
import pls from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.pls?arraybuffer"
import sol from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sol?arraybuffer"
import stc from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.stc?arraybuffer"
import sts from "@lib/gerber/testdata/boards/bus-pirate/BusPirate-v3.6a-SSOP.sts?arraybuffer"
// import nested_aperture_macro from '@lib/gerber/testdata/gerbers/block-apertures/nested.gbr?raw'
// import multi_polarity_over_existing from '@lib/gerber/testdata/gerbers/step-repeats/multi-polarity-over-existing.gbr?raw'
// import multi_polarity_over_self from '@lib/gerber/testdata/gerbers/step-repeats/multi-polarity-over-self.gbr?raw'
// import gtl_in from '@lib/gerber/testdata/boards/mini_linux_board_inch/Gerber_TopLayer.GTL?raw'
// import gtl_mm from '@lib/gerber/testdata/boards/mini_linux_board_mm/Gerber_TopLayer.GTL?raw'

import { LayerRendererProps } from "./layer"

const N_PADS = 0
const N_LINES = 0
const N_ARCS = 0
const N_SURFACES = 10
const N_MACROS = 0

const SQUARE_GRID: Shapes.Shape[] = []
new Array<number>(100).fill(0).map((_, i) => {
  SQUARE_GRID.push(
    new Shapes.Pad({
      // Start point.
      x: (i % 10) * 0.02,
      y: Math.floor(i / 10) * 0.02,
      rotation: 10,
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      // symbol: new Symbols.SquareSymbol({
      //   width: 0.01,
      //   height: 0.01,
      //   inner_dia: 0,

      // }),
      symbol: new Symbols.CircleThermalSymbol({
        inner_dia: 0.005,
        outer_dia: 0.01,
        angle: 20,
        gap: 0.001,
        num_spokes: 2,
        round: 1,
      }),
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      polarity: 1,
    }),
  )
})

const STEP_AND_REPEAT: Shapes.Shape[] = []
// new Array<number>(1)
//   .fill(0).map((_, i) => {
STEP_AND_REPEAT.push(
  new Shapes.StepAndRepeat({
    shapes: [
      new Shapes.Pad({
        // Start point.
        // x: (i % 10) * 0.02,
        // y: Math.floor(i / 10) * 0.02,
        x: 0,
        y: 0,
        // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
        symbol: new Symbols.SquareSymbol({
          width: 0.01,
          height: 0.01,
          inner_dia: 0,
        }),
        // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
        // Polarity. 0 = negative, 1 = positive
        // polarity: i % 2,
        // polarity: Math.random() > 0.5 ? 1 : 0,
        polarity: 1,
      }),
    ],
    // repeats: [{
    //   datum: [0, 0],
    //   rotation: 0,
    //   scale: 1,
    //   mirror: 0
    // },
    // {
    //   datum: [0.02, 0.02],
    //   rotation: 0,
    //   scale: 1,
    //   mirror: 0
    // }]
    repeats: new Array(100).fill(0).map((_, i) => {
      return {
        datum: [(i % 10) * 0.02, Math.floor(i / 10) * 0.02],
        rotation: 0,
        scale: 1,
        mirror_x: 0,
        mirror_y: 0,
      }
    }),
  }),
)
// })

const MAMA_STEP_AND_REPEAT: Shapes.Shape[] = []
new Array<number>(1).fill(0).map(() => {
  MAMA_STEP_AND_REPEAT.push(
    new Shapes.StepAndRepeat({
      shapes: STEP_AND_REPEAT,
      repeats: [
        {
          datum: [0.2, 0],
          rotation: 0,
          scale: 1,
          mirror_x: 0,
          mirror_y: 0,
        },
        {
          datum: [0, 0.2],
          rotation: 20,
          scale: 1,
          mirror_x: 0,
          mirror_y: 0,
        },
      ],
    }),
  )
})

const SURFACE_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_SURFACES).fill(0).map((_, i) => {
  SURFACE_RECORDS_ARRAY.push(
    new Shapes.Surface({
      polarity: 1,
    }).addContours([
      new Shapes.Contour({
        poly_type: 1,
        // Start point.
        xs: 0 + i * 0.1,
        ys: 0 + i * 0.1,
      }).addSegments([
        // new Shapes.Contour_Line_Segment({
        //   x: 0.02 + i * 0.1,
        //   y: -0.02 + i * 0.1,
        // }),
        new Shapes.Contour_Arc_Segment({
          x: 0.02 + i * 0.1,
          y: -0.02 + i * 0.1,
          xc: 0.02 + i * 0.1,
          yc: -0.0 + i * 0.1,
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
        new Shapes.Contour_Arc_Segment({
          x: 0 + i * 0.1,
          y: 0 + i * 0.1,
          xc: -0.045 + i * 0.1,
          yc: -0.005 + i * 0.1,
          // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          clockwise: 0,
        }),
        // new Shapes.Contour_Line_Segment({
        //   x: 0 + i * 0.1,
        //   y: 0 + i * 0.1,
        // }),
      ]),
      // new Shapes.Contour({
      //   poly_type: 0,
      //   // Start point.
      //   xs: 0.04 + i * 0.1,
      //   ys: 0.04 + i * 0.1,
      // }).addSegments([
      //   new Shapes.Contour_Line_Segment({
      //     x: 0.04 + i * 0.1,
      //     y: 0.03 + i * 0.1,
      //   }),
      //   new Shapes.Contour_Line_Segment({
      //     x: 0.03 + i * 0.1,
      //     y: 0.03 + i * 0.1,
      //   }),
      //   new Shapes.Contour_Line_Segment({
      //     x: 0.03 + i * 0.1,
      //     y: 0.04 + i * 0.1,
      //   }),
      //   new Shapes.Contour_Line_Segment({
      //     x: 0.04 + i * 0.1,
      //     y: 0.04 + i * 0.1,
      //   }),
      // ]),
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
    ]),
  )
})

// SURFACE_RECORDS_ARRAY.push(
//   new Shapes.Surface({
//     polarity: 1,
//   }).addContour(
//     new Shapes.Contour({
//       poly_type: 1,
//       // Start point.
//       xs: -1,
//       ys: 0,
//     }).addSegments([
//       // new Shapes.Contour_Line_Segment({
//       //   x: 0.02 + i * 0.1,
//       //   y: -0.02 + i * 0.1,
//       // }),
//       new Shapes.Contour_Arc_Segment({
//         x: 0,
//         y: -1,
//         xc: 0,
//         yc: 0,
//         // computer the center coordinates of the Shapes.Arc with a radius of 0.1
//         clockwise: 0,
//       }),
//       new Shapes.Contour_Line_Segment({
//         x: -1,
//         y: 0,
//       }),
//     ]),
//   ),
// )

const SURFACE_ARC_TEST: Shapes.Surface[] = []

let i = 0
// SURFACE_ARC_TEST.push(new Shapes.Surface({
//   polarity: 1,
// }).addContour(
//   new Shapes.Contour({
//     poly_type: 1,
//     // Start point.
//     xs: -1 + i,
//     ys: 0,
//     segments: [
//       new Shapes.Contour_Arc_Segment({
//         x: 0 + i,
//         y: -1,
//         xc: 0 + i,
//         yc: 0,
//         // computer the center coordinates of the Shapes.Arc with a radius of 0.1
//         clockwise: 1,
//       }),
//       new Shapes.Contour_Line_Segment({
//         x: -1 + i,
//         y: 0,
//       }),
//     ]
//   })
// ))

i += 1
// SURFACE_ARC_TEST.push(new Shapes.Surface({
//   polarity: 1,
// }).addContour(
//   new Shapes.Contour({
//     poly_type: 1,
//     // Start point.
//     xs: -1 + i,
//     ys: 0,
//     segments: [
//       new Shapes.Contour_Arc_Segment({
//         x: 0 + i,
//         y: -1,
//         xc: 0 + i,
//         yc: 0,
//         // computer the center coordinates of the Shapes.Arc with a radius of 0.1
//         clockwise: 0,
//       }),
//       new Shapes.Contour_Line_Segment({
//         x: -1 + i,
//         y: 0,
//       }),
//     ]
//   })
// ))

i += 1
SURFACE_ARC_TEST.push(
  new Shapes.Surface({
    polarity: 1,
  }).addContour(
    new Shapes.Contour({
      poly_type: 1,
      // Start point.
      xs: 0 + i,
      ys: -1,
      segments: [
        new Shapes.Contour_Arc_Segment({
          x: 1 + i,
          y: 0,
          xc: 0 + i,
          yc: 0,
          // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          clockwise: 1,
        }),
        new Shapes.Contour_Line_Segment({
          x: 0 + i,
          y: -1,
        }),
      ],
    }),
  ),
)

i += 1
SURFACE_ARC_TEST.push(
  new Shapes.Surface({
    polarity: 1,
  }).addContour(
    new Shapes.Contour({
      poly_type: 1,
      // Start point.
      xs: 0 + i,
      ys: -1,
      segments: [
        new Shapes.Contour_Arc_Segment({
          x: 1 + i,
          y: 0,
          xc: 0 + i,
          yc: 0,
          // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          clockwise: 0,
        }),
        new Shapes.Contour_Line_Segment({
          x: 0 + i,
          y: -1,
        }),
      ],
    }),
  ),
)

i += 1
SURFACE_ARC_TEST.push(
  new Shapes.Surface({
    polarity: 1,
  }).addContour(
    new Shapes.Contour({
      poly_type: 1,
      // Start point.
      xs: 1 + i,
      ys: 0,
      segments: [
        new Shapes.Contour_Arc_Segment({
          x: 0 + i,
          y: 1,
          xc: 0 + i,
          yc: 0,
          // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          clockwise: 1,
        }),
        new Shapes.Contour_Line_Segment({
          x: 1 + i,
          y: 0,
        }),
      ],
    }),
  ),
)

i += 1
SURFACE_ARC_TEST.push(
  new Shapes.Surface({
    polarity: 1,
  }).addContour(
    new Shapes.Contour({
      poly_type: 1,
      // Start point.
      xs: 1 + i,
      ys: 0,
      segments: [
        new Shapes.Contour_Arc_Segment({
          x: 0 + i,
          y: 1,
          xc: 0 + i,
          yc: 0,
          // computer the center coordinates of the Shapes.Arc with a radius of 0.1
          clockwise: 0,
        }),
        new Shapes.Contour_Line_Segment({
          x: 1 + i,
          y: 0,
        }),
      ],
    }),
  ),
)

const SYMBOLS: Symbols.StandardSymbol[] = []

new Array<number>(Symbols.STANDARD_SYMBOLS.length).fill(0).map((_, i) => {
  const sym = new Symbols.StandardSymbol({
    id: "symbol" + i, // id
    symbol: i, // symbol
    width: 0.01, // width, square side, diameter
    height: 0.01, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.0075, // — Inner diameter of the shape
    line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
    line_length: 0.01, // — Shapes.Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2, // — Number of rings
  })

  SYMBOLS.push(sym)
})

// const round_sym =
//   new Symbols.StandardSymbol({
//     id: 'round', // id
//     symbol: Symbols.STANDARD_SYMBOLS_MAP.Round, // symbol
//     width: 0.01, // width, square side, diameter
//     height: 0.01, // height
//     corner_radius: 0.002, // corner radius
//     corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
//     outer_dia: 0.01, // — Outer diameter of the shape
//     // inner_dia: 0.008, // — Inner diameter of the shape
//     line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
//     line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
//     angle: 0, // — Angle of the spoke from 0 degrees
//     gap: 0.001, // — Gap
//     num_spokes: 2, // — Number of spokes
//     round: 0, // —r|s == 1|0 — Support for rounded or straight corners
//     cut_size: 0, // — Size of the cut ( see corner radius )
//     ring_width: 0.001, // — Ring width
//     ring_gap: 0.004, // — Ring gap
//     num_rings: 2 // — Number of rings
//   })

const round_sym = new Symbols.RoundSymbol({
  outer_dia: 0.1,
  inner_dia: 0,
})

SYMBOLS.push(round_sym)

const square_sym = new Symbols.StandardSymbol({
  id: "round", // id
  symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
  width: 0.01, // width, square side, diameter
  height: 0.01, // height
  corner_radius: 0.002, // corner radius
  corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
  outer_dia: 0.01, // — Outer diameter of the shape
  // inner_dia: 0.0, // — Inner diameter of the shape
  line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
  line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
  angle: 0, // — Angle of the spoke from 0 degrees
  gap: 0.001, // — Gap
  num_spokes: 2, // — Number of spokes
  round: 0, // —r|s == 1|0 — Support for rounded or straight corners
  cut_size: 0, // — Size of the cut ( see corner radius )
  ring_width: 0.001, // — Ring width
  ring_gap: 0.004, // — Ring gap
  num_rings: 2, // — Number of rings
})

SYMBOLS.push(square_sym)

const square2_sym = new Symbols.StandardSymbol({
  id: "round", // id
  symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
  width: 0.04, // width, square side, diameter
  height: 0.04, // height
  corner_radius: 0.002, // corner radius
  corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
  outer_dia: 0.04, // — Outer diameter of the shape
  // inner_dia: 0.038, // — Inner diameter of the shape
  line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
  line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
  angle: 0, // — Angle of the spoke from 0 degrees
  gap: 0.001, // — Gap
  num_spokes: 2, // — Number of spokes
  round: 0, // —r|s == 1|0 — Support for rounded or straight corners
  cut_size: 0, // — Size of the cut ( see corner radius )
  ring_width: 0.001, // — Ring width
  ring_gap: 0.004, // — Ring gap
  num_rings: 2, // — Number of rings
})

SYMBOLS.push(square2_sym)

// const polygon_sym =
//   new Symbols.PolygonSymbol({
//     id: 'round',
//     corners: 8,
//     outer_dia: 0.04,
//     inner_dia: 0,
//     line_width: 0,
//     angle: 10
//   })

// SYMBOLS.push(square2_sym)

// const polygons = [
//   new Shapes.Pad({
//     // Start point.
//     x: 0,
//     y: 0,
//     // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
//     symbol: polygon_sym,
//     // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//     // Polarity. 0 = negative, 1 = positive
//     // polarity: i % 2,
//     // polarity: Math.random() > 0.5 ? 1 : 0,
//     polarity: 1,
//   })
// ]

const PAD_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_PADS).fill(0).map((_, i) => {
  PAD_RECORDS_ARRAY.push(
    new Shapes.Pad({
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // x: i / 10,
      // y: 0,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: i % Object.keys(Symbols.STANDARD_SYMBOLS).length,
      symbol: SYMBOLS[i % SYMBOLS.length],
      // symbol: polygon_sym,
      // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      resize_factor: Math.random() + 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      // mirror: i % 2,
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const LINE_RECORDS_ARRAY_NEG: Shapes.Shape[] = []
new Array<number>(N_LINES).fill(0).map((_, i) => {
  LINE_RECORDS_ARRAY_NEG.push(
    new Shapes.Line({
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
    }),
  )
})

const LINE_RECORDS_ARRAY_POS: Shapes.Shape[] = []
new Array<number>(N_LINES).fill(0).map((_, i) => {
  LINE_RECORDS_ARRAY_POS.push(
    new Shapes.Line({
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
    }),
  )
})

// const LINE_BRUSH_RECORDS_ARRAY_POS: Shapes.Shape[] = []
// new Array<number>(10)
//   .fill(0).map((_, i) => {
//     LINE_BRUSH_RECORDS_ARRAY_POS.push(new Shapes.BrushedLine({
//       // Start point.
//       xs: (Math.random() - 0.5) * 1,
//       ys: (Math.random() - 0.5) * 1,

//       // End point.
//       xe: (Math.random() - 0.5) * 1,
//       ye: (Math.random() - 0.5) * 1,

//       // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
//       // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
//       symbol: brush_sym,
//       // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//       // Polarity. 0 = negative, 1 = positive
//       // polarity: i % 2,
//       // polarity: Math.random() > 0.5 ? 1 : 0,
//       polarity: 1,
//       rotation: 45,
//       mirror_x: 0,
//       mirror_y: 0,
//     }))
//   })

// const ARC_BRUSH_RECORDS_ARRAY_POS: Shapes.BrushedArc[] = []
// new Array<number>(N_ARCS)
//   .fill(0).map((_, i) => {
//     const start_angle = Math.abs(Math.random()) * 360
//     const end_angle = Math.abs(Math.random()) * 360
//     const radius = Math.abs(Math.random()) * 0.1
//     const center_x = (Math.random() - 0.5) * 1
//     const center_y = (Math.random() - 0.5) * 1
//     function degreesToRadians(degrees: number): number {
//       return degrees * (Math.PI / 180);
//     }
//     ARC_BRUSH_RECORDS_ARRAY_POS.push(new Shapes.BrushedArc({
//       // Center point.
//       xc: center_x,
//       yc: center_y,

//       // Start point.
//       xs: center_x + Math.cos(degreesToRadians(start_angle)) * radius,
//       ys: center_y + Math.sin(degreesToRadians(start_angle)) * radius,

//       // End point.
//       xe: center_x + Math.cos(degreesToRadians(end_angle)) * radius,
//       ye: center_y + Math.sin(degreesToRadians(end_angle)) * radius,

//       // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
//       // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
//       symbol: brush_sym,
//       // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//       // Polarity. 0 = negative, 1 = positive
//       polarity: 1,
//       // polarity: Math.random() > 0.5 ? 1 : 0,
//       clockwise: Math.random() > 0.5 ? 1 : 0,
//       // clockwise: 0,
//       rotation: 45,
//       // resize_factor: 0.1,
//     }))
//   })

// new Array<number>(1)
//   .fill(0).map((_, i) => {
//     const start_angle = 180
//     const end_angle = 185
//     const radius = 1
//     const center_x = 0
//     const center_y = 0
//     function degreesToRadians(degrees: number): number {
//       return degrees * (Math.PI / 180);
//     }
//     const random_x_offset = Math.random() * 1
//     const random_y_offset = Math.random() * 1
//     ARC_BRUSH_RECORDS_ARRAY_POS.push(new Shapes.BrushedArc({
//       // Center point.
//       xc: center_x,
//       yc: center_y,

//       // Start point.
//       xs: center_x + Math.cos(degreesToRadians(start_angle)) * radius,
//       ys: center_y + Math.sin(degreesToRadians(start_angle)) * radius,

//       // End point.
//       xe: center_x + Math.cos(degreesToRadians(end_angle)) * radius,
//       ye: center_y + Math.sin(degreesToRadians(end_angle)) * radius,

//       // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
//       // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
//       symbol: brush_sym,
//       // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//       // Polarity. 0 = negative, 1 = positive
//       polarity: 1,
//       // polarity: Math.random() > 0.5 ? 1 : 0,
//       clockwise: 0,
//       // clockwise: 0,
//       rotation: 45,
//       resize_factor: 3,
//     }))
//   })

const ARC_RECORDS_ARRAY: Shapes.Arc[] = []
new Array<number>(N_ARCS).fill(0).map(() => {
  const start_angle = Math.abs(Math.random()) * 360
  const end_angle = Math.abs(Math.random()) * 360
  const radius = Math.abs(Math.random()) * 0.1
  const center_x = (Math.random() - 0.5) * 1
  const center_y = (Math.random() - 0.5) * 1
  function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  ARC_RECORDS_ARRAY.push(
    new Shapes.Arc({
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
    }),
  )
})

const MACROS_ARRAY: Symbols.Symbol[] = []
new Array<number>(10).fill(0).map((_, i) => {
  MACROS_ARRAY.push(
    new Symbols.MacroSymbol({
      id: "macro" + i, // id
      shapes: [
        // PAD_RECORDS_ARRAY[i],
        // PAD_RECORDS_ARRAY[i + 1],
        // LINE_RECORDS_ARRAY_POS[i],
        // LINE_RECORDS_ARRAY_POS[i + 1],
        // LINE_RECORDS_ARRAY_NEG[i],
        // LINE_RECORDS_ARRAY_NEG[i + 1],
        // ARC_RECORDS_ARRAY[i],
        // ARC_RECORDS_ARRAY[i + 1],
        SURFACE_RECORDS_ARRAY[i],
      ],
    }),
  )
})

const MACRO_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_MACROS).fill(0).map(() => {
  MACRO_RECORDS_ARRAY.push(
    new Shapes.Pad({
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
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 20,
      // 0 = no mirror, 1 = mirror
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const large_square_sym = new Symbols.StandardSymbol({
  id: "round", // id
  symbol: Symbols.STANDARD_SYMBOLS_MAP.Square, // symbol
  width: 0.5, // width, square side, diameter
  height: 0.5, // height
  corner_radius: 0.002, // corner radius
  corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
  outer_dia: 0.01, // — Outer diameter of the shape
  inner_dia: 0.0, // — Inner diameter of the shape
  line_width: 0.001, // — Shapes.Line width of the shape (applies to the whole shape)
  line_length: 0.02, // — Shapes.Line length of the shape (applies to the whole shape)
  angle: 0, // — Angle of the spoke from 0 degrees
  gap: 0.001, // — Gap
  num_spokes: 2, // — Number of spokes
  round: 0, // —r|s == 1|0 — Support for rounded or straight corners
  cut_size: 0, // — Size of the cut ( see corner radius )
  ring_width: 0.001, // — Ring width
  ring_gap: 0.004, // — Ring gap
  num_rings: 2, // — Number of rings
})

const OVERLAPPING_PADS_ARRAY: Shapes.Pad[] = []
new Array<number>(3).fill(0).map((_, i) => {
  OVERLAPPING_PADS_ARRAY.push(
    new Shapes.Pad({
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
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const FLATTEN_MACROS_ARRAY: Symbols.Symbol[] = []

new Array<number>(1).fill(0).map((_, i) => {
  FLATTEN_MACROS_ARRAY.push(
    new Symbols.MacroSymbol({
      id: "macro" + i, // id
      shapes: OVERLAPPING_PADS_ARRAY,
      // flattenening a macro will cause the macro to be drawn as a single shape, rather than as a collection of shapes.
      // negative shapes within the macro will be subtracted from the positive shapes and not have an effect on the rest of the image.
      // negatives will act like holes in the macro, rather than being drawn as negative shapes.
      flatten: true,
    }),
  )
})

const UNFLATTEN_MACROS_ARRAY: Symbols.Symbol[] = []

new Array<number>(1).fill(0).map((_, i) => {
  UNFLATTEN_MACROS_ARRAY.push(
    new Symbols.MacroSymbol({
      id: "macro" + i, // id
      shapes: OVERLAPPING_PADS_ARRAY,
      // flattenening a macro will cause the macro to be drawn as a single shape, rather than as a collection of shapes.
      // negative shapes within the macro will be subtracted from the positive shapes and not have an effect on the rest of the image.
      // negatives will act like holes in the macro, rather than being drawn as negative shapes.
      flatten: false,
    }),
  )
})

const SPOOF_OVERLAPPING_MACROS_ARRAY: Symbols.Symbol[] = []

new Array<number>(1).fill(0).map((_, i) => {
  SPOOF_OVERLAPPING_MACROS_ARRAY.push(
    new Symbols.MacroSymbol({
      id: "macro" + i, // id
      shapes: [OVERLAPPING_PADS_ARRAY[0]],
      // flattenening a macro will cause the macro to be drawn as a single shape, rather than as a collection of shapes.
      // negative shapes within the macro will be subtracted from the positive shapes and not have an effect on the rest of the image.
      // negatives will act like holes in the macro, rather than being drawn as negative shapes.
      flatten: true,
    }),
  )
})

const OVERLAPPING_FLATTEN_MACRO_RECORDS_ARRAY: Shapes.Pad[] = []
new Array<number>(10).fill(0).map((_, i) => {
  OVERLAPPING_FLATTEN_MACRO_RECORDS_ARRAY.push(
    new Shapes.Pad({
      // Center point.
      x: i / 10,
      y: -i / 10,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: FLATTEN_MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: 1,
      polarity: i % 2 == 0 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const OVERLAPPING_UNFLATTEN_MACRO_RECORDS_ARRAY: Shapes.Pad[] = []
new Array<number>(10).fill(0).map((_, i) => {
  OVERLAPPING_UNFLATTEN_MACRO_RECORDS_ARRAY.push(
    new Shapes.Pad({
      // Center point.
      x: i / 10,
      y: -i / 10,
      // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
      // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
      symbol: UNFLATTEN_MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: 1,
      polarity: i % 2 == 0 ? 1 : 0,
      // Shapes.Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const MACRO_IN_MACRO_RECORDS: Shapes.Shape[] = []
new Array<number>(4).fill(0).map((_, i) => {
  MACRO_IN_MACRO_RECORDS.push(
    new Shapes.Pad({
      x: i,
      y: i,
      symbol: new Symbols.MacroSymbol({
        // id: 'macro' + i, // id
        shapes: new Array(5).fill(0).map((_, j) => {
          return new Shapes.Pad({
            // Center point.
            x: j / 10,
            y: -j / 10,
            // symbol: round_sym,
            symbol: new Symbols.MacroSymbol({
              // id: 'macro' + i, // id
              shapes: new Array(6).fill(0).map((_, k) => {
                return new Shapes.Pad({
                  // Center point.
                  x: k / 100,
                  y: k / 100,
                  symbol: round_sym,
                  resize_factor: 1,
                  polarity: 1,
                  rotation: 0,
                  mirror_x: 0,
                  mirror_y: 0,
                })
              }),
              flatten: true,
            }),
            resize_factor: 1,
            polarity: 1,
            rotation: 0,
            mirror_x: 0,
            mirror_y: 0,
          })
        }),
        flatten: true,
      }),
      resize_factor: 1,
      polarity: 1,
      rotation: 0,
      mirror_x: 0,
      mirror_y: 0,
    }),
  )
})

const POLYLINE_RECORDS_ARRAY: Shapes.PolyLine[] = []
new Array<number>(1).fill(0).map((_, _i) => {
  POLYLINE_RECORDS_ARRAY.push(
    new Shapes.PolyLine({
      // Start point.
      // xs: (Math.random() - 0.5) * 1,
      // ys: (Math.random() - 0.5) * 1,
      xs: 0,
      ys: 0,

      cornertype: "miter",

      pathtype: "square",
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
      },
    ]),
  )
})

const DUPLICATE_POLYLINE_RECORDS_ARRAY: Shapes.StepAndRepeat[] = []
new Array<number>(1).fill(0).map((_, _i) => {
  DUPLICATE_POLYLINE_RECORDS_ARRAY.push(
    new Shapes.StepAndRepeat({
      shapes: POLYLINE_RECORDS_ARRAY,
      repeats: [
        {
          datum: [0, 0],
          mirror_x: 0,
          mirror_y: 0,
          rotation: 0,
          scale: 1,
        },
        {
          datum: [1, 0],
          mirror_x: 1,
          mirror_y: 0,
          rotation: 0,
          scale: 1,
        },
        // {
        //   datum: [0, 0],
        //   mirror: 0,
        //   rotation: 0,
        //   scale: 2,
        // }
      ],
    }),
  )
})

const DATUMS: Shapes.Shape[] = []
DATUMS.push(
  new Shapes.DatumLine({
    xs: 0,
    ys: 0,
    xe: 1,
    ye: 0,
  }),
)

DATUMS.push(
  new Shapes.DatumPoint({
    x: 0,
    y: 1,
  }),
)

DATUMS.push(
  new Shapes.DatumText({
    text: "Hello World",
    x: 1,
    y: 1,
  }),
)

// const VALIDATION_ARC = new Shapes.Arc({
//   // Cnter point.
//   xc: 0,
//   yc: 1,

//   // Start point.
//   xs: -1,
//   ys: 0,

//   // End point.
//   xe: 1,
//   ye: 0,

//   // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
//   // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
//   symbol: round_sym,
//   // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//   // Polarity. 0 = negative, 1 = positive
//   polarity: 1,
//   // polarity: Math.random() > 0.5 ? 1 : 0,
//   clockwise: 1,
//   // clockwise: 0,
// })

// const VALIDATION_LINE = new Shapes.Line({
//   // Start point.
//   xs: -1,
//   ys: 0,

//   // End point.
//   xe: 1,
//   ye: 0,

//   // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
//   // sym_num: i % 2 == 0 ? Symbols.STANDARD_SYMBOLS_MAP.Square : Symbols.STANDARD_SYMBOLS_MAP.Round,
//   symbol: round_sym,
//   // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
//   // Polarity. 0 = negative, 1 = positive
//   // polarity: i % 2,
//   // polarity: Math.random() > 0.5 ? 1 : 0,
//   polarity: 1,
// })

function REGLApp(): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(document.createElement("div"))
  const [engine, setEngine] = React.useState<RenderEngine>()
  const [_outlineMode, setOutlineMode] = React.useState<boolean>(false)
  const [_skeletonMode, setSkeletonMode] = React.useState<boolean>(false)
  const [layers, setLayers] = React.useState<Omit<LayerRendererProps, "transform" | "regl" | "image" | "ctx">[]>([])

  React.useEffect(() => {
    const Engine = new RenderEngine({
      container: containerRef.current,
      attributes: {
        antialias: false,
      },
    })

    Engine.settings.OUTLINE_MODE = false
    Engine.settings.SHOW_DATUMS = true
    // Engine.settings.FPS = 30
    // Engine.SETTINGS.BACKGROUND_COLOR = [1, 1, 1, 1]

    // Engine.addLayer({
    //   name: 'origin',
    //   color: [1, 1, 1],
    //   transform: {
    //     datum: [0, 0],
    //     scale: 1,
    //     rotation: 0,
    //   },
    //   image: [
    //     new Shapes.Pad({
    //       // Center point.
    //       x: 0,
    //       y: 0,
    //       // The index, in the feature symbol names section, of the symbol to be used to draw the Shapes.Pad.
    //       // sym_num: Symbols.STANDARD_SYMBOLS_MAP.Round,
    //       symbol: round_sym,
    //       // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
    //       // resize_factor: Math.random() + 1,
    //       resize_factor: 1,
    //       // Polarity. 0 = negative, 1 = positive
    //       polarity: 1,
    //       // Shapes.Pad orientation (degrees)
    //       // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always clockwise as viewed from the board TOP (primary side).
    //       rotation: 0,
    //       // 0 = no mirror, 1 = mirror
    //       mirror_x: 0,
    //       mirror_y: 0
    //     })
    //   ]
    // })

    // Engine.addLayer({
    //   name: "pads",
    //   // transform: {
    //   //   datum: [0.5, 0],
    //   //   scale: 1,
    //   //   rotation: 0,
    //   //   mirror: 1,
    //   // },
    //   image: SQUARE_GRID,
    //   units: "mm",
    // })

    // Engine.addLayer({
    //   name: '+/- lines',
    //   transform: {
    //     // datum: [0.5, 0],
    //     // scale: 1,
    //     // rotation: 0,
    //     // mirror: true,
    //   },
    //   image: [...LINE_RECORDS_ARRAY_POS, ...LINE_RECORDS_ARRAY_NEG]
    // })

    // Engine.addLayer({
    //   name: '-/+ lines',
    //   transform: {
    //     // datum: [0.5, 0],
    //     // scale: 1,
    //     // rotation: 0,
    //     // mirror: true,
    //   },
    //   image: [...LINE_RECORDS_ARRAY_NEG, ...LINE_RECORDS_ARRAY_POS]
    // })

    // const layer2 = Engine.addLayer({
    //   name: 'layer2',
    //   image: ARC_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'layer3',
    //   image: MACRO_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'overlapping flatten macro',
    //   image: OVERLAPPING_FLATTEN_MACRO_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'overlapping unflatten macro',
    //   image: OVERLAPPING_UNFLATTEN_MACRO_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'macro in macro',
    //   image: MACRO_IN_MACRO_RECORDS
    // })
    // const polylineLayer = Engine.addLayer({
    //   name: 'polyline',
    //   image: POLYLINE_RECORDS_ARRAY
    // })

    // Engine.addLayer({
    //   name: 'duplicate-polyline',
    //   image: DUPLICATE_POLYLINE_RECORDS_ARRAY
    // })

    // })

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

    // Engine.addLayer({
    //   name: 'surface-arc-combo',
    //   image: [...SURFACE_RECORDS_ARRAY, ...ARC_RECORDS_ARRAY]
    // })

    // Engine.addLayer({
    //   name: "datums",
    //   image: DATUMS,
    //   units: "mm",
    // })

    // Engine.addLayer({
    //   name: 'validation',
    //   image: [VALIDATION_ARC, VALIDATION_LINE]
    // })

    // Engine.addLayer({
    //   name: 'polygon',
    //   image: polygons
    // })

    // Engine.addFile({
    //   buffer: cmp,
    //   format: "rs274x",
    //   props: {
    //     name: "cmp",
    //   },
    // })
    // Engine.addFile({
    //   buffer: drd,
    //   format: "nc",
    //   props: {
    //     name: "drd",
    //   },
    // })
    // Engine.addFile({
    //   buffer: gko,
    //   format: "rs274x",
    //   props: {
    //     name: "gko",
    //   },
    // })
    // Engine.addFile({
    //   buffer: plc,
    //   format: "rs274x",
    //   props: {
    //     name: "plc",
    //     visible: true,
    //   },
    // })
    // Engine.addFile({
    //   buffer: pls,
    //   format: "rs274x",
    //   props: {
    //     name: "pls",
    //   },
    // })
    // Engine.addFile({
    //   buffer: stc,
    //   format: "rs274x",
    //   props: {
    //     name: "stc",
    //   },
    // })
    // Engine.addFile({
    //   buffer: sts,
    //   format: "rs274x",
    //   props: {
    //     name: "sts",
    //   },
    // })
    // Engine.addFile({
    //   buffer: sol,
    //   format: "rs274x",
    //   props: {
    //     name: "sol",
    //   },
    // })

    // Engine.addLayer({
    //   name:'Step and Repeat',
    //   image: STEP_AND_REPEAT,
    //   visible: false
    // })

    // Engine.addLayer({
    //   name: 'Step and Repeat 2',
    //   image: MAMA_STEP_AND_REPEAT,
    //   visible: false
    // })

    // Engine.addFile({
    //   file: nested_aperture_macro,
    //   format: 'rs274x',
    //   props: {
    //     name: 'nested_aperture_macro',
    //     units: 'inch'
    //   }
    // })

    // Engine.addFile({
    //   file: multi_polarity_over_self,
    //   format: 'rs274x',
    //   props: {
    //     name: 'multi_polarity_over_self',
    //     units: 'inch'
    //   }
    // })

    // Engine.addFile({
    //   file: gtl_in,
    //   format: 'rs274x',
    //   props: {
    //     name: 'gtl_in',
    //   }
    // })

    Engine.addLayer({
      name: "surfaces",
      visible: true,
      image: SURFACE_RECORDS_ARRAY,
      units: "mm",
    })

    // Engine.addFile({
    //   file: gtl_mm,
    //   format: 'rs274x',
    //   props: {
    //     name: 'gtl_mm',
    //   }
    // })

    // Engine.addLayer({
    //   name: "surface test",
    //   image: SURFACE_ARC_TEST,
    //   units: "mm",
    // })

    // Engine.addFile({
    //   buffer: gdsiiFile,
    //   format: 'gdsii',
    //   props: {
    //     name: 'gdsii',
    //   },
    //   // units: 'mm'
    // })

    // find all shapes in engine and loop through the shapes
    // Engine.backend.then(backend => backend.getLayers().then(layers => {

    //   for (const layer of layers) {
    //     console.log(layer)
    //     // backend.setLayerProps(layer.id, { visible: false })
    //     layer.
    //   }
    // }))

    // find all shapes in engine and loop through the shapes
    // Engine.backend.then(backend => backend.layers.then(layers => {
    //   for (const layer of layers) {
    //     // backend.setLayerProps(layer.id, { visible: false })
    //     console.log(layer)
    //   }
    // }))

    // Engine.backend.then(backend => backend.transform.then(transform => {
    //   console.log(transform)
    //   transform.position[0] = 3
    //   // transform.position[1] = 3
    //   transform.update()
    // }))

    Engine.addLayer({
      name: "Lines",
      visible: false,
      units: "mm",
      image: [
        new Shapes.Line({
          xs: 0,
          ys: 0,
          xe: 1,
          ye: 0,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          // symbol: new Symbols.SquareSymbol({
          //   width: 0.1,
          //   height: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.NullSymbol({}),
          polarity: 1,
        }),
        new Shapes.Line({
          xs: 1,
          ys: 0,
          xe: 1,
          ye: 1,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.SquareSymbol({
            width: 0.1,
            height: 0.1,
            inner_dia: 0,
          }),
          polarity: 1,
        }),
        new Shapes.Line({
          xs: 1,
          ys: 1,
          xe: 0,
          ye: 1,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.SquareSymbol({
            width: 0.1,
            height: 0.1,
            inner_dia: 0,
          }),
          polarity: 1,
        }),
        new Shapes.Line({
          xs: 0,
          ys: 1,
          xe: 0,
          ye: 0,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.SquareSymbol({
            width: 0.1,
            height: 0.1,
            inner_dia: 0,
          }),
          polarity: 1,
        }),
        new Shapes.Line({
          xs: 0,
          ys: 0,
          xe: 1,
          ye: 1,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.SquareSymbol({
            width: 0.1,
            height: 0.1,
            inner_dia: 0,
          }),
          polarity: 1,
        }),
        new Shapes.Line({
          xs: 0,
          ys: 1,
          xe: 1,
          ye: 0,
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 0.1,
          //   inner_dia: 0,
          // }),
          symbol: new Symbols.SquareSymbol({
            width: 0.1,
            height: 0.1,
            inner_dia: 0,
          }),
          polarity: 1,
        }),
      ],
    })

    Engine.addLayer({
      name: "Arcs",
      visible: false,
      units: "mm",
      image: [
        new Shapes.Arc({
          xs: 0,
          ys: 0,
          xe: 1,
          ye: 0,
          xc: 0.5,
          yc: 0,
          clockwise: 1,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 1,
          ys: 0,
          xe: 1,
          ye: 1,
          xc: 1,
          yc: 0.5,
          clockwise: 1,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 0,
          ys: 0,
          xe: 1,
          ye: 0,
          xc: 0.5,
          yc: 0,
          clockwise: 0,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 1,
          ys: 0,
          xe: 1,
          ye: 1,
          xc: 1,
          yc: 0.5,
          clockwise: 0,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 0,
          ys: 0,
          xe: 0.5,
          ye: 0.5,
          xc: 0.5,
          yc: 0,
          clockwise: 0,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 0.5,
          ys: 0.5,
          xe: 1,
          ye: 0,
          xc: 0.5,
          yc: 0,
          clockwise: 0,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 1,
          ys: 0,
          xe: 0.5,
          ye: 0.5,
          xc: 0.5,
          yc: 0,
          clockwise: 0,
          symbol: round_sym,
          polarity: 1,
        }),
        new Shapes.Arc({
          xs: 1,
          ys: 1,
          xe: 1,
          ye: 1,
          xc: 0.5,
          yc: 0.5,
          clockwise: 1,
          symbol: round_sym,
          polarity: 1,
        }),
      ],
    })

    Engine.addLayer({
      name: "circle",
      visible: false,
      image: [
        new Shapes.Pad({
          x: 0,
          y: 0,
          rotation: 0,
          resize_factor: 1.0,
          mirror_x: 0,
          mirror_y: 0,
          // symbol: new Symbols.NullSymbol({}),
          // symbol: new Symbols.RoundSymbol({
          //   outer_dia: 1,
          //   inner_dia: 0.5,
          // }),
          // symbol: new Symbols.RectangleSymbol({
          //   width: 2,
          //   height: 1,
          //   inner_dia: 0.5,
          // }),
          // symbol: new Symbols.RoundedRectangleSymbol({
          //   width: 2,
          //   height: 1,
          //   corner_radius: 0.2,
          //   inner_dia: 0.5,
          //   corners: 1,
          // }),
          // symbol: new Symbols.OvalSymbol({
          //   width: 2,
          //   height: 1,
          //   inner_dia: 0.5,
          // }),
          // symbol: new Symbols.ChamferedRectangleSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   corner_radius: 0.2,
          //   corners: 1,
          //   inner_dia: 0,
          // }),
          // symbol: new Symbols.DiamondSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   inner_dia: 0.5,
          // }),
          // symbol: new Symbols.OctagonSymbol({
          //   width: 2.0,
          //   height: 2.0,
          //   corner_radius: 0.5,
          //   inner_dia: 0.5,
          // }),
          // symbol: new Symbols.RoundDonutSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.0,
          // }),
          // symbol: new Symbols.SquareDonutSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 0.8,
          // }),
          // symbol: new Symbols.RoundedSquareDonutSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.8,
          //   corner_radius: 0.2,
          //   corners: 1,
          // }),
          // symbol: new Symbols.RectangleDonutSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   line_width: 0.1,
          // }),
          // symbol: new Symbols.RoundedRectangleDonutSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   corner_radius: 0.2,
          //   corners: 1,
          //   line_width: 0.1,
          //   inner_dia: 0.0,
          // }),
          // symbol: new Symbols.OvalDonutSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   line_width: 0.1,
          // }),
          // symbol: new Symbols.HorizontalHexagonSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   corner_radius: 0.2,
          // }),
          // symbol: new Symbols.VerticalHexagonSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   corner_radius: 0.2,
          // }),
          // symbol: new Symbols.ButterflySymbol({
          //   outer_dia: 2.0,
          // }),
          // symbol: new Symbols.SquareButterflySymbol({
          //   width: 2.0,
          // }),
          // symbol: new Symbols.TriangleSymbol({
          //   width: 2.0,
          //   height: 1.0,
          // }),
          // symbol: new Symbols.HalfOvalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          // }),

          // symbol: new Symbols.CircleThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.8,
          //   gap: 0.2,
          //   angle: 10,
          //   num_spokes: 4,
          //   round: 1,
          // }),

          // symbol: new Symbols.RectangleThermalSymbol({
          //   width: 1.8,
          //   height: 1.8,
          //   line_width: 0.1,
          //   gap: 0.2,
          //   angle: 45,
          //   num_spokes: 4,
          //   corners: 0,
          //   corner_radius: 0,
          //   round: 1,
          // }),

          // symbol: new Symbols.RectangleThermalOpenCornersSymbol({
          //   width: 2.8,
          //   height: 1.8,
          //   line_width: 0.1,
          //   gap: 0.2,
          //   angle: 20,
          //   num_spokes: 4,
          // }),

          // symbol: new Symbols.SquareCircleThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.8,
          //   gap: 0.2,
          //   angle: 10,
          //   num_spokes: 4,
          // }),

          // symbol: new Symbols.ConstrainedRectangleThermalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   gap: 0.2,
          //   angle: 45,
          //   num_spokes: 2,
          //   line_width: 0.1,
          //   corners: 0,
          //   corner_radius: 0,
          //   round: 1,
          // }),

          // symbol: new Symbols.SquareThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.0,
          //   gap: 0.4,
          //   angle: 0,
          //   num_spokes: 5,
          // }),
          // symbol: new Symbols.OpenCornersSquareThermalSymbol({
          //   outer_dia: 2.0,
          //   gap: 0.4,
          //   angle: 45,
          //   num_spokes: 4,
          //   line_width: 0.5,
          // }),
          // symbol: new Symbols.LineThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.0,
          //   gap: 0.1,
          //   angle: 45,
          //   num_spokes: 4,
          // }),
          // symbol: new Symbols.SquareRoundThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.0,
          //   gap: 0.4,
          //   angle: 10,
          //   num_spokes: 1,
          // }),
          // symbol: new Symbols.RectangularThermalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   gap: 0.2,
          //   angle: 45,
          //   num_spokes: 4,
          //   line_width: 0.1,
          //   round: 1,
          // }),
          // symbol: new Symbols.RectangularThermalOpenCornersSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   gap: 0.3,
          //   angle: 45,
          //   line_width: 0.1,
          //   num_spokes: 4,
          // }),
          // symbol: new Symbols.RoundedSquareThermalSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.5,
          //   corner_radius: 0.4,
          //   corners: 15,
          //   gap: 0.4,
          //   angle: 29,
          //   num_spokes: 0,
          //   round: 1,
          // }),
          // symbol: new Symbols.RoundedSquareThermalOpenCornersSymbol({
          //   outer_dia: 2.0,
          //   inner_dia: 1.9,
          //   corner_radius: 0.2,
          //   corners: 1,
          //   gap: 0.4,
          //   angle: 45,
          //   num_spokes: 4,
          //   // line_width: 0.1,
          // }),
          // symbol: new Symbols.RoundedRectangularThermalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   corner_radius: 0.2,
          //   corners: 1,
          //   angle: 45,
          //   num_spokes: 5,
          //   line_width: 0.1,
          //   gap: 0.1,
          //   round: 0,
          // }),
          // symbol: new Symbols.OvalThermalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   gap: 0.1,
          //   angle: 0,
          //   num_spokes: 4,
          //   line_width: 0.1,
          //   round: 1,
          // }),
          // symbol: new Symbols.OblongThermalSymbol({
          //   width: 2.0,
          //   height: 1.0,
          //   gap: 0.1,
          //   angle: 90,
          //   num_spokes: 2,
          //   line_width: 0.1,
          //   round: 0,
          // }),

          symbol: new Symbols.MoireGerberSymbol({
            outer_dia: 2.0,
            ring_width: 0.1,
            ring_gap: 0.1,
            num_rings: 2,
            line_width: 0.1,
            line_length: 2.1,
            angle: 0,
          }),

          // symbol: new Symbols.MoireODBSymbol({
          //   ring_width: 0.1,
          //   ring_gap: 0.1,
          //   num_rings: 3,
          //   line_width: 0.1,
          //   line_length: 2.0,
          //   angle: 20,
          // }),
        }),
      ],
      units: "mm",
    })

    Engine.render({
      force: true,
    })

    // Engine.pointer.addEventListener('pointerdown', console.log)

    setEngine(Engine)
    // Engine.SUPERTEST()

    return (): void => {
      // Engine.pointer.removeEventListener('pointerdown', console.log)
      Engine.destroy()
    }
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        id="container-element"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      {engine ? (
        <Box
          style={{
            width: "100px",
          }}
        >
          {/* <StatsWidget /> */}
          <REGLStatsWidget engine={engine} />
          <MouseCoordinates engine={engine} key="coordinates" />
          <Button
            onClick={async (): Promise<void> => {
              const backend = await engine.backend
              backend.getLayers().then((layers) => {
                setLayers(layers)
                layers.map((l) => backend.setLayerProps(l.id, { color: [Math.random(), Math.random(), Math.random()] }))
              })
            }}
          >
            Randomize Colors
          </Button>
          <Button
            onClick={async (): Promise<void> => {
              engine.zoomFit()
            }}
          >
            Zoom Fit
          </Button>
          <Button onClick={async (): Promise<void> => engine.backend.then((engine) => engine.setTransform({ position: [0, 0], zoom: 16 }))}>
            (0,0)
          </Button>
          <br />
          Outline Mode
          <Switch
            defaultChecked={engine.settings.OUTLINE_MODE}
            onChange={(e): void => {
              engine.settings.OUTLINE_MODE = e.target.checked
              setOutlineMode(e.target.checked)
              engine.backend.then((backend) =>
                backend.getLayers().then((layers) => {
                  setLayers(layers)
                }),
              )
            }}
          />
          Skeleton Mode
          <Switch
            defaultChecked={engine.settings.SKELETON_MODE}
            onChange={(e): void => {
              engine.settings.SKELETON_MODE = e.target.checked
              setSkeletonMode(e.target.checked)
              engine.backend.then((backend) =>
                backend.getLayers().then((layers) => {
                  setLayers(layers)
                }),
              )
            }}
          />
          {/* Grid Toggle
          <Switch
            defaultChecked={engine.settings.OUTLINE_MODE}
            onChange={(e): void => {
              engine.backend.then(backend => backend.setGridProps({ enabled: e.target.checked }))
            }} />
          Grid Type
          <Switch
            defaultChecked={engine.settings.OUTLINE_MODE}
            onChange={(e): void => {
              engine.backend.then(backend => backend.setGridProps({ type: e.target.checked ? 'dots' : 'lines' }))
            }} /> */}
          <br />
          Zoom To Cursor
          <Switch
            defaultChecked={engine.settings.ZOOM_TO_CURSOR}
            onChange={(e): void => {
              engine.settings.ZOOM_TO_CURSOR = e.target.checked
            }}
          />
          Mouse Mode
          <SegmentedControl
            data={["move", "select", "measure"] as const}
            onChange={(mode) => (engine.pointerSettings.mode = mode as "select" | "move" | "measure")}
          />
          {layers.map((layer, i) => {
            return (
              <div key={i}>
                {layer.name}
                <Switch
                  defaultChecked={layer.visible}
                  onChange={async (e): Promise<void> => {
                    const backend = await engine.backend
                    backend.setLayerProps(layer.id || layer.name, { visible: e.target.checked })
                  }}
                />
              </div>
            )
          })}
        </Box>
      ) : null}
    </>
  )
}

function StatsWidget(): JSX.Element {
  const [fps, setFPS] = React.useState<number>(0)
  const [avgFPS, setAvgFPS] = React.useState<number>(0)
  const [memory, setMemory] = React.useState<number>(0)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoryUsed = (window.performance as any).memory.usedJSHeapSize / 1048576
    setMemory(Math.round(memoryUsed))
    requestAnimationFrame(updateFPS)
  }

  React.useEffect(() => {
    requestAnimationFrame(updateFPS)
  }, [])

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        padding: 10,
        background: "rgba(0,0,0,0.5)",
        color: "white",
        fontFamily: "monospace",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 100,
        userSelect: "none",
      }}
    >
      <div>FPS: {fps}</div>
      <div>Avg FPS: {avgFPS}</div>
      <div>Memory: {memory} MB</div>
    </div>
  )
}

function REGLStatsWidget(props: { engine: RenderEngine }): JSX.Element {
  const [count, setCount] = React.useState<number>(0)
  const [cpuTime, setCPUTime] = React.useState<number>(0)
  const [gpuTime, setGPUTime] = React.useState<number>(0)
  const [averageGPUTime, setAverageGPUTime] = React.useState<number>(0)
  const [averageCPUTime, setAverageCPUTime] = React.useState<number>(0)
  const [fps, setFPS] = React.useState<number>(0)
  const [gpuFPS, setGPUFPS] = React.useState<number>(0)
  const [textureSize, setTextureSize] = React.useState<number>(0)
  const [bufferSize, setBufferSize] = React.useState<number>(0)
  const [renderBufferSize, setRenderBufferSize] = React.useState<number>(0)
  const [bufferCount, setBufferCount] = React.useState<number>(0)
  const [textureCount, setTextureCount] = React.useState<number>(0)
  const [shaderCount, setShaderCount] = React.useState<number>(0)
  const [framebufferCount, setFramebufferCount] = React.useState<number>(0)
  const [elementsCount, setElementsCount] = React.useState<number>(0)

  const round = (value: number, precision: number): number => {
    const multiplier = Math.pow(10, precision || 0)
    return Math.round(value * multiplier) / multiplier
  }

  const update = async (): Promise<void> => {
    const precision = 3
    const stats = await props.engine.getStats()
    // console.log(stats)
    const averageGPU = stats.world.gpuTime / stats.world.count
    setAverageGPUTime(round(averageGPU, precision))
    const averageCPU = stats.world.cpuTime / stats.world.count
    setAverageCPUTime(round(averageCPU, precision))
    setCount(stats.world.count)
    setCPUTime(round(stats.world.cpuTime, precision))
    setGPUTime(round(stats.world.gpuTime, precision))
    setFPS(Math.round(1000 / ((stats.world.cpuTime + stats.world.gpuTime) / stats.world.count)))
    setGPUFPS(Math.round(1000 / (stats.world.gpuTime / stats.world.count)))
    setTextureSize(Math.round(stats.regl.totalTextureSize / 1024 / 1024))
    setBufferSize(Math.round(stats.regl.totalBufferSize / 1024 / 1024))
    setRenderBufferSize(Math.round(stats.regl.totalRenderbufferSize / 1024 / 1024))
    setBufferCount(stats.regl.bufferCount)
    setTextureCount(stats.regl.textureCount)
    setShaderCount(stats.regl.shaderCount)
    setFramebufferCount(stats.regl.framebufferCount)
    setElementsCount(stats.regl.elementsCount)
    requestAnimationFrame(update)
  }

  React.useEffect(() => {
    requestAnimationFrame(update)
  }, [])

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        padding: 10,
        background: "rgba(0,0,0,0.5)",
        color: "white",
        fontFamily: "monospace",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 100,
        userSelect: "none",
        minWidth: 250,
      }}
    >
      <div>Frame Count: {count}</div>
      <div>Total CPU Time: {cpuTime}ms</div>
      <div>Total GPU Time: {gpuTime}ms</div>
      <div>Avg CPU Time: {averageCPUTime}ms</div>
      <div>Avg GPU Time: {averageGPUTime}ms</div>
      <div>Theoretical FPS: {fps}</div>
      <div>GPU FPS: {gpuFPS}</div>
      <div>Texture Size: {textureSize}MB</div>
      <div>Buffer Size: {bufferSize}MB</div>
      <div>Render Buffer Size: {renderBufferSize}MB</div>
      <div>Buffer Count: {bufferCount}</div>
      <div>Texture Count: {textureCount}</div>
      <div>Shader Count: {shaderCount}</div>
      <div>Framebuffer Count: {framebufferCount}</div>
      <div>Elements Count: {elementsCount}</div>
    </div>
  )
}

function MouseCoordinates(props: { engine: RenderEngine }): JSX.Element {
  const [mouse, setMouse] = React.useState({ x: "0", y: "0" })

  useMemo(() => {
    props.engine.pointer.addEventListener(PointerEvents.POINTER_HOVER, (e) => {
      setMouse({ x: (e as PointerEvent).detail.x.toFixed(3), y: (e as PointerEvent).detail.y.toFixed(3) })
    })
  }, [props.engine])

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        padding: 10,
        background: "rgba(0,0,0,0.5)",
        color: "white",
        fontFamily: "monospace",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 100,
        userSelect: "none",
      }}
    >
      <div>
        Mouse: {mouse.x}mm, {mouse.y}mm
      </div>
    </div>
  )
}

export default REGLApp
