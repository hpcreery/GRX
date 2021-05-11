import React, { useState, useEffect, useContext } from 'react'

import { DrawBoardContext } from '../Renderer'

const InfoCoords = (props) => {
  const [coordinates, setCoordinates] = useState({
    pixel: { x: 0, y: 0 },
    inch: { x: 0, y: 0 },
    mm: { x: 0, y: 0 },
    draw: { x: 0, y: 0 },
  })
  const { drawContainer, drawBoardSize, drawBoardScale, infobar } = useContext(DrawBoardContext)

  const setInfoCoordinates = (event) => {
    // let infoBar = document.getElementById('bottom-info-bar')
    let oldInfo = infobar.childNodes[0]
    let mouseCoordinates = {
      pixel: { x: 0, y: 0 },
      inch: { x: 0, y: 0 },
      mm: { x: 0, y: 0 },
      draw: { x: 0, y: 0 },
    }
    mouseCoordinates.pixel.x = (event.offsetX - drawBoardSize / 2) * drawBoardScale
    mouseCoordinates.pixel.y = -(event.offsetY - drawBoardSize / 2) * drawBoardScale
    mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
    mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
    mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
    mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
    mouseCoordinates.draw.x = event.offsetX
    mouseCoordinates.draw.y = -event.offsetY
    let info = document.createElement('h4')
    info.innerHTML = `( ${coordinates.inch.x.toFixed(5)}in, ${coordinates.inch.y.toFixed(5)}in )`
    infobar.replaceChild(info, oldInfo)
    setCoordinates(mouseCoordinates)
  }

  useEffect(() => {
    // Mount and Update
    drawContainer ? drawContainer.addEventListener('mousemove', setInfoCoordinates) : ''
    return () => {
      // Unmount
      drawContainer ? drawContainer.removeEventListener('mousemove', setInfoCoordinates) : ''
    }
  })

  return <div></div>
}

export default InfoCoords
