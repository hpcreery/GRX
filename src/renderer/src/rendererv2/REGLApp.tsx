import React from 'react'
import '../App.css'
import SymbolFrag from '../shaders/Symbol.frag'
import SymbolVert from '../shaders/Symbol.vert'
import regl from 'regl'
import { mat2, mat2d, mat3, mat4, vec2, vec3 } from "gl-matrix";

const STANDARD_SYMBOLS = {
  Round: 0,
  Square: 1,
  Rectangle: 2,
  Rounded_Rectangle: 3,
  Chamfered_Rectangle: 4,
  Oval: 5,
  Diamond: 6,
  Octagon: 7,
  Round_Donut: 8,
  Square_Donut: 9,
  SquareRound_Donut: 10,
  Rounded_Square_Donut: 11,
  Rectange_Donut: 12,
  Rounded_Rectangle_Donut: 13,
  Oval_Donut: 14,
  Horizontal_Hexagon: 15,
  Vertical_Hexagon: 16,
  Butterfly: 17,
  Square_Butterfly: 18,
  Triangle: 19,
  Half_Oval: 20,
  Rounded_Round_Thermal: 21,
  Squared_Round_Thermal: 22,
  Square_Thermal: 23,
  Open_Cornders_Square_Thermal: 24,
  Line_Thermal: 25,
  Square_Round_Thermal: 26,
  Rectangular_Thermal: 27,
  Rectangular_thermal_Open_Corners: 28,
  Rounded_Square_Thermal: 29,
  Rounded_Square_Thermal_Open_Corners: 30,
  Rounded_Rectangular_Thermal: 31,
  Oval_Thermal: 32,
  Oblong_Thermal: 33,
  Home_Plate: 34,
  Inverted_Home_Plate: 35,
  Flat_Home_Plate: 36,
  Radiused_Inverted_Home_Plate: 37,
  Radiused_Home_Plate: 38,
  Cross: 39,
  Dogbone: 40,
  DPack: 41,
  Ellipse: 42,
  Moire: 43,
  Hole: 44,
} as const;

function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  // N == Number of Shapes ^ 2
  // 50 ~ 2,500 shapes
  // 100 ~ 10,000 shapes
  // 225 ~ 50,000 shapes
  // 320 ~ 100,000 shapes
  // 700 ~ 500,000 shapes
  // 1000 ~ 1,000,000 shapes
  const N = 300

  const FPS = 60
  const FPSMS = 1000 / FPS

  const FLOAT_SIZE = 4

  var transform = mat3.create();
  mat3.identity(transform);

  var inverseTransform = mat3.create();
  mat3.identity(inverseTransform);

  var identity = mat2d.create();
  mat2d.identity(identity);

  var dirty = true
  var scale = 1
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
    // console.log(
    //   'transform \n' +
    //   `${Math.round(transform[0] * 100) / 100}, ${Math.round(transform[1] * 100) / 100}, ${Math.round(transform[2] * 100) / 100},\n` +
    //   `${Math.round(transform[3] * 100) / 100}, ${Math.round(transform[4] * 100) / 100}, ${Math.round(transform[5] * 100) / 100},\n` +
    //   `${Math.round(transform[6] * 100) / 100}, ${Math.round(transform[7] * 100) / 100}, ${Math.round(transform[8] * 100) / 100
    //   }`
    // )

    mat3.invert(inverseTransform, transform);
    // console.log(
    //   'inverseTransform \n' +
    //   `${Math.round(inverseTransform[0] * 100) / 100}, ${Math.round(inverseTransform[1] * 100) / 100}, ${Math.round(inverseTransform[2] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[3] * 100) / 100}, ${Math.round(inverseTransform[4] * 100) / 100}, ${Math.round(inverseTransform[5] * 100) / 100},\n` +
    //   `${Math.round(inverseTransform[6] * 100) / 100}, ${Math.round(inverseTransform[7] * 100) / 100}, ${Math.round(inverseTransform[8] * 100) / 100
    //   }`
    // )
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

    // console.log(REGL.limits)

    const colorBuffer1 = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * N * 3 * FLOAT_SIZE
    })
    colorBuffer1.subdata(Array(N * N).fill(0).map((_, i) => {
      var r = Math.floor(i / N) / N
      var g = (i % N) / N
      return [r, g, r * g + 0.9]
    }))

    const NUM_PARAMETERS = 9
    const FEATURES_BUFFER = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * N * NUM_PARAMETERS * FLOAT_SIZE
    })
    FEATURES_BUFFER.subdata(Array(N * N).fill(0).map((_, i) => {
      const symbol = (i % 2) == 1 ? STANDARD_SYMBOLS.Round : STANDARD_SYMBOLS.Square // symbol
      const index = i / (N * N)// index
      const polarity = (i % 2) // polarity
      const x = 200 * Math.random() // x position
      const y = 200 * Math.random() - 100 // y position
      const width = Math.floor(i / N) / N * 0.5 // width, square side, diameter
      // const width = 2 / ((i % 2) + 1) // width, square side, diameter
      const height = width // (i % N) / N * 10 // height
      const rotation = 0 // rotation
      const mirror = 0 // mirror
      // const corner_radius = 0 // corner radius
      // const corners = 0 // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
      // const inner_dia = 0 // — Inner diameter of the shape
      // const line_width = 0 // — Line width of the shape (applies to the whole shape)
      // const angle = 0 // — Gap angle from 0 degrees
      // const gap = 0 // — Size of spoke gap
      // const num_spokes = 0 // — Number of spokes
      // const round = 0 // —r|s == 1|0 — Support for rounded or straight corners
      // const cut_size = 0 // — Size of the cut ( see corner radius )

      // LENGTH OF NUM_PARAMETERS
      return [symbol, index, polarity, x, y, width, height, rotation, mirror]
    }))

    // Uniforms extends {} = {},
    // Attributes extends {} = {},
    // Props extends {} = {},
    // OwnContext extends {} = {},
    // ParentContext extends REGL.DefaultContext = REGL.DefaultContext

    interface Uniforms {
      u_Transform: mat3,
      u_InverseTransform: mat3,
      u_Resolution: vec2,
      u_Screen: vec2,
      u_Scale: number,
      u_PixelSize: number,
      u_OutlineMode: number,
      u_Color: vec3
    }

    interface DrawProps {
      features: regl.Buffer
    }

    // interface CustomAttributeConfig extends regl.AttributeConfig {}

    type CustomAttributeConfig = Omit<regl.AttributeConfig, 'buffer'> & {
      buffer: regl.Buffer | undefined | null | false | ((context: regl.DefaultContext, props: DrawProps) => regl.Buffer) | regl.DynamicVariable<regl.Buffer>
    }

    interface Attributes {
      a_Position: vec2[],
      a_Symbol: CustomAttributeConfig,
      a_Index: CustomAttributeConfig,
      a_Polarity: CustomAttributeConfig,
      a_X: CustomAttributeConfig,
      a_Y: CustomAttributeConfig,
      a_Width: CustomAttributeConfig,
      a_Height: CustomAttributeConfig,
      a_Color: CustomAttributeConfig,
      a_Rotation: CustomAttributeConfig,
      a_Mirror: CustomAttributeConfig,
    }

    const draw = REGL<Uniforms, Attributes, DrawProps>({
      frag: SymbolFrag,

      vert: SymbolVert,

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

      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 1,
          dstRGB: 'one minus src alpha',
          dstAlpha: 1
        },
        equation: {
          rgb: 'subtract',
          alpha: 'subtract'
        },
        color: [0, 0, 0, 0]
      },

      uniforms: {
        u_Transform: () => transform,
        u_InverseTransform: () => inverseTransform,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        u_Screen: () => [window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio],
        u_Scale: () => scale,
        u_PixelSize: () => 3.9 / Math.pow(window.screen.width * window.devicePixelRatio * window.screen.height * window.devicePixelRatio, 0.5),
        u_OutlineMode: () => 0,
        u_Color: [0.5, 0, 0.9],
        ...Object.entries(STANDARD_SYMBOLS).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }), {})
      },

      attributes: {
        a_Position: () => [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, -1],
          [+1, -1],
        ],

        a_Symbol: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          // buffer: REGL.prop<DrawProps, 'features'>('features'),
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 0 * FLOAT_SIZE,
          divisor: 1
        },

        a_Index: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          // buffer: REGL.prop<DrawProps, 'features'>('features'),
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 1 * FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 2 * FLOAT_SIZE,
          divisor: 1
        },

        a_X: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 3 * FLOAT_SIZE,
          divisor: 1
        },

        a_Y: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 4 * FLOAT_SIZE,
          divisor: 1
        },

        a_Width: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 5 * FLOAT_SIZE,
          divisor: 1
        },

        a_Height: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          // buffer: REGL.prop<DrawProps, 'features'>('features'),
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 6 * FLOAT_SIZE,
          divisor: 1
        },


        a_Rotation: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          // buffer: REGL.prop<DrawProps, 'features'>('features'),
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 7 * FLOAT_SIZE,
          divisor: 1
        },

        a_Mirror: {
          // buffer: FEATURES_BUFFER,
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          // buffer: REGL.prop<DrawProps, 'features'>('features'),
          stride: NUM_PARAMETERS * FLOAT_SIZE,
          offset: 8 * FLOAT_SIZE,
          divisor: 1
        },

        a_Color: {
          buffer: colorBuffer1,
          // buffer: REGL.prop('color'),
          // buffer: (context, props: any) => props.color,
          divisor: 1 // one separate color for every triangle
        },
        // a_Polarity: (context, props: any) => props.polarity
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
      // console.log(scale)
      if (!dirty && !force) return
      dirty = false
      // REGL.clear({
      //   color: [0, 0, 0, 1],
      //   depth: 1
      // })
      draw({
        features: FEATURES_BUFFER,
      })
      // REGL.clear({
      //   depth: 1,
      // })
      setTimeout(() => dirty = true, FPSMS)
    }

    // REGL.clear({
    //   color: [0, 0, 0, 1],
    //   depth: 1
    // })
    scaleAtPoint(0, 0, scale)
    draw({
      features: FEATURES_BUFFER,
    })

    function randomizeColorBuffer1() {
      // grab random color index
      const colorIndex = Math.floor(Math.random() * N * N) * 3 * FLOAT_SIZE
      // grab random color
      const color = [Math.random(), Math.random(), Math.random()]
      // const color = [1, 0, 0]
      // set color
      colorBuffer1.subdata(color, colorIndex)
      redraw()
      setTimeout(randomizeColorBuffer1, 1000 / 1000)
    }

    // randomizeColorBuffer1()


    function toss() {
      if (velocity[0] === 0 && velocity[1] === 0) return
      if (dragging) return
      vec2.add(postion, postion, velocity)
      vec2.scale(velocity, velocity, 0.95)
      updateTransform(postion[0], postion[1])
      redraw(true)
      if (Math.abs(velocity[0]) < 0.05 && Math.abs(velocity[1]) < 0.05) {
        velocity[0] = 0
        velocity[1] = 0
      } else {
        setTimeout(toss, FPSMS)
      }
    }

    reglRef.current.onwheel = (e) => {
      scaleAtPoint(e.clientX, e.clientY, e.deltaY)
      redraw()
    }

    reglRef.current.onmousedown = (_e) => {
      dragging = true
    }

    reglRef.current.onmouseup = (_e) => {
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

    const resize = (): void => {
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
