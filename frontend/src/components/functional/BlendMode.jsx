import React, { useState } from 'react'

import { Switch, Col, Row } from 'antd'
import { LoadingOutlined, VideoCameraOutlined, FormatPainterOutlined } from '@ant-design/icons'

const QualitySlider = () => {
  //root = document.documentElement
  var variableParent = document.getElementById('render-container')

  const [blend, setBlend] = useState(false)

  const handleBlendMode = (checked) => {
    //var variable = getComputedStyle(variableParent).getPropertyValue('--blend-mode')
    if (checked) {
      variableParent.style.setProperty('--blend-mode', 'color')
    } else {
      variableParent.style.setProperty('--blend-mode', 'normal')
    }
    setBlend(checked)
  }

  return (
    <Row style={{ margin: '5px ' }}>
      <Col span={18} style={{ padding: '5px' }}>
        Color Blend
      </Col>
      <Col span={6} style={{ padding: '5px' }}>
        <Switch size='small' checked={blend} onChange={(checked) => handleBlendMode(checked)} />
      </Col>
    </Row>
  )
}

export default QualitySlider
