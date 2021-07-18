import React, { useState, useContext } from 'react'
import { DrawBoardContext } from '../Renderer'

import { Slider, Col, Row } from 'antd'
import { FormatPainterOutlined } from '@ant-design/icons'

const QualitySlider = () => {
  const { rendercontainer } = useContext(DrawBoardContext)
  let renderScale
  if (rendercontainer) {
    renderScale = getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
  }
  const [quality, setQuality] = useState(renderScale)

  const handleChange = (value) => {
    rendercontainer.style.setProperty('--svg-scale', value)
    setQuality(value)
  }

  return (
    <Row style={{ margin: '5px ' }}>
      <Col flex='30px' style={{ padding: '5px' }}>
        <FormatPainterOutlined />
      </Col>
      <Col flex='auto'>
        <Slider min={1} max={10} onChange={(value) => handleChange(value)} value={quality} />
      </Col>
    </Row>
  )
}

export default QualitySlider
