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
import { Button } from '@mantine/core'

// N == Number of Shapes
const N_PADS = 5000
const N_LINES = 100
const N_ARCS = 10

const PAD_RECORDS_ARRAY = Array<number[]>(N_PADS)
  .fill(Array<number>(PAD_RECORD_PARAMETERS.length).fill(0))
  .map((_, i) => {
    return new Pad_Record({
      // index of feature
      // index: i / N_PADS,
      index: (i) / (N_LINES + N_PADS),
      // Center point.
      x: (Math.random() - 0.5) * 1,
      y: (Math.random() - 0.5) * 1,
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      sym_num: i % Object.keys(STANDARD_SYMBOLS).length,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      resize_factor: 0,
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
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
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
    }).toArray()
  })

const LINE_RECORDS_ARRAY2 = Array<number[]>(N_LINES)
  .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
  .map((_, i) => {
    return new Line_Record({
      // index of feature
      index: i / N_LINES,

      // Start point.
      xs: (Math.random() - 0.5) * 1,
      ys: (Math.random() - 0.5) * 1,

      // End point.
      xe: (Math.random() - 0.5) * 1,
      ye: (Math.random() - 0.5) * 1,

      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      // polarity: i % 2,
      polarity: Math.random() > 0.5 ? 1 : 0,
    }).toArray()
  })

const ARC_RECORDS_ARRAY = Array<number[]>(N_ARCS)
  .fill(Array<number>(LINE_RECORD_PARAMETERS.length).fill(0))
  .map((_, i) => {
    const start_angle = Math.abs(Math.random()) * 360
    const end_angle = Math.abs(Math.random()) * 360
    const radius = Math.abs(Math.random()) * 0.1
    const center_x = (Math.random() - 0.5) * 1
    const center_y = (Math.random() - 0.5) * 1
    function degreesToRadians(degrees: number): number {
      return degrees * (Math.PI / 180);
    }
    return new Arc_Record({
      // index of feature
      index: i / N_ARCS,

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
      sym_num: STANDARD_SYMBOLS_MAP.Round,
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      // polarity: Math.random() > 0.5 ? 1 : 0,
      clockwise: Math.random() > 0.5 ? 1 : 0,
      // clockwise: 0,
    }).toArray()
  })


const SYMBOLS_ARRAY = new Array<number[]>(STANDARD_SYMBOLS.length)
  .fill(Array<number>(SYMBOL_PARAMETERS.length).fill(0))
  .map((_, i) => {
    return new Symbol({
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
    }).toArray()
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


    Engine.OUTLINE_MODE = false

    Engine.addLayer({
      name: 'layer1',
      pads: PAD_RECORDS_ARRAY,
      lines: LINE_RECORDS_ARRAY,
      symbols: SYMBOLS_ARRAY,
      // arcs: ARC_RECORDS_ARRAY,
    })

    Engine.addLayer({
      name: 'layer2',
      lines: LINE_RECORDS_ARRAY2,
      symbols: SYMBOLS_ARRAY,
    })

    Engine.addLayer({
      name: 'layer3',
      arcs: ARC_RECORDS_ARRAY,
      symbols: SYMBOLS_ARRAY,
    })

    setEngine(Engine)

    return () => {
      Engine.destroy()
    }

  }, [])

  return (
    <>
      {engine ? <StatsWidget /> : null}
      <Button onClick={(): void => { engine ? engine.OUTLINE_MODE = !engine.OUTLINE_MODE : null }}>OUTLINE</Button>
      <Button onClick={(): void => { engine ? engine.layers.map(l => l.color = [Math.random(), Math.random(), Math.random()]) && engine.render(true) : null }}>COLOR</Button>
      <div
        ref={containerRef}
        id="container-element"
        style={{
          width: '100%',
          height: '100%'
        }}
      >
      </div>
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
