import React, { useState } from 'react'

import { Slider } from 'antd'

const QualitySlider = () => {
  //root = document.documentElement
  var rendercontainer = document.getElementById('render-container')

  const [quality, setQuality] = useState(getComputedStyle(rendercontainer).getPropertyValue('--svg-scale'))

  const handleChange = (value) => {
    rendercontainer.style.setProperty('--svg-scale', value)
    setQuality(value)
  }

  return <Slider min={1} max={10} onChange={(value) => handleChange(value)} value={quality} />
}

export default QualitySlider
