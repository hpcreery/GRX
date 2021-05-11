import React, { useState, useContext } from 'react'
import { DrawBoardContext } from '../Renderer'
import { Switch, Col, Row } from 'antd'
import { LoadingOutlined, VideoCameraOutlined, FormatPainterOutlined } from '@ant-design/icons'

const QualitySlider = () => {
  //root = document.documentElement
  const { rendercontainer } = useContext(DrawBoardContext)

  const [blend, setBlend] = useState(false)

  const handleBlendMode = (checked) => {
    //var variable = getComputedStyle(variableParent).getPropertyValue('--blend-mode')
    if (checked) {
      rendercontainer.style.setProperty('--blend-mode', 'color')
    } else {
      rendercontainer.style.setProperty('--blend-mode', 'normal')
    }
    setBlend(checked)
  }

  return (
    <Row style={{ margin: '5px ' }}>
      <Col flex='auto' style={{ padding: '5px' }}>
        Color Blend
      </Col>
      <Col flex='30px' style={{ padding: '5px' }}>
        <Switch size='small' checked={blend} onChange={(checked) => handleBlendMode(checked)} />
      </Col>
    </Row>
  )
}

export default QualitySlider
