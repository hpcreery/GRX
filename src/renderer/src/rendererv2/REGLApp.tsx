import React from 'react'
import '../App.css'
import BasicFrag from '../shaders/ReBasic.frag'
import BasicVert from '../shaders/ReBasic.vert'
import CircleFrag from '../shaders/Circle.frag'
import CircleVert from '../shaders/Circle.vert'
import regl from 'regl'

function REGLApp() {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  React.useEffect(() => {
    const REGL = regl(reglRef.current)

    const draw = REGL({
      primitive: 'points',
      frag: BasicFrag,
      vert: BasicVert,
      attributes: {
        a_position: [
          [0, -1],
          [-1, 0],
          [1, 1]
        ]
      },
      count: 3
    })

    const circle = REGL({
      // primitive: 'points',
      frag: CircleFrag,
      vert: CircleVert,
      attributes: {
        a_position: [
          [0, -1],
          [-1, 0],
          [1, 1]
        ]
      },
      count: 3,
      uniforms: {
        u_resolution: ({ viewportWidth, viewportHeight }, props) => {
          console.log(viewportWidth, viewportHeight)
          console.log(props)
          return [viewportWidth, viewportHeight]
        },
        // u_mouse: ({ pixelRatio, viewportHeight }, { y }) => [pixelRatio, viewportHeight - y],s
        u_radius: function (context, props, batchId) {
          console.log(props)
          // @ts-ignore
          return props.radius
        },
        // @ts-ignore
        u_position: (context, props, batchId) => props.position
      }
    })

    // draw()
    circle({ radius: 120.5, position: [10.5, 100.5] })
    return () => {
      REGL.destroy()
    }
  }, [])

  return (
    <div
      ref={reglRef}
      id="regl-element"
      style={{
        width: '100%',
        height: '100%'
      }}
    ></div>
  )
}

export default REGLApp
