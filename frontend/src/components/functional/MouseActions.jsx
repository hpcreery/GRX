import React, { useState, useEffect } from 'react'

//const infoBar = document.getElementById('bottom-info-bar')

const MouseActions = (props) => {
  const { drawContainer, drawBoardSize, drawBoardScale, render } = props
  const [coordinates, setCoordinates] = useState({
    pixel: { x: 0, y: 0 },
    inch: { x: 0, y: 0 },
    mm: { x: 0, y: 0 },
    draw: { x: 0, y: 0 },
  })

  //console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

  const handleMouseLocation = (event) => {
    let infoBar = document.getElementById('bottom-info-bar')
    let oldInfo = infoBar.childNodes[0]
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
    //console.log(mouseCoordinates)
    let info = document.createElement('h4')
    info.innerHTML = `${coordinates.inch.x.toFixed(5)}in, ${coordinates.inch.y.toFixed(5)}in`
    infoBar.replaceChild(info, oldInfo)
    setCoordinates(mouseCoordinates)
  }

  const handleFastMouseLocation = (event) => {
    let mouseCoordinates = {
      pixel: { x: 0, y: 0 },
      inch: { x: 0, y: 0 },
      mm: { x: 0, y: 0 },
      draw: { x: 0, y: 0 },
    }
    mouseCoordinates.pixel.x = event.offsetX - drawBoardSize / 20
    mouseCoordinates.pixel.y = -(event.offsetY - drawBoardSize / 20)
    mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
    mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
    mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
    mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
    mouseCoordinates.draw.x = event.offsetX
    mouseCoordinates.draw.y = -event.offsetY
    console.log(mouseCoordinates.pixel.x, mouseCoordinates.pixel.y)
  }

  //static getDerivedStateFromProps(props, state) {}

  useEffect(() => {
    // Mount and Update
    //console.log('mounting.updating')
    drawContainer.addEventListener('mousemove', handleMouseLocation)
    //drawContainer.addEventListener('click', handleFastMouseLocation)
    return () => {
      // Unmount
      //console.log('unmounting mouse actions')
      drawContainer.removeEventListener('mousemove', handleMouseLocation)
      //drawContainer.removeEventListener('click', handleFastMouseLocation)
    }
  })

  return <div>{}</div>
}

export default MouseActions
