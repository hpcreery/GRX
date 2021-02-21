import React, { useState, useEffect, useContext } from 'react'

// Ant Design
import { Button, Typography } from 'antd'
const { Text } = Typography

// Context
import { DrawBoardContext } from '../Renderer'

// SVGJS
import SVG from 'svg.js'

const RulerKit = (props) => {
  const { drawContainer, drawBoardSize, drawBoardScale } = useContext(DrawBoardContext)
  let drawing

  const handleMouseLocation = (event, action) => {
    let mouseCoordinates = { pixel: { x: 0, y: 0 }, inch: { x: 0, y: 0 }, mm: { x: 0, y: 0 }, draw: { x: 0, y: 0 } }
    mouseCoordinates.pixel.x = (event.offsetX - drawBoardSize / 2) * drawBoardScale
    mouseCoordinates.pixel.y = -((event.offsetY - drawBoardSize / 2) * drawBoardScale)
    mouseCoordinates.inch.x = mouseCoordinates.pixel.x / 96
    mouseCoordinates.inch.y = mouseCoordinates.pixel.y / 96
    mouseCoordinates.mm.x = mouseCoordinates.inch.x * 24
    mouseCoordinates.mm.y = mouseCoordinates.inch.y * 24
    mouseCoordinates.draw.x = event.offsetX
    mouseCoordinates.draw.y = event.offsetY
    action(mouseCoordinates)
  }

  const handeMouseFeatures = () => {
    drawContainer.innerHTML = ''
    //console.log(document.getElementById('draw-board'))
    drawing = SVG(drawContainer.id).size(drawBoardSize, drawBoardSize)
    let svgChildElement = drawContainer.childNodes[0]
    svgChildElement.style.top = `-${drawBoardSize / 2}px`
    svgChildElement.style.left = `-${drawBoardSize / 2}px`
    svgChildElement.style.position = `relative`
    svgChildElement.style.transformOrigin = `center`
    svgChildElement.style.transform = `scale(${drawBoardScale})`
    svgChildElement.style.cursor = 'crosshair'
    svgChildElement.style.filter = 'drop-shadow(2px 4px 6px black)'
    drawContainer.addEventListener('click', (e) => handleMouseLocation(e, ruler), { once: true })
  }

  const ruler = (coordinates) => {
    let startPosition = coordinates
    let line = drawing
      .line(coordinates.draw.x, coordinates.draw.y, coordinates.draw.x, coordinates.draw.y)
      .stroke({ color: 'white', width: 3, linecap: 'round' })
    var text = drawing.text(`DX:0 DY:0 D:0`).click((e) => console.log(e))
    text.font({ fill: 'white', family: 'Inconsolata', size: 50 })
    let lineDrawing = (e) => {
      handleMouseLocation(e, (coordinates) => {
        line.attr({ x2: coordinates.draw.x, y2: coordinates.draw.y })
        text
          .move(coordinates.draw.x, coordinates.draw.y)
          .text(
            `DX:${(coordinates.inch.x - startPosition.inch.x).toFixed(5)}" DY:${(
              coordinates.inch.y - startPosition.inch.y
            ).toFixed(5)}" D:${Math.sqrt(
              Math.pow(coordinates.inch.x - startPosition.inch.x, 2) +
                Math.pow(coordinates.inch.y - startPosition.inch.y, 2)
            ).toFixed(5)}"`
          )
      })
    }
    drawContainer.addEventListener('mousemove', lineDrawing)
    drawContainer.addEventListener('click', (e) => {
      drawContainer.removeEventListener('mousemove', lineDrawing)
    })
  }

  const setUpKeyboardEvents = () => {
    let doc_keyUp = (e) => {
      if (e.altKey && e.key === 'r') {
        handeMouseFeatures()
      }
    }
    document.addEventListener('keyup', doc_keyUp, false)
  }

  // useEffect(() => {
  //   // Mount and Update
  //   console.log('update')
  //   console.log(drawContainer)
  //   drawContainer ? drawContainer.addEventListener('mousemove', setInfoCoordinates) : ''
  //   return () => {
  //     // Unmount
  //     drawContainer ? drawContainer.removeEventListener('mousemove', setInfoCoordinates) : ''
  //   }
  // })

  return (
    <div>
      <Button type='text' style={{ width: '100%' }} onClick={() => handeMouseFeatures()}>
        Ruler .<Text type='secondary'>(alt+r)</Text>
      </Button>
    </div>
  )
}

export default RulerKit
