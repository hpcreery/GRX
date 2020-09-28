import React, { useState } from 'react'

import { Checkbox, Popover, Badge, Tooltip } from 'antd'
import { BgColorsOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { SketchPicker, BlockPicker, CirclePicker } from 'react-color'

const LayerListItem = (props) => {
  const { layer, add, remove, fetchLayer } = props

  const [visible, setVisible] = useState(props.layer.visible)
  const [color, setColor] = useState('white')

  //console.log(svgContainer.childNodes.item(props.layer.name).style.color)
  const handleChange = async (value) => {
    const svgElement = document.getElementById(layer.name)
    console.log(svgElement)
    console.log(layer)
    if (value === true) {
      var data = await fetchLayer(layer)
      add(...data, svgElement)
    } else if (value === false) {
      remove(layer)
    }
    props.layer.visible = value
    setVisible(value)
  }

  const handleColorChange = (color, event) => {
    const svgElement = document.getElementById(layer.name)
    console.log(color)
    console.log(svgElement)
    console.log(getComputedStyle(svgElement).getPropertyValue('color'))
    svgElement.style.color = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, 0.7)`
    setColor(color.hex)
  }

  return (
    <div style={{ width: '100%' }}>
      <Checkbox checked={visible} onChange={(value) => handleChange(value.target.checked)} style={{ width: '90%' }}>
        <Tooltip placement='right' title={layer.name}>
          {layer.name.substring(0, 12)}
        </Tooltip>
      </Checkbox>

      <Popover
        content={<CirclePicker onChange={(color, event) => handleColorChange(color, event)} />}
        title='ColorPicker'
        placement='right'
        trigger='click'
      >
        <Badge color={color} />
      </Popover>
    </div>
  )
}

export default LayerListItem
