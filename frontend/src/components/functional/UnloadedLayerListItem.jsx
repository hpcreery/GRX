import React, { useState, useEffect } from 'react'

import { Checkbox, Popover, Badge, Tooltip, Row, Col } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { SliderPicker } from 'react-color'

const LayerListItem = (props) => {
  let { layer, add, remove, fetchLayer } = props
  const [visible, setVisible] = useState(props.layer.visible)
  const [color, setColor] = useState('#FFFFFF')

  const handleChange = async (value) => {
    let svgElement = document.getElementById(layer.name)
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
    let svgElement = document.getElementById(layer.name)
    svgElement.style.color = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, 0.7)`
    setColor(color.hex)
  }

  useEffect(() => {
    console.log('Effect')
    console.log(layer.name)
    let svgElement = document.getElementById(layer.name)
    let waitForElement = () => {
      if (svgElement !== null) {
        setColor(getComputedStyle(svgElement).getPropertyValue('color'))
      } else {
        svgElement = document.getElementById(layer.name)
        setTimeout(waitForElement, 250)
      }
    }
    waitForElement()
  }, [props.layer.name]) // props.layer.name is erroring isn eslint??
  // React Hook useEffect has a missing dependency: 'layer.name'. Either include it or remove the dependency array.eslintreact-hooks/exhaustive-deps

  return (
    <div style={{ width: '100%' }}>
      <Row wrap={false}>
        <Col flex="10px">
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
        </Col>
        <Col flex="auto">
          <Checkbox style={{ whiteSpace: 'pre' }} checked={visible} onChange={(value) => handleChange(value.target.checked)}>
            <Tooltip placement='right' title={layer.name}>
              {layer.name}
            </Tooltip>
          </Checkbox>
        </Col>
      </Row>
    </div>
  )
}

export default LayerListItem
