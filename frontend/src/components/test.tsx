// import { parse, GerberTree } from '@hpcreery/tracespace-parser'
// import { ImageTree, plot } from '@hpcreery/tracespace-plotter'
// import * as PIXI from 'pixi.js'
// import { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
// import { PixiGerberApplication } from '../renderer'
// import gerberpath from '../gerbers/gerber.txt'
// import l7spath from '../gerbers/l7s.gbr'
// import l4spath from '../gerbers/l4s.gbr'
// import bvgerber from '../gerbers/bv_1-5.gbr'


// export default function Test() {
//   const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

//   useEffect(() => {
//     const pixi = insertPixiCanvas()
//     return () => {
//       // inputRef.current.removeEventListener
//       pixi.viewport.removeAllListeners()
//       pixi.destroy(true)
//       inputRef.current.innerHTML = ''
//     }
//   }, [])

//   async function parserGerber(gerber: string): Promise<ImageTree> {
//     const syntaxTree = parse(gerber)
//     console.log('Syntax Tree:', syntaxTree)
//     const imagetree = plot(syntaxTree)
//     console.log('Image Tree:', imagetree)
//     return imagetree
//   }

//   async function getGerber(path: string) {
//     const gerber = await fetch(path).then((res) => res.text())
//     return gerber
//   }

//   function insertPixiCanvas() {
//     const pixi = new PixiGerberApplication(inputRef, {
//       width: inputRef.current.clientWidth,
//       height: inputRef.current.clientHeight,
//       antialias: false,
//       autoDensity: true,
//       backgroundColor: 0x0,
//       resolution: devicePixelRatio,
//     })

//     const containerObserver = new ResizeObserver((entries) => {
//       const { width, height } = entries[0].contentRect
//       pixi.renderer.resize(width, height)
//       pixi.viewport.resize(width, height)
//     })
//     containerObserver.observe(inputRef.current)

//     inputRef.current.appendChild(pixi.view as HTMLCanvasElement)
//     // getGerber(gerberpath).then((gerber) => parserGerber(gerber).then((imageTree) => pixi.renderImageTree(imageTree)))
//     getGerber(l7spath).then((gerber2) => parserGerber(gerber2).then((imageTree) => pixi.renderImageTree(imageTree)))
//     getGerber(l4spath).then((gerber2) => parserGerber(gerber2).then((imageTree) => pixi.renderImageTree(imageTree)))
//     getGerber(bvgerber).then((gerber2) => parserGerber(gerber2).then((imageTree) => pixi.renderImageTree(imageTree)))
//     // pixi.viewport.addChild

//     if (pixi.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
//       console.log('Using WebGL')
//     } else {
//       console.log('Using Canvas')
//     }

//     return pixi
//   }

//   return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={inputRef} />
// }
export {}