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

  // 225 ~ 100,000 triangles ~ 50,000 shapes
  // 700 ~ 1,000,000 triangles ~ 500,000 shapes
  const N = 50 // N triangles on the width, N triangles on the height.
  console.log('render')


  var transform = mat3.create();
  mat3.identity(transform);
  var identity = mat3.create();
  mat3.identity(identity);

  var dirty = true
  var scale = 0.1
  var postion = vec2.create()
  var velocity = vec2.create()
  var dragging = false


  function updateTransform(x: number, y: number) {
    // http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
    const s = scale
    const { width, height } = reglRef.current.getBoundingClientRect()
    mat3.projection(transform, width, height);
    mat3.translate(transform, transform, [x, y]);
    mat3.scale(transform, transform, [s, s]);
    mat3.translate(transform, transform, [width / 2, height / 2]);
    mat3.scale(transform, transform, [width / 2, - height / 2]);
    // mat3.scale(transform, transform, [1, -1]);

    // Fix apsect ratio, done in shader
    // const aspect = width / height
    // mat3.scale(transform, transform, [1, -aspect])
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

    const offsetBuffer1 = REGL.buffer(
      Array(N * N).fill(0).map((_, i) => {
        var x = 20 * Math.random() - 1
        var y = -20 * Math.random() + 1
        return [x, y]
      }))

    const offsetBuffer2 = REGL.buffer(
      Array(N * N).fill(0).map((_, i) => {
        var x = 20 * Math.random() - 1
        var y = -20 * Math.random() + 1
        return [x, y]
      }))

    const colorBuffer1 = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * N * 3 * 4
    })
    colorBuffer1.subdata(Array(N * N).fill(0).map((_, i) => {
      var r = Math.floor(i / N) / N
      var g = (i % N) / N
      return [r, g, r * g + 0.9]
    }))

    const colorBuffer2 = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * N * 3 * 4
    })
    colorBuffer2.subdata(Array(N * N).fill(0))
    // .map((_, i) => {
    //   return [0,0,0]
    // }))

    var dimBuffer = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * N * 2 * 4
    })
    dimBuffer.subdata(Array(N * N).fill(0).map((_, i) => {
      // number from 0-10
      var w = Math.floor(i / N) / N * 10
      var h = (i % N) / N * 10
      return [w, w]
    }))
    // var colorBuffer = REGL.buffer(
    //   Array(N * N).fill(0).map((_, i) => {
    //     var r = Math.floor(i / N) / N
    //     var g = (i % N) / N
    //     return [r, g, r * g + 0.9]
    //   }))

    const draw = REGL({
      frag: `
      precision mediump float;

      varying vec3 vColor;
      varying vec2 vCenter;
      varying float vRadius;
      varying vec2 vPosition;

      void main() {
        // if color is black, draw transparent
        float alpha = 1.0;
        if (vColor.r == 0.0, vColor.g == 0.0, vColor.b == 0.0) {
          alpha = 0.0;
        }
        // draw a circle
        float d = distance(vPosition, vCenter);
        if (d > vRadius) {
          discard;
        }
        gl_FragColor = vec4(vColor, alpha);
      }`,

      vert: `
      precision mediump float;

      attribute vec2 position;

      // These three are instanced attributes.
      attribute vec3 color;
      attribute vec2 offset;
      attribute float index;
      attribute vec2 dim;

      // This is a static uniform.
      uniform mat3 transform;
      uniform vec2 resolution;
      uniform float scale;

      varying vec3 vColor;
      varying vec2 vCenter;
      varying float vRadius;
      varying vec2 vPosition;
      varying float vAspect;
      varying float vScale;

      void main() {

        float aspect = resolution.y / resolution.x;
        vec2 finaldim = position * dim;
        vec3 final = transform * vec3(vec2((finaldim.x + offset.x) * aspect, (finaldim.y + offset.y)), 1);

        vec2 finalcenter = vec2(0, 0) * dim;
        vec3 finalcenter3 = transform * vec3(vec2((finalcenter.x + offset.x) * aspect, (finalcenter.y + offset.y)), 1);

        vColor = color;
        vRadius = (dim.x / 2.0) * scale * 0.2;
        vCenter = vec2(finalcenter3.x / aspect, finalcenter3.y);
        vPosition = vec2(final.x / aspect, final.y);

        gl_Position = vec4(final.xy, index, 1);

      }`,

      // blend: {
      //   enable: true,
      //   func: {
      //     srcRGB: 'src alpha',
      //     srcAlpha: 1,
      //     dstRGB: 'one minus src alpha',
      //     dstAlpha: 1
      //   },
      //   equation: {
      //     rgb: 'add',
      //     alpha: 'subtract'
      //   },
      //   color: [0, 0, 1, 1]
      // },

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
        transform: () => transform,
        resolution: (context) => [context.viewportWidth, context.viewportHeight],
        scale: () => scale,
      },

      attributes: {
        position: () => [
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
          // buffer: offsetBuffer1,
          // buffer: REGL.prop('offset'),
          buffer: (context, props: any) => props.offset,
          divisor: 1 // one separate offset for every triangle.
        },

        color: {
          // buffer: colorBuffer1,
          // buffer: REGL.prop('color'),
          buffer: (context, props: any) => props.color,
          divisor: 1 // one separate color for every triangle
        },

        dim: {
          buffer: dimBuffer,
          divisor: 1 // one dim for every triangle
        }
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: N * N
    })

    // const tick = REGL.frame(function () {
    //   REGL.clear({
    //     color: [0, 0, 0, 1]
    //   })

    function redraw(force: boolean = false) {
      if (!dirty && !force) return
      dirty = false
      // REGL.clear({
      //   color: [0, 0, 0, 1],
      //   depth: 1
      // })
      draw([
        {
          offset: offsetBuffer1,
          color: colorBuffer1
        },
        {
          offset: offsetBuffer2,
          color: colorBuffer2
        }
      ])
      setTimeout(() => dirty = true, 1000 / 120)
    }

    // REGL.clear({
    //   color: [0, 0, 0, 1],
    //   depth: 1
    // })
    scaleAtPoint(0, 0, scale)
    draw({
      offset: offsetBuffer1,
      color: colorBuffer1
    })
    draw({
      offset: offsetBuffer2,
      color: colorBuffer2
    })

    reglRef.current.onwheel = (e) => {
      scaleAtPoint(e.clientX, e.clientY, e.deltaY)
      redraw()
    }

    reglRef.current.onmousedown = (e) => {
      dragging = true
    }

    function randomizeColors() {
      // grab random color index
      const colorIndex = Math.floor(Math.random() * N * N) * 3 * 4
      // grab random color
      const color = [Math.random(), Math.random(), Math.random()]
      // const color = [1, 0, 0]
      // set color
      colorBuffer1.subdata(color, colorIndex)
      redraw()
      setTimeout(randomizeColors, 1000 / 1000)
    }

    // randomizeColors()





    function toss() {
      if (velocity[0] === 0 && velocity[1] === 0) return
      if (dragging) return
      vec2.add(postion, postion, velocity)
      vec2.scale(velocity, velocity, 0.9)
      updateTransform(postion[0], postion[1])
      redraw(true)
      // // REGL.clear({
      // //   color: [0, 0, 0, 1],
      // //   depth: 1
      // // })
      // draw({
      //   offset: offsetBuffer1,
      //   color: colorBuffer1
      // })
      // draw({
      //   offset: offsetBuffer2,
      //   color: colorBuffer2
      // })
      if (Math.abs(velocity[0]) < 0.05 && Math.abs(velocity[1]) < 0.05) {
        velocity[0] = 0
        velocity[1] = 0
      } else {
        setTimeout(toss, 1000 / 120)
      }
    }

    reglRef.current.onmouseup = (e) => {
      dragging = false
      toss()
    }


    reglRef.current.onmousemove = (e) => {
      if (!dragging) return
      velocity = [e.movementX, e.movementY]
      vec2.add(postion, postion, velocity)
      updateTransform(postion[0], postion[1])
      redraw()
    }

    const resize = (entries: ResizeObserverEntry[], observer: ResizeObserver): void => {
      REGL.poll()
      updateTransform(postion[0], postion[1])
      redraw(true)
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
