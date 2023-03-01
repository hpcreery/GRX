import { parse } from '@tracespace/parser'
import { ImageTree, plot } from '@tracespace/plotter'
import { GraphPaper, GraphStyle } from 'pixi-graphpaper'
import { Viewport } from 'pixi-viewport'
import * as PIXI from 'pixi.js'
import { DisplayObject } from 'pixi.js'
import { useRef, useEffect } from 'react'
import { createCanvas, CustomPixiApplication } from '../renderer'
// import test from '@tracespace/fixtures/gerbers/circle-with-hole.gbr'
let gerber = `%FSLAX34Y34*%
%MOIN*%
%ADD10C,0.5X0.25*%
D10*
X0Y0D03*
M02*
`

gerber = `%FSLAX33Y33*%
%MOIN*%
%ADD10R,1.0X0.5*%
D10*
G75*
G36*
X200Y1000D02*
G01X1200D01*
G01Y200D01*
G01X200D01*
G01Y600D01*
G01X500D01*
G03X500Y600I300J0D01*
G01X200D01*
G01Y1000D01*
G37*
M02*
`

gerber = `%FSLAX34Y34*%
%MOIN*%
%ADD10C,0.5X0.25X0.15*%
D10*
X0Y0D03*
M02*
`

export default function Test() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    insertPixiCanvas()
    return () => {
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

  async function insertPixiCanvas() {
    const pixi = new CustomPixiApplication({
      width: window.innerWidth, // TODO: fix this to allow embedded
      height: window.innerHeight, // TODO: fix this to allow embedded
      antialias: true,
      autoDensity: true,
      backgroundColor: 0x0,
      resolution: devicePixelRatio,
    })
    inputRef.current.appendChild(pixi.view as HTMLCanvasElement)
    // pixi.stage.interactive = true;
    // pixi.stage.eventMode = 'auto'
    // pixi.stage.hitArea = pixi.screen;
    pixi.renderImageTree(await parserGerber(gerber))
  }

  return (
    <>
      <div ref={inputRef} />
    </>
  )
}
