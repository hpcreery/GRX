import React, { useState, useEffect } from 'react'

import { Checkbox, Popover, Badge, Tooltip } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { SliderPicker } from 'react-color'

const LayerListItem = (props) => {
  const [visible, setVisible] = useState(props.layer.visible)
  const [color, setColor] = useState('#FFFFFF')
  const handleChange = (value) => {
    console.log(value)
    props.layer.visible = value
    setVisible(value)
  }

  const handleColorChange = (color, event) => {
    var layerObject = document.getElementById(props.layer.name)
    layerObject.style.color = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, 0.7)`
    setColor(color.hex)
  }

  useEffect(() => {
    let svgElement = document.getElementById(props.layer.name)
    let waitForElement = () => {
      if (svgElement !== null) {
        setColor(getComputedStyle(svgElement).getPropertyValue('color'))
      } else {
        svgElement = document.getElementById(props.layer.name)
        setTimeout(waitForElement, 250)
      }
    }
    waitForElement()
  }, [props.layer.name])

  return (
    <div style={{ width: '100%' }}>
      <Checkbox checked={visible} onChange={(value) => handleChange(value.target.checked)} style={{ width: '90%' }}>
        <Tooltip placement='right' title={props.layer.name}>
          {props.layer.name.substring(0, 12)}
        </Tooltip>
      </Checkbox>
      <Popover
        content={<SliderPicker color={color} onChange={(color, event) => handleColorChange(color, event)} />}
        title={
          <div>
            <BgColorsOutlined />
            &nbsp; ColorPicker
          </div>
        }
        placement='right'
        trigger='click'
      >
        <Badge color={color} />
      </Popover>
    </div>
  )
}

export default LayerListItem
