import React from 'react'
import '../App.css'
import BasicFrag from '../shaders/ReBasic.frag'
import BasicVert from '../shaders/ReBasic.vert'
import CircleFrag from '../shaders/Circle.frag'
import CircleVert from '../shaders/Circle.vert'
import regl from 'regl'
import { Viewport as VirtualViewport } from '@hpcreery/pixi-viewport'
import { mat3, mat4, vec2, vec3 } from "gl-matrix";

// const PREREGL = regl()

function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  const N = 50 // N triangles on the width, N triangles on the height.
  console.log('render')


  var transform = mat3.create();
  mat3.identity(transform);
  var identity = mat3.create();
  mat3.identity(identity);
  var scale = 1
  var postion = vec2.create()
  var dragging = false
  function updateTransform(x: number, y: number) {
    const s = scale
    mat3.projection(transform, reglRef.current.clientWidth, reglRef.current.clientHeight);
    mat3.translate(transform, transform, [x, y]);
    mat3.scale(transform, transform, [s, s]);
    mat3.translate(transform, transform, [
      reglRef.current.clientWidth / 2,
      reglRef.current.clientHeight / 2
    ]);
    mat3.scale(transform, transform, [
      reglRef.current.clientWidth / 2,
      reglRef.current.clientHeight / 2
    ]);
    mat3.scale(transform, transform, [1, -1]);

    // Fix apsect ratio
    // const aspect = reglRef.current.clientWidth / reglRef.current.clientHeight
    // mat3.scale(transform, transform, [1, -aspect])
    // console.log(transform)
  }

  function scaleAtPoint(x: number, y: number, s: number) {
    let newscale = scale - s / (1000 / scale / 2)
    let scaleby = newscale / scale
    if (newscale < 0.01) {
      newscale = 0.01
      scaleby = newscale / scale
      scale = newscale
    } else if (newscale > 10) {
      newscale = 10
      scaleby = newscale / scale
      scale = newscale
    } else {
      scale = newscale
    }
    postion[0] = x - (x - postion[0]) * scaleby;
    postion[1] = y - (y - postion[1]) * scaleby;
    updateTransform(postion[0], postion[1])
  }


  React.useEffect(() => {
    const REGL = regl({
      container: reglRef.current,
      extensions: ['angle_instanced_arrays']
    })

    const instanceOffset = REGL.buffer(
      Array(N * N).fill(0).map((_, i) => {
        var x = -1 + 2 * Math.random() + 0.1
        var y = -1 + 2 * Math.random() + 0.1
        return [x, y]
      }))

    const draw = REGL({
      frag: `
      precision mediump float;

      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }`,

      vert: `
      precision mediump float;

      attribute vec2 position;

      // These three are instanced attributes.
      attribute vec3 color;
      attribute vec2 offset;
      attribute float index;

      // This is a static uniform.
      uniform mat3 transform;
      uniform vec2 resolution;
      varying vec3 vColor;


      void main() {
        float aspect = resolution.x / resolution.y;

        // vec3 final = transform * vec3(position + offset, 1);
        // fix apsect ratio
        vec3 final = transform * vec3(vec2(position.x + offset.x, (position.y + offset.y) * aspect), 1);
        gl_Position = vec4(final.xy, index, 1);

        vColor = color;
      }`,

      cull: {
        enable: true,
        face: 'front'
      },

      depth: {
        enable: true,
        mask: true,
        func: 'less',
        range: [0, 1]
      },

      uniforms: {
        // This is a static uniform.
        transform: (context, props: any) => transform,
        resolution: (context, props: any) => [context.viewportWidth, context.viewportHeight],
      },

      attributes: {
        position: [
          [-0.1, -0.1],
          [+0.1, -0.1],
          [-0.1, +0.1],
          [+0.1, +0.1],
          [-0.1, -0.1],
          [+0.1, -0.1],
        ],

        index: {
          buffer: REGL.buffer(
            Array(N * N).fill(0).map((_, i) => {
              return i / (N * N)
            }
            )),
          divisor: 1 // one separate scale for every triangle
        },

        offset: {
          buffer: instanceOffset,
          divisor: 1 // one separate offset for every triangle.
        },

        color: {
          buffer: REGL.buffer(
            Array(N * N).fill(0).map((_, i) => {
              var r = Math.floor(i / N) / N
              var g = (i % N) / N
              return [r, g, r * g + 0.9]
            })),
          divisor: 1 // one separate color for every triangle
        },
      },

      // Every triangle is just three vertices.
      // However, every such triangle are drawn N * N times,
      // through instancing.
      primitive: 'triangle strip',
      // primitive: 'line strip',
      count: 6,
      offset: 0,
      // frontFace: 'cw',
      instances: N * N
    })

    // const tick = REGL.frame(function () {
    //   REGL.clear({
    //     color: [0, 0, 0, 1]
    //   })


    draw()

    reglRef.current.onwheel = (e) => {
      scaleAtPoint(e.clientX, e.clientY, e.deltaY)
      draw()
    }

    reglRef.current.onmousedown = (e) => {
      dragging = true
    }

    reglRef.current.onmouseup = (e) => {
      dragging = false
    }

    reglRef.current.onmousemove = (e) => {
      if (!dragging) return
      postion[0] += e.movementX
      postion[1] += e.movementY
      updateTransform(postion[0], postion[1])
      draw()
    }

    // reglRef.current.onresize = (e) => {
    //   console.log(e)
    // }
    // (entries: ResizeObserverEntry[], observer: ResizeObserver): void
    const resize = (entries: ResizeObserverEntry[], observer: ResizeObserver): void => {
      REGL.poll()
      updateTransform(postion[0], postion[1])
      // REGL.resize()
      // console.log(entries[0].contentRect)
      // console.log(reglRef.current.clientWidth)
      draw()
    }

    new ResizeObserver(resize).observe(reglRef.current)

    // When we are done, we can unsubscribe by calling cancel on the callback
    return () => {
      // tick.cancel()
      REGL.destroy()
      reglRef.current.onwheel = null
      reglRef.current.onmousedown = null
      reglRef.current.onmouseup = null
      reglRef.current.onmousemove = null
      reglRef.current.onresize = null
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
