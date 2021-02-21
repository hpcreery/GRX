import React, { useState, useEffect, useContext } from 'react'

// Ant Design
import { Button, Typography } from 'antd'
const { Text } = Typography

// Context
import { DrawBoardContext } from '../Renderer'

const SelectKit = (props) => {
  const { drawContainer, drawBoardSize, drawBoardScale, svgContainer } = useContext(DrawBoardContext)

  const objectSelectionKit = (layer) => {
    drawContainer.innerHTML = ''
    //let svgContainer = document.getElementById('svg-container')
    //let divLayer = a // divLayer.id = layer.name
    //var svgChildElement = divLayer.childNodes[0]
    var svgChildElement = svgContainer.querySelector('div > svg')
    let svgElements = svgChildElement.querySelectorAll('g > *')
    var widthattr = svgChildElement.getAttribute('width')
    var units = widthattr.slice(-2)
    //console.log(svgElements)
    //svgElement.addEventListener('mouseover', (e) => console.log(e))
    let initColor
    svgElements.forEach((node) => {
      initColor = node.style.color
      let g
      node.onmouseover = (e) => {
        console.log(units)
        e.target.style.color = '#08979c'

        if (e.target.nodeName == 'path') {
          g = {
            type: e.target.nodeName,
            g: 'path',
            lineWidth: e.target.attributes['stroke-width'] ? e.target.attributes['stroke-width'].value : 0,
            code: e.target.attributes.d.value,
            attr: e.target.attributes,
          }
        } else if (e.target.nodeName == 'use') {
          g = {
            type: e.target.nodeName,
            g: 'pad',
            x: e.target.attributes.x.value,
            y: e.target.attributes.y.value,
            shape: e.target.attributes['xlink:href'].value,
            attr: e.target.attributes,
          }
        }
        let infoBar = document.getElementById('bottom-info-bar')
        let oldInfo = infoBar.childNodes[0]
        let info = document.createElement('h4')
        info.innerHTML = g
          ? g.g == 'path'
            ? g.lineWidth == '0'
              ? `SURFACE`
              : `LINE | Width: ${g.lineWidth / 1000}${units}`
            : `PAD | X: ${g.x / 1000}${units} Y: ${g.y / 1000}${units}`
          : 'NA'
        infoBar.replaceChild(info, oldInfo)
      }

      node.onmouseleave = (e) => {
        e.target.style.color = initColor
      }
    })
    svgContainer.onclick = (e) => {
      if (drawContainer.innerHTML != '') {
        return
      }
      e.target.style.color = initColor
      var old_element = svgChildElement
      var new_element = old_element.cloneNode(true)
      old_element.parentNode.replaceChild(new_element, old_element)
    }
  }

  const setUpKeyboardEvents = () => {
    let doc_keyUp = (e) => {
      if (e.altKey && e.key === 's') {
        objectSelectionKit()
      }
    }
    document.addEventListener('keyup', doc_keyUp, false)
  }

  return (
    <div>
      <Button type='text' style={{ width: '100%' }} onClick={() => objectSelectionKit()}>
        Select .<Text type='secondary'>(alt+s)</Text>
      </Button>
    </div>
  )
}

export default SelectKit
