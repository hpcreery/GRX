import React, { useState, useEffect } from 'react'

const MouseTacker = (props) => {
  const { object, quality, camera, render } = props
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })

  var pointer = document.createElement('h1')
  pointer.id = 'pointer'

  const handleMouseLocation = (event) => {
    var rendercontainer = document.getElementById('render-container')
    var quality = getComputedStyle(rendercontainer).getPropertyValue('--svg-scale')
    let bound = object.getBoundingClientRect()
    let position = {}
    let scale
    position.x = event.clientX - bound.left
    position.y = bound.height - event.clientY + bound.top
    const style = window.getComputedStyle(object)
    const transform = style.transform
    let mat = transform.match(/^matrix3d\((.+)\)$/)
    if (mat) {
      var prematrix = mat[1].split`, `.map((x) => +x)
      //var matrix = this.listToMatrix(prematrix, 4);
    }
    scale = prematrix[0]
    if (camera === 'orthographic') {
      console.log('(' + position.x / scale / 96 / quality + ', ' + position.y / scale / 96 / quality + ')')
      pointer.style.transform = `scale(${0.1 / scale},-${
        0.1 / scale
      }) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 25, 20, 1)`
      pointer.style.left = `${position.x / scale}px`
      pointer.style.bottom = `${-position.y / scale}px`
      pointer.innerHTML = `&#x21D6;` // (${(position.x / scale / 96 / quality).toFixed(3)}in, ${(position.y / scale / 96 / quality).toFixed(3)}in)
      console.log('set pointer to', pointer)
      setCoordinates({
        x: (position.x / scale / 96 / quality).toFixed(3),
        y: (position.y / scale / 96 / quality).toFixed(3),
      })
    }
  }

  useEffect(() => {
    // Mount and Update
    object.appendChild(pointer)
    object.addEventListener('click', handleMouseLocation)
    return () => {
      // Unmount
      object.removeChild(pointer)
      object.removeEventListener('click', handleMouseLocation)
    }
  }, [camera, quality, render])

  return <div className='coordinates'>{render(coordinates)}</div>
}

export default MouseTacker
