import React, { useState } from 'react'

import { Slider, Col, Row } from 'antd'
import { LoadingOutlined, VideoCameraOutlined, FormatPainterOutlined } from '@ant-design/icons'

const QualitySlider = () => {
  //root = document.documentElement
  var rendercontainer = document.getElementById('render-container')

  const [quality, setQuality] = useState(getComputedStyle(rendercontainer).getPropertyValue('--svg-scale'))

  const handleChange = (value) => {
    // getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
    // getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
    rendercontainer.style.setProperty('--svg-scale', value)
    setQuality(value)
  }

  return (
    <Row style={{ margin: '5px ' }}>
      <Col span={4} style={{ padding: '5px' }}>
        <FormatPainterOutlined />
      </Col>
      <Col span={20}>
        <Slider min={1} max={10} onChange={(value) => handleChange(value)} value={quality} />
      </Col>
    </Row>
  )
}

export default QualitySlider
