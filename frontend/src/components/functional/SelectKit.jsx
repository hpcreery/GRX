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
        string += ` ${array[i].nodeName.toUpperCase()}: ${(array[i].value / 1000).toFixed(5)}${units}`
      }
    }
    return string
  }

  const objectSelectionKit = () => {
    let oldDrawContainerNodes = drawContainer.childNodes[0]
    drawContainer.removeChild(oldDrawContainerNodes)
    //let svgContainer = document.getElementById('svg-container')
    //let divLayer = a // divLayer.id = layer.name
    //var svgChildElement = divLayer.childNodes[0]
    var svgChildElement = svgContainer.querySelector('div > svg') // Literally gets first SVG... Need way to select or tell what layer ...
    let defs = svgChildElement.querySelectorAll('defs > *')
    let svgElements = svgChildElement.querySelectorAll('g > *')
    var widthattr = svgChildElement.getAttribute('width')
    var units = widthattr.slice(-2)

    // let old_element = svgChildElement
    let svgChildElementClone = svgChildElement.cloneNode(true)

    // Get Defs or Features in SVG
    let defList = []
    defs.forEach((node) => {
      defList.push({ id: node.id, type: node.nodeName, attributes: node.attributes })
    })
    console.log(defList)

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
          //console.log(pad)
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
        //console.log(e.target.nodeName)
        //let attributes = deriveNodeAttributes(g.shape.attributes)
        info.innerHTML = g
          ? g.g == 'path'
            ? g.lineWidth == '0'
              ? `SURFACE`
              : `LINE | Width: ${g.lineWidth / 1000}${units}`
            : `PAD | Shape: ${
                g.shape.type == 'g'
                  ? `SPECIAL | X: ${(g.x / 1000).toFixed(5)}${units} Y: ${(g.y / 1000).toFixed(5)}${units}`
                  : `${g.shape.type.toUpperCase()}  | X: ${(g.x / 1000).toFixed(5)}${units} Y: ${(g.y / 1000).toFixed(
                      5
                    )}${units} | ${deriveNodeAttributes(g.shape.attributes, units)}`
              }`
          : 'NA'
        g ? infoBar.replaceChild(info, oldInfo) : ''
      }

      node.onmouseleave = (e) => {
        e.target.style.color = initColor
      }
    })

    let escape = (e) => {
      if (e.key == 'Escape') {
        drawContainer.appendChild(oldDrawContainerNodes)
        svgChildElement.parentNode.replaceChild(svgChildElementClone, svgChildElement)
      }
    }
    document.addEventListener('keydown', escape, { once: true })
    // svgContainer.onclick = (e) => {
    //   if (drawContainer.innerHTML != '') {
    //     return
    //   }
    //   e.target.style.color = '#08979c'
    //   var old_element = svgChildElement
    //   var new_element = old_element.cloneNode(true)
    //   old_element.parentNode.replaceChild(new_element, old_element)
    // }
  }

  let doc_keyDown = (e) => {
    if (e.altKey && e.code === 'KeyS') {
      objectSelectionKit()
    }
  }

  const setUpKeyboardEvents = () => {}

  useEffect(() => {
    document.addEventListener('keydown', doc_keyDown, false)
    return function cleanup() {
      document.removeEventListener('keydown', doc_keyDown, false)
    }
  })

  return (
    <div>
      <Button type='text' style={{ width: '100%' }} onClick={() => objectSelectionKit()}>
        Select&#160;<Text type='secondary'>(alt+s)</Text>
      </Button>
    </div>
  )
}

export default SelectKit
