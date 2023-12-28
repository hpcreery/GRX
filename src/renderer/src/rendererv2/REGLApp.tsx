import React from 'react'
import '../App.css'
import {
  MacroSymbol,
  STANDARD_SYMBOLS,
  STANDARD_SYMBOLS_MAP,
  StandardSymbol
} from './symbols'
import * as Symbols from './symbols'
import {
  Pad,
  Line,
  Arc,
  Surface,
  Contour,
  Contour_Arc_Segment,
  Contour_Line_Segment,
} from './shapes'
import * as Shapes from './shapes'
import { RenderEngine } from './engine'
import { Button, Switch, Badge } from '@mantine/core'
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
    SURFACE_RECORDS_ARRAY.push(new Surface({
      polarity: 1,
    }).addContours([
      new Contour({
        poly_type: 1,
        // Start point.
        xs: 0 + i * 0.1,
        ys: 0 + i * 0.1,
      })
        .addSegments([
          // new Contour_Line_Segment_Record({
          //   x: 0.2 + i,
          //   y: -0.2 + i,
          // }),
          new Contour_Arc_Segment({
            x: 0.02 + i * 0.1,
            y: -0.02 + i * 0.1,
            xc: 0.015 + i * 0.1,
            yc: -0.005 + i * 0.1,
            // computer the center coordinates of the arc with a radius of 0.1
            clockwise: 0,
          }),
          new Contour_Line_Segment({
            x: 0.05 + i * 0.1,
            y: -0.02 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: 0.05 + i * 0.1,
            y: 0.05 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: -0.05 + i * 0.1,
            y: 0.05 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: -0.05 + i * 0.1,
            y: -0.05 + i * 0.1,
          }),
          // new Contour_Arc_Segment_Record({
          //   x: -0.5 + i,
          //   y: -0.5 + i,
          //   xc: -0.5 + i,
          //   yc: 0 + i,
          //   // computer the center coordinates of the arc with a radius of 0.1
          //   clockwise: 0,
          // }),
          new Contour_Line_Segment({
            x: 0 + i * 0.1,
            y: 0 + i * 0.1,
          }),
        ]),
      new Contour({
        poly_type: 0,
        // Start point.
        xs: 0.04 + i * 0.1,
        ys: 0.04 + i * 0.1,
      })
        .addSegments([
          new Contour_Line_Segment({
            x: 0.04 + i * 0.1,
            y: 0.03 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: 0.03 + i * 0.1,
            y: 0.03 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: 0.03 + i * 0.1,
            y: 0.04 + i * 0.1,
          }),
          new Contour_Line_Segment({
            x: 0.04 + i * 0.1,
            y: 0.04 + i * 0.1,
          }),
        ])
    ]))
  })


const SYMBOLS: StandardSymbol[] = []

new Array<number>(STANDARD_SYMBOLS.length)
  .fill(0)
  .map((_, i) => {
    const sym_ptr =
      new StandardSymbol({
        id: 'symbol' + i, // id
        symbol: i, // symbol
        width: 0.01, // width, square side, diameter
        height: 0.01, // height
        corner_radius: 0.002, // corner radius
        corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
        outer_dia: 0.01, // — Outer diameter of the shape
        inner_dia: 0.008, // — Inner diameter of the shape
        line_width: 0.001, // — Line width of the shape (applies to the whole shape)
        line_length: 0.02, // — Line length of the shape (applies to the whole shape)
        angle: 0, // — Angle of the spoke from 0 degrees
        gap: 0.001, // — Gap
        num_spokes: 2, // — Number of spokes
        round: 0, // —r|s == 1|0 — Support for rounded or straight corners
        cut_size: 0, // — Size of the cut ( see corner radius )
        ring_width: 0.001, // — Ring width
        ring_gap: 0.004, // — Ring gap
        num_rings: 2 // — Number of rings
      })

    SYMBOLS.push(sym_ptr)
  })

const round_sym_ptr =
  new StandardSymbol({
    id: 'round', // id
    symbol: STANDARD_SYMBOLS_MAP.Round, // symbol
    width: 0.01, // width, square side, diameter
    height: 0.01, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(round_sym_ptr)

const square_sym_ptr =
  new StandardSymbol({
    id: 'round', // id
    symbol: STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.01, // width, square side, diameter
    height: 0.01, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(square_sym_ptr)


const square2_sym_ptr =
  new StandardSymbol({
    id: 'round', // id
    symbol: STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.04, // width, square side, diameter
    height: 0.04, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })

SYMBOLS.push(square2_sym_ptr)


const PAD_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_PADS)
  .fill(0).map((_, i) => {
    PAD_RECORDS_ARRAY.push(new Pad({
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: i % Object.keys(STANDARD_SYMBOLS).length,
      symbol: SYMBOLS[i % SYMBOLS.length],
      // sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      resize_factor: Math.random() + 1,
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
      // Pad orientation (degrees)
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
    LINE_RECORDS_ARRAY_NEG.push(new Line({

      // Start point.
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
      symbol: i % 2 == 0 ? square_sym_ptr : round_sym_ptr,
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
    LINE_RECORDS_ARRAY_POS.push(new Line({
      // Start point.
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
      symbol: i % 2 == 0 ? square_sym_ptr : round_sym_ptr,
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
    ARC_RECORDS_ARRAY.push(new Arc({
      // Center point.
      xc: center_x,
      yc: center_y,

      // Start point.
      xs: center_x + Math.cos(degreesToRadians(start_angle)) * radius,
      ys: center_y + Math.sin(degreesToRadians(start_angle)) * radius,

      // End point.
      xe: center_x + Math.cos(degreesToRadians(end_angle)) * radius,
      ye: center_y + Math.sin(degreesToRadians(end_angle)) * radius,

      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: STANDARD_SYMBOLS_MAP.Round,
      symbol: round_sym_ptr,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      clockwise: Math.random() > 0.5 ? 1 : 0,
      // clockwise: 0,
    }))
  })

const MACROS_ARRAY: Symbols.Symbol[] = []
new Array<number>(1)
  .fill(0).map((_, i) => {
    MACROS_ARRAY.push(new MacroSymbol({
      id: 'macro' + i, // id
      shapes: [
        PAD_RECORDS_ARRAY[i],
        PAD_RECORDS_ARRAY[i + 1],
        LINE_RECORDS_ARRAY_POS[i],
        LINE_RECORDS_ARRAY_POS[i + 1],
        LINE_RECORDS_ARRAY_NEG[i],
        LINE_RECORDS_ARRAY_NEG[i + 1],
        ARC_RECORDS_ARRAY[i],
        ARC_RECORDS_ARRAY[i + 1],
        SURFACE_RECORDS_ARRAY[i]
      ]
    }))
  })

const MACRO_RECORDS_ARRAY: Shapes.Shape[] = []
new Array<number>(N_MACROS)
  .fill(0).map((_, i) => {
    MACRO_RECORDS_ARRAY.push(new Pad({
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: STANDARD_SYMBOLS_MAP.Round,
      symbol: MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      polarity: Math.random() > 0.5 ? 1 : 0,
      // Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
  })

const large_square_sym_ptr =
  new StandardSymbol({
    id: 'round', // id
    symbol: STANDARD_SYMBOLS_MAP.Square, // symbol
    width: 0.5, // width, square side, diameter
    height: 0.5, // height
    corner_radius: 0.002, // corner radius
    corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
    outer_dia: 0.01, // — Outer diameter of the shape
    inner_dia: 0.008, // — Inner diameter of the shape
    line_width: 0.001, // — Line width of the shape (applies to the whole shape)
    line_length: 0.02, // — Line length of the shape (applies to the whole shape)
    angle: 0, // — Angle of the spoke from 0 degrees
    gap: 0.001, // — Gap
    num_spokes: 2, // — Number of spokes
    round: 0, // —r|s == 1|0 — Support for rounded or straight corners
    cut_size: 0, // — Size of the cut ( see corner radius )
    ring_width: 0.001, // — Ring width
    ring_gap: 0.004, // — Ring gap
    num_rings: 2 // — Number of rings
  })


const OVERLAPPING_PADS_ARRAY: Pad[] = []
new Array<number>(3)
  .fill(0).map((_, i) => {
    OVERLAPPING_PADS_ARRAY.push(new Pad({
      // Center point.
      x: i / 8,
      y: i / 9,
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: STANDARD_SYMBOLS_MAP.Round,
      symbol: large_square_sym_ptr,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      // Pad orientation (degrees)
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
    OVERLAPPING_MACROS_ARRAY.push(new MacroSymbol({
      id: 'macro' + i, // id
      shapes: OVERLAPPING_PADS_ARRAY
    }))
  })

const OVERLAPPING_MACRO_RECORDS_ARRAY: Shapes.Pad[] = []
new Array<number>(10)
  .fill(0).map((_, i) => {
    OVERLAPPING_MACRO_RECORDS_ARRAY.push(new Pad({
      // Center point.
      x: i / 10,
      y: -i / 10,
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // sym_num: STANDARD_SYMBOLS_MAP.Round,
      symbol: OVERLAPPING_MACROS_ARRAY[0],
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // resize_factor: Math.random() + 1,
      resize_factor: 1,
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      // Pad orientation (degrees)
      // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
      // rotation: Math.random() * 360,
      rotation: 0,
      // 0 = no mirror, 1 = mirror
      mirror: 0
    }))
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

    // DictionaryStandard
    // DictionaryUser
    // DictionaryFont

    Engine.settings.OUTLINE_MODE = false
    // Engine.SETTINGS.BACKGROUND_COLOR = [1, 1, 1, 1]
    // SYMBOLS.forEach(s => Engine.addSymbol(s.value))
    // SYMBOLS.forEach(s => s.value.symbol = STANDARD_SYMBOLS_MAP.Round)


    // Engine.addDictionary({}_)


    // Engine.addLayer({
    //   name: 'origin',
    //   color: [1, 1, 1],
    //   transform: {
    //     datum: [0, 0],
    //     scale: 1,
    //     rotation: 0,
    //   },
    //   image: [
    //     malloc(new Pad({
    //       // Center point.
    //       x: 0,
    //       y: 0,
    //       // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
    //       // sym_num: STANDARD_SYMBOLS_MAP.Round,
    //       symbol: round_sym_ptr,
    //       // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
    //       // resize_factor: Math.random() + 1,
    //       resize_factor: 1,
    //       // Polarity. 0 = negative, 1 = positive
    //       polarity: 1,
    //       // Pad orientation (degrees)
    //       // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
    //       rotation: 0,
    //       // 0 = no mirror, 1 = mirror
    //       mirror: 0
    //     }))
    //   ]
    // })

    Engine.addLayer({
      name: 'layer0',
      transform: {
        datum: [0.5, 0],
        scale: 1,
        rotation: 0,
        mirror: 1,
      },
      image: PAD_RECORDS_ARRAY
    })

    Engine.addLayer({
      name: 'layer1',
      transform: {
        // datum: [0.5, 0],
        // scale: 1,
        // rotation: 0,
        // mirror: true,
      },
      image: [...LINE_RECORDS_ARRAY_POS, ...LINE_RECORDS_ARRAY_NEG]
    })

    const layer2 = Engine.addLayer({
      name: 'layer2',
      image: ARC_RECORDS_ARRAY
    })

    Engine.addLayer({
      name: 'layer3',
      image: MACRO_RECORDS_ARRAY
    })

    const macroLayer = Engine.addLayer({
      name: 'overlap',
      image: OVERLAPPING_MACRO_RECORDS_ARRAY
    })


    // setTimeout(() => {
    //   // arcs.value.map(a => a.value.polarity = 0)
    //   // arcs.value[0].value.polarity = 0
    //   // layer2.records.map(a => a.value.polarity = Math.random() > 0.5 ? 1 : 0)
    //   console.log('triggering update')
    //   // console.log(macroLayer.records.map(a => a.value.polarity))
    //   // macroLayer.records.map(a => a.value.polarity = 0)
    //   macroLayer.records.map(record => {
    //     if (record instanceof Pad && record.symbol instanceof MacroSymbol) {
    //       // record.value.x = Math.random()
    //       // record.value.y = Math.random()
    //       record.polarity = 0
    //       record.polarity = 1
    //       record.polarity = Math.random() > 0.5 ? 1 : 0
    //       // record.value.symbol.value.shapes.map(shape => {
    //       //   if (shape.value instanceof Pad) {
    //       //     shape.value.polarity = Math.random() > 0.5 ? 1 : 0
    //       //   }
    //       // })
    //       // record.value.symbol.value.shapes.map(shape => {
    //       //   if (shape.value instanceof Pad) {
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


    // SYMBOLS_ARRAY.fill(new Symbol({}))

    // Engine.addLayer({
    //   name: 'layer2',
    //   symbols: SYMBOLS_ARRAY,
    //   image: [...SURFACE_RECORDS_ARRAY, ...ARC_RECORDS_ARRAY]
    // })

    // Engine.addLayer({
    //   name: 'layer3',
    //   image: [...SURFACE_RECORDS_ARRAY]
    // })

    // Engine.addLayer({
    //   name: 'layer3',
    //   set: [...SURFACE_RECORDS_ARRAY]
    // })

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
        <div style={{
          zIndex: 100,
          // background: 'rgba(0,0,0,0.5)',
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
        </div>
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
