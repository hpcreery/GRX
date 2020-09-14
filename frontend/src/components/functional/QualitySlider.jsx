import React, { useState } from 'react'

import { Slider } from 'antd'

function QualitySlider() {
  root = document.documentElement

  const [quality, setQuality] = useState(getComputedStyle(root).getPropertyValue('--svg-scale'))

  function handleChange(value) {
    root.style.setProperty('--svg-scale', value)
    setQuality(value)
  }

  return <Slider min={1} max={10} onChange={(value) => handleChange(value)} value={quality} />
}

export default QualitySlider
