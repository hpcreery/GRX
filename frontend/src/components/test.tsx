import { parse } from '@tracespace/parser'
import { ImageTree, plot } from '@tracespace/plotter'
import * as PIXI from 'pixi.js'
import { useRef, useEffect } from 'react'
import { createCanvas, PixiRenderer } from '../renderer'
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

export default function Test() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    insertPixiCanvas()
    // console.log(gerber)
    parserGerber(gerber)
    return () => {
      inputRef.current.innerHTML = ''
    }
  }, [])

  async function parserGerber(gerber: string): Promise<ImageTree>  {
    const syntaxTree = parse(gerber)
    // console.log(syntaxTree)
    const imagetree = plot(syntaxTree)
    // console.log(imagetree)
    return imagetree
  }

  async function insertPixiCanvas() {
    const pixi = new PixiRenderer()
    inputRef.current.appendChild(pixi.view as HTMLCanvasElement)
    pixi.renderTree(await parserGerber(gerber))
    // const graphics = new PIXI.Graphics();
    // // Rectangle
    // graphics.beginFill(0xDE3249);
    // graphics.drawRect(50, 50, 100, 100);
    // graphics.endFill();
    // // pixi.demo()

    // // draw polygon
    // const path = [600, 370, 700, 460, 780, 420, 730, 570, 590, 520];

    // graphics.lineStyle(0);
    // graphics.beginFill(0x3500FA, 1);
    // graphics.drawPolygon(path);
    // graphics.endFill();
    // pixi.stage.addChild(graphics);

    // const arc = new PIXI.Graphics();

    // arc.lineStyle(5, 0xAA00BB, 1);
    // arc.arc(600, 100, 50, Math.PI, 2 * Math.PI);
    // arc.endFill();
    // pixi.stage.addChild(arc);

    // const rectAndHole = new PIXI.Graphics();

    // rectAndHole.beginFill(0x00FF00);
    // rectAndHole.drawRect(350, 350, 150, 150);
    // rectAndHole.beginHole();
    // rectAndHole.drawCircle(375, 375, 25);
    // rectAndHole.drawCircle(425, 425, 25);
    // rectAndHole.drawCircle(475, 475, 25);
    // rectAndHole.endHole();
    // rectAndHole.endFill();

    // // rectAndHole.mas

    // pixi.stage.addChild(rectAndHole);
    
  }

  return (
    <>
      <div ref={inputRef} />
    </>
  )
}
