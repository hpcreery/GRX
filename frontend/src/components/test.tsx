// import { parse } from '@tracespace/parser'
// TODO: Await v5 release of @tracespace/parser
import { parse, GerberTree } from '@hpcreery/tracespace-parser'
// import { ImageTree, plot } from '@tracespace/plotter'
// TODO: Await v5 release of @tracespace/plotter
import { ImageTree, plot } from '@hpcreery/tracespace-plotter'

import { GraphPaper, GraphStyle } from 'pixi-graphpaper'
import { Viewport } from 'pixi-viewport'
import * as PIXI from 'pixi.js'
import { DisplayObject } from 'pixi.js'
import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import { CustomPixiApplication } from '../renderer'
import useResizeObserver from '@react-hook/resize-observer'
import useSize from '../hooks/useSize'
// import test from '@tracespace/fixtures/gerbers/circle-with-hole.gbr'
import pads from './gerbervar'
let gerber = `%FSLAX34Y34*%
%MOIN*%
%ADD10C,0.5X0.25*%
D10*
X0Y0D03*
M02*
`

// gerber = `%FSLAX33Y33*%
// %MOIN*%
// %ADD10R,1.0X0.5*%
// D10*
// G75*
// G36*
// X200Y1000D02*
// G01X1200D01*
// G01Y200D01*
// G01X200D01*
// G01Y600D01*
// G01X500D01*
// G03X500Y600I300J0D01*
// G01X200D01*
// G01Y1000D01*
// G37*
// M02*
// `

// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %ADD10C,0.5X0.25X0.15*%
// D10*
// X0Y0D03*
// M02*
// `

// // Full circles => works
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %ADD10C,0.15*%
// D10*
// G75*
// G03*
// X0Y0I-5000D01*
// X3000Y0D02*
// G02*
// X3000Y0I5000D01*
// M02*
// `

// Two Arcs drawn with circles => works
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %ADD10C,0.15*%
// D10*
// G75*
// X-2500Y2500D02*
// G03*
// X-7500Y2500I-2500J-2500D01*
// X2500Y2500D02*
// G02*
// X7500Y2500I2500J-2500D01*
// M02*
// `

// lines drawn with squares
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %ADD10R,0.2X0.1*%
// D10*
// G01*
// X10000Y4000D01*
// G01*
// X3000Y8000D01*
// G01*
// X1000Y6000D01*
// G01*
// X4000Y4000D01*
// M02*
// `

// // sqare with square hole => Works
// gerber = `%FSLAX33Y33*%
// %MOIN*%
// %ADD10R,1.0X0.5*%
// D10*
// G36*
// X12200Y25700D02*
// G01Y27200D01*
// G01X13100D01*
// G01Y25700D01*
// G01X12500D01*
// G01Y26000D01*
// G01X12900D01*
// G01Y26400D01*
// G01X12500D01*
// G01Y26700D01*
// G01X12900D01*
// G01Y27000D01*
// G01X12500D01*
// G01Y26700D01*
// G01Y26400D01*
// G01Y26000D01*
// G01Y25700D01*
// G01X12200D01*
// G37*
// M02*
// `

// masks
gerber = `%FSLAX34Y34*%
%MOIN*%
%AMTEST*
0 dark 1"x0.5" center rect at 0,0*
21,1,1,0.5,0,0,0*
0 clear 0.4" circle at 0,0*
1,0,0.4,0,0*
0 dark 0.1"x0.75" center rect at 0,0*
21,1,0.1,0.75,0,0,0*
0 dark 0.75"x0.1" center rect at 0,0.35*
21,1,0.75,0.1,0,0.35,0*
0 clear 0.1" circle at 0,0.35"*
1,0,0.1,0,0.35*
0 clear 0.1" circle at -0.35,0"*
1,0,0.1,-0.35,0*
0 clear 0.1" circle at 0.35,0"*
1,0,0.1,0.35,0*%
%ADD10TEST*%
D10*
X0Y0D03*
M02*
`

// TODO: inverse mask // very weird
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %AMTEST*
// 0 dark 1"x0.5" center rect at 0,0*
// 21,1,1,0.5,0,0,0*
// 0 clear 0.4" circle at 0,0*
// 1,0,0.4,0,0*
// 0 dark 0.1"x0.75" center rect at 0,0*
// 21,1,0.1,0.75,0,0,0*
// 0 dark 0.75"x0.1" center rect at 0,0.35*
// 21,1,0.75,0.1,0,0.35,0*
// 0 clear 0.1" circle at 0,0.35"*
// 1,0,0.1,0,0.35*
// 0 clear 0.1" circle at -0.35,0"*
// 1,0,0.1,-0.35,0*
// 0 clear 0.1" circle at 0.35,0"*
// 1,0,0.1,0.35,0*%
// %LPD*%
// D11*
// X0Y0D03*
// %LPC*%
// D10*
// X0Y0D03*
// M02*
// `

// let geber = `
// %FSLAX34Y34*%
// %MOIN*%
// %AMTEST*
// 0 dark 1"x0.5" center rect at 0,0*
// 21,1,1,0.5,0,0,0*
// 0 clear 0.4" circle at 0,0*
// 1,0,0.4,0,0*
// 0 dark 0.1"x0.75" center rect at 0,0*
// 21,1,0.1,0.75,0,0,0*
// 0 dark 0.75"x0.1" center rect at 0,0.35*
// 21,1,0.75,0.1,0,0.35,0*
// 0 clear 0.1" circle at 0,0.35"*
// 1,0,0.1,0,0.35*
// 0 clear 0.1" circle at -0.35,0"*
// 1,0,0.1,-0.35,0*
// 0 clear 0.1" circle at 0.35,0"*
// 1,0,0.1,0.35,0*%
// %ADD10TEST*%
// D10*
// X0Y0D03*
// M02*
// `

// // inverse mask // very weird
// gerber = `
// %FSLAX34Y34*%
// %MOIN*%
// %AMMOIRE1*
// 6,0,0,0.5,0.04,0.025,2,0.01,0.55,0*%
// %ADD10MOIRE1*%
// %ADD11R,1.1X1.1*%
// %LPD*%
// D11*
// X0Y0D03*
// %LPC*%
// D10*
// X0Y0D03*
// M02*
// `

// moire
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %AMMOIRE1*
// 6,0,0,0.5,0.04,0.03,2,0.01,0.55,0*%
// %AMMOIRE2*
// 6,0,0,0.5,0.04,0.03,4,0.01,0.55,0*%
// %ADD10MOIRE1*%
// D10*
// X0Y0D03*
// %ADD11MOIRE2*%
// D11*
// X6000D03*
// M02*
// `

// moire with layerd object
// gerber = `
// %FSLAX34Y34*%
// %MOIN*%
// %AMMOIRE1*
// 6,0,0,0.5,0.04,0.03,2,0.01,0.55,0*%
// %AMMOIRE2*
// 6,0,0,0.5,0.04,0.03,4,0.01,0.55,0*%
// %ADD10MOIRE1*%
// %AMTEST*
// 0 dark 1"x0.5" center rect at 0,0*
// 21,1,1,0.5,0,0,0*
// 0 clear 0.4" circle at 0,0*
// 1,0,0.4,0,0*
// 0 dark 0.1"x0.75" center rect at 0,0*
// 21,1,0.1,0.75,0,0,0*
// 0 dark 0.75"x0.1" center rect at 0,0.35*
// 21,1,0.75,0.1,0,0.35,0*
// 0 clear 0.1" circle at 0,0.35"*
// 1,0,0.1,0,0.35*
// 0 clear 0.1" circle at -0.35,0"*
// 1,0,0.1,-0.35,0*
// 0 clear 0.1" circle at 0.35,0"*
// 1,0,0.1,0.35,0*%
// %ADD19TEST*%
// D10*
// X0Y0D03*
// %ADD11MOIRE2*%
// D11*
// X6000D03*
// D19*
// X0Y0D03*
// M02*
// `
// // TODO: IMPLEMENT STEP AND REPEAT
// gerber = `%FSLAX34Y34*%
// %MOIN*%
// %ADD10R,0.5X0.5*%
// %SRX3Y2I1J1*%
// D10*
// X0Y0D03*
// M02*
// `

// gerber = `
// %FSLAX34Y34*%
// %MOIN*%
// %ADD10C,0.5*%
// D10*
// X0Y0D03*
// M02*
// `

// step and repeat multi pol
// gerber = `
// %FSLAX34Y34*%
// %MOIN*%
// %ADD10C,1*%
// %ADD11C,0.8*%
// %ADD12C,0.6*%
// %ADD13C,0.4*%
// %ADD14C,0.2*%
// %SRX2Y2I0.5J0.5*%
// D10*
// D03*
// %LPC*%
// D11*
// D03*
// %LPD*%
// D12*
// D03*
// %LPC*%
// D13*
// D03*
// %LPD*%
// D14*
// D03*
// M02*
// `

export default function Test() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    const pixi = insertPixiCanvas()
    return () => {
      pixi.destroy(true)
      inputRef.current.innerHTML = ''
    }
  }, [])

  async function parserGerber(gerber: string): Promise<ImageTree> {
    const syntaxTree = parse(gerber)
    console.log(syntaxTree)
    const imagetree = plot(syntaxTree)
    console.log(imagetree)
    return imagetree
  }

  function insertPixiCanvas() {
    const pixi = new CustomPixiApplication(inputRef, {
      width: inputRef.current.clientWidth,
      height: inputRef.current.clientHeight,
      antialias: false,
      autoDensity: true,
      backgroundColor: 0x0,
      resolution: devicePixelRatio,
    })

    const containerObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      pixi.renderer.resize(width, height)
      pixi.viewport.resize(width, height)
    })
    containerObserver.observe(inputRef.current)

    inputRef.current.appendChild(pixi.view as HTMLCanvasElement)

    parserGerber(gerber).then((imageTree) => pixi.renderImageTree(imageTree))

    if (pixi.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
      console.log('Using WebGL')
    } else {
      console.log('Using Canvas')
    }

    return pixi
  }

  return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={inputRef} />
}
