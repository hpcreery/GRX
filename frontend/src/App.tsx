import './App.css'
// import Test from './components/test'
import * as PIXI from 'pixi.js'
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import { PixiGerberApplication } from './renderer'
import gerberpath from './gerbers/gerber.txt'
import l7spath from './gerbers/l7s.gbr'
import l4spath from './gerbers/l4s.gbr'
import bvgerber from './gerbers/bv_1-5.gbr'
import sample1 from './gerbers/sample1.gbr'
import sample2 from './gerbers/sample2.gbr'

function App() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    const pixi = insertPixiCanvas()
    return () => {
      pixi.destroy(true)
      // inputRef.current.innerHTML = ''
    }
  }, [])

  async function getGerber(path: string) {
    const gerber = await fetch(path).then((res) => res.text())
    return gerber
  }

  function insertPixiCanvas() {
    const pixi = new PixiGerberApplication(inputRef, {
      width: inputRef.current.clientWidth,
      height: inputRef.current.clientHeight,
      antialias: false,
      autoDensity: true,
      backgroundColor: 0x0,
      resolution: devicePixelRatio,
    })

    inputRef.current.appendChild(pixi.view as HTMLCanvasElement)
    // getGerber(gerberpath).then(gerber => pixi.addGerber(gerber))
    // getGerber(l7spath).then(gerber => pixi.addGerber(gerber))
    // getGerber(l4spath).then(gerber => pixi.addGerber(gerber))
    // getGerber(bvgerber).then(gerber => pixi.addGerber(gerber))
    getGerber(sample1).then((gerber) => pixi.addGerber(gerber))
    getGerber(sample2).then((gerber) => pixi.addGerber(gerber))

    if (pixi.renderer.type == PIXI.RENDERER_TYPE.WEBGL) {
      console.log('Using WebGL')
    } else {
      console.log('Using Canvas')
    }

    return pixi
  }

  console.log('Rendering App')
  return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={inputRef} />
}

export default App
