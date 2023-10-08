/* eslint-disable react/prop-types */
import React from 'react'
import '../App.css'
import {
  STANDARD_SYMBOLS,
  STANDARD_SYMBOLS_MAP,
  SYMBOL_PARAMETERS,
  SYMBOL_PARAMETERS_MAP,
  Symbol
} from './symbols'
import {
  PAD_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  Pad_Record,
  Line_Record,
  Arc_Record
} from './records'
import { RenderEngine } from './engine'


function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  // N == Number of Shapes
  const N_PADS = 300
  const N_LINES = 30

  React.useEffect(() => {
    const Engine = new RenderEngine({
      container: reglRef.current,
      antialias: false,
    })
    const PAD_RECORDS_ARRAY = Array<number[]>(N_PADS)
      .fill(Array<number>(PAD_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Pad_Record({
          // index of feature
          // index: i / N_PADS,
          index: (i) / (N_LINES + N_PADS),
          // Center point.
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % Object.keys(STANDARD_SYMBOLS).length,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          resize_factor: 0,
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
          // Pad orientation (degrees)
          rotation: 0,
          // 0 = no mirror, 1 = mirror
          mirror: 0
        }).toArray()
      })


    const LINE_RECORDS_ARRAY = Array<number[]>(N_LINES)
      .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Line_Record({
          // index of feature
          // index: i / N_LINES,
          index: (i + N_PADS) / (N_LINES + N_PADS),

          // Start point.
          xs: (Math.random() - 0.5) * 100,
          ys: (Math.random() - 0.5) * 100,

          // End point.
          xe: (Math.random() - 0.5) * 100,
          ye: (Math.random() - 0.5) * 100,

          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
        }).toArray()
      })

    const LINE_RECORDS_ARRAY2 = Array<number[]>(N_LINES)
      .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Line_Record({
          // index of feature
          index: i / N_LINES,

          // Start point.
          xs: (Math.random() - 0.5) * 100,
          ys: (Math.random() - 0.5) * 100,

          // End point.
          xe: (Math.random() - 0.5) * 100,
          ye: (Math.random() - 0.5) * 100,

          // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
          sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
          // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
          // Polarity. 0 = negative, 1 = positive
          polarity: i % 2,
        }).toArray()
      })


    const SYMBOLS_ARRAY = new Array<number[]>(STANDARD_SYMBOLS.length)
      .fill(Array<number>(SYMBOL_PARAMETERS.length).fill(0))
      .map((_, i) => {
        return new Symbol({
          symbol: i, // symbol
          width: 1.0, // width, square side, diameter
          height: 1.0, // height
          corner_radius: 0.2, // corner radius
          corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
          outer_dia: 1.0, // — Outer diameter of the shape
          inner_dia: 0.8, // — Inner diameter of the shape
          line_width: 0.1, // — Line width of the shape (applies to the whole shape)
          line_length: 2.0, // — Line length of the shape (applies to the whole shape)
          angle: 0, // — Angle of the spoke from 0 degrees
          gap: 0.1, // — Gap
          num_spokes: 2, // — Number of spokes
          round: 0, // —r|s == 1|0 — Support for rounded or straight corners
          cut_size: 0, // — Size of the cut ( see corner radius )
          ring_width: 0.1, // — Ring width
          ring_gap: 0.4, // — Ring gap
          num_rings: 2 // — Number of rings
        }).toArray()
      })


    Engine.addLayer({
      pads: PAD_RECORDS_ARRAY,
      lines: LINE_RECORDS_ARRAY,
      symbols: SYMBOLS_ARRAY,
      arcs: [],
    })
    Engine.addLayer({
      lines: LINE_RECORDS_ARRAY2,
      symbols: SYMBOLS_ARRAY,
      arcs: [],
      pads: []
    })
    Engine.render()
    return () => {
      Engine.destroy()
    }

  }, [])

  return (
    <div
      ref={reglRef}
      id="regl-element"
      style={{
        width: '100%',
        height: '100%'
      }}
    ></div>
  )
}

export default REGLApp
