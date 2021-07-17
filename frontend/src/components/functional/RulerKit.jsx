import React, { useEffect, useContext } from 'react'

// Ant Design
import { Button, Typography } from 'antd'

// Context
import { DrawBoardContext } from '../Renderer'

// SVGJS
import SVG from 'svg.js'

const { Text } = Typography

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

  const reCreateDrawBoard = () => {
    drawContainer.innerHTML = ''
    let drawingBoard = SVG(drawContainer.id).size(drawBoardSize, drawBoardSize)
    let svgChildElement = drawContainer.childNodes[0]
    svgChildElement.style.top = `-${drawBoardSize / 2}px`
    svgChildElement.style.left = `-${drawBoardSize / 2}px`
    svgChildElement.style.position = `relative`
    svgChildElement.style.transformOrigin = `center`
    svgChildElement.style.transform = `scale(${drawBoardScale})`
    svgChildElement.style.cursor = 'crosshair'
    svgChildElement.style.filter = 'drop-shadow(2px 4px 6px black)'
    return drawingBoard
  }

  const handleRulerKit = () => {
    drawing = reCreateDrawBoard()
    var action = (e) => handleMouseLocation(e, ruler)
    drawContainer.addEventListener('click', action, { once: true })
    let escape = (e) => {
      if (e.key === 'Escape') {
        console.log(e)
        drawContainer.removeEventListener('click', action)
        reCreateDrawBoard()
      }
    }
    document.addEventListener('keydown', escape, { once: true })
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

  let doc_keyDown = (e) => {
    console.log(e)
    if (e.altKey && e.code === 'KeyR') {
      handleRulerKit()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', doc_keyDown, false)
    return function cleanup() {
      document.removeEventListener('keydown', doc_keyDown, false)
    }
  })

  return (
    <div>
      <Button type='text' style={{ width: '100%' }} onClick={() => handleRulerKit()}>
        Ruler&#160;<Text type='secondary'>(alt+r)</Text>
      </Button>
    </div>
  )
}

export default RulerKit
