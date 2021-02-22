import React, { useState, useEffect, useContext } from 'react'

// Ant Design
import { Button, Typography } from 'antd'
const { Text } = Typography

// Context
import { DrawBoardContext } from '../Renderer'

const SelectKit = (props) => {
  const { drawContainer, drawBoardSize, drawBoardScale, svgContainer } = useContext(DrawBoardContext)

  const deriveNodeAttributes = (nodeMap, units) => {
    let array = [...nodeMap]
    let string = ''
    for (var i = 0; i < array.length; i++) {
      if (array[i].nodeName != 'id') {
        string += ` ${array[i].nodeName.toUpperCase()}: ${array[i].value / 1000}${units}`
      }
    }
    console.log(array)
    console.log(string)
    return string
  }

  const objectSelectionKit = (layer) => {
    drawContainer.innerHTML = ''
    //let svgContainer = document.getElementById('svg-container')
    //let divLayer = a // divLayer.id = layer.name
    //var svgChildElement = divLayer.childNodes[0]
    var svgChildElement = svgContainer.querySelector('div > svg')
    let defs = svgChildElement.querySelectorAll('defs > *')
    let defList = []
    defs.forEach((node) => {
      defList.push({ id: node.id, type: node.nodeName, attributes: node.attributes })
    })
    console.log(defList)
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
        //console.log(e)
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
          let pad = defList.find((def) => def.id == e.target.attributes['xlink:href'].value.substring(1))
          console.log(pad)
          g = {
            type: e.target.nodeName,
            g: 'pad',
            x: e.target.attributes.x.value,
            y: e.target.attributes.y.value,
            shapeid: e.target.attributes['xlink:href'].value,
            shape: pad,
            attr: e.target.attributes,
          }
        }
        let infoBar = document.getElementById('bottom-info-bar')
        let oldInfo = infoBar.childNodes[0]
        let info = document.createElement('h4')
        //let attributes = deriveNodeAttributes(g.shape.attributes)
        info.innerHTML = g
          ? g.g == 'path'
            ? g.lineWidth == '0'
              ? `SURFACE`
              : `LINE | Width: ${g.lineWidth / 1000}${units}`
            : `PAD | Shape: ${g.shape.type.toUpperCase()} X: ${(g.x / 1000).toFixed(5)}${units} Y: ${(
                g.y / 1000
              ).toFixed(5)}${units} | ${deriveNodeAttributes(g.shape.attributes, units)}`
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

  let doc_keyDown = (e) => {
    console.log(e)
    if (e.altKey && e.code === 'KeyS') {
      objectSelectionKit()
    }
  }

  const setUpKeyboardEvents = () => {}

  useEffect(() => {
    document.addEventListener('keyup', doc_keyDown, false)
    return function cleanup() {
      document.removeEventListener('keyup', doc_keyDown, false)
    }
  })

  return (
    <div>
      <Button type='text' style={{ width: '100%' }} onClick={() => objectSelectionKit()}>
        Select .<Text type='secondary'>(alt+s)</Text>
      </Button>
    </div>
  )
}

export default SelectKit
