import './App.css'
import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react'
import gerberpath from './gerbers/gerber.txt'
import l7spath from './gerbers/l7s.gbr'
import l4spath from './gerbers/l4s.gbr'
import bvgerber from './gerbers/bv_1-5.gbr'
import b_cu from './gerbers/Watchy_B_Cu.gbr'
import b_mask from './gerbers/Watchy_B_Mask.gbr'
import b_paste from './gerbers/Watchy_B_Paste.gbr'
import f_cu from './gerbers/Watchy_F_Cu.gbr'
import f_mask from './gerbers/Watchy_F_Mask.gbr'
import f_paste from './gerbers/Watchy_F_Paste.gbr'
import edge_cuts from './gerbers/Watchy_Edge_Cuts.gbr'
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
      backgroundColor: 0x0E0E0E,
      // backgroundColor: 0xFFFFFF,
    })

    // getGerber(l7spath).then((gerber) => pixi.addGerber(gerber))
    // getGerber(l4spath).then((gerber) => pixi.addGerber(gerber))
    // getGerber(bvgerber).then((gerber) => pixi.addGerber(gerber))
    getGerber(sample1).then((gerber) => pixi.addGerber(gerber))
    // getGerber(sample2).then((gerber) => pixi.addGerber(gerber))

    // getGerber(b_cu).then((gerber) => pixi.addGerber(gerber))
    // getGerber(b_mask).then((gerber) => pixi.addGerber(gerber))
    // getGerber(b_paste).then((gerber) => pixi.addGerber(gerber))
    // getGerber(f_cu).then((gerber) => pixi.addGerber(gerber))
    // getGerber(f_mask).then((gerber) => pixi.addGerber(gerber))
    // getGerber(f_paste).then((gerber) => pixi.addGerber(gerber))
    // getGerber(edge_cuts).then((gerber) => pixi.addGerber(gerber))

    pixi.renderer.then((renderer) => {
      // change background color
      // @ts-ignore
      // renderer.renderer.backgroundColor = 0xFFFFFF
    })


    return pixi
  }

  return <div id='GRX' style={{ width: '100%', height: '100%' }} ref={inputRef} />
}

export default App
