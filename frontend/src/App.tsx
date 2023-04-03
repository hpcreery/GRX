import './App.css'
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import gerberpath from './gerbers/gerber.txt'
import l7spath from './gerbers/l7s.gbr'
import l4spath from './gerbers/l4s.gbr'
import bvgerber from './gerbers/bv_1-5.gbr'
import sample1 from './gerbers/sample1.gbr'
import sample2 from './gerbers/sample2.gbr'
import OffscreenGerberApplication from './renderer/offscreen'

function App() {
  const inputRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    let pixi = insertPixiCanvas(inputRef.current)
    return () => {
      pixi.destroy()
      inputRef.current.innerHTML = ''
    }
  }, [])

  async function getGerber(path: string) {
    const gerber = await fetch(path).then((res) => res.text())
    return gerber
  }

  function insertPixiCanvas(element: HTMLDivElement) {
    let pixi = new OffscreenGerberApplication({
      element: element,
      width: element.clientWidth,
      height: element.clientHeight,
      antialias: false,
      // autoDensity: true,
      backgroundColor: 0x0,
      // resolution: devicePixelRatio,
    })
    // getGerber(gerberpath).then((Pgerber) => pixi.addGerber(gerber))
    // let gerber1 = await getGerber(l7spath)
    // let gerber2 = await getGerber(l4spath)
    // let gerber3 = await getGerber(bvgerber)
    // pixi.addGerber(gerber1)
    // pixi.addGerber(gerber2)
    // pixi.addGerber(gerber3)
    // let gerber4 = await getGerber(sample1)
    // let gerber5 = await getGerber(sample2)
    // pixi.addGerber(gerber4)
    // pixi.addGerber(gerber5)

    getGerber(sample1).then((gerber) => pixi.addGerber(gerber))
    getGerber(sample2).then((gerber) => pixi.addGerber(gerber))
    return pixi
  }

  console.log('Rendering App')
  return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={inputRef} />
}

export default App
