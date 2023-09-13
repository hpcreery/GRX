import React from 'react'
import '../App.css'
import SymbolFrag from '../shaders/Symbol.frag'
import SymbolVert from '../shaders/Symbol.vert'
import regl from 'regl'
import { mat2, mat2d, mat3, mat4, vec2, vec3 } from "gl-matrix";
import ndarray from 'ndarray'
// import glsl from 'glslify'

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

const PARAMETERS = {
  symbol: 0,
  index: 1,
  polarity: 2,
  x: 3,
  y: 4,
  width: 5,
  height: 6,
  rotation: 7,
  mirror: 8,
  corner_radius: 9,
  corners: 10,
  outer_dia: 11,
  inner_dia: 12,
  line_width: 13,
  angle: 14,
  gap: 15,
  num_spokes: 16,
  round: 17,
  cut_size: 18,
} as const;

function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  // N == Number of Shapes
  const N = 2000

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

    // console.log(s)
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
      extensions: ['angle_instanced_arrays', 'OES_texture_float'],
      attributes: { antialias: false }
    })

    console.log(REGL.limits)

    const colorBuffer1 = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * 3,
      data: Array(N).fill(0).map((_, i) => {
        var r = Math.floor(i / N)
        var g = (i % N) / N
        return [r, g, r * g + 0.9]
      }
      )
    })

    const NUM_PARAMETERS = 17
    // const MAX_TEXTURE_SIZE = REGL.limits.maxTextureSize

    const NEW_ARRAY = new Float32Array(N * NUM_PARAMETERS).map((_, i) => {
      switch (i % NUM_PARAMETERS) {
        case PARAMETERS.symbol: return (Math.ceil(i / NUM_PARAMETERS) % 2) == 1 ? STANDARD_SYMBOLS.Triangle : STANDARD_SYMBOLS.Rounded_Round_Thermal // symbol
        case PARAMETERS.index: return Math.ceil(i / NUM_PARAMETERS) / N
        case PARAMETERS.polarity: return 1 //(i % 2) // polarity
        case PARAMETERS.x: return Math.random() * 20 // x position
        case PARAMETERS.y: return Math.random() * 20 // y position
        case PARAMETERS.width: return 0.5 // width, square side, diameter
        case PARAMETERS.height: return 0.5 // height
        case PARAMETERS.rotation: return 0.0 // rotation
        case PARAMETERS.mirror: return 0 // mirror
        case PARAMETERS.corner_radius: return 0.1 // corner radius
        case PARAMETERS.corners: 0//return Math.round(Math.random() * 16)//0 // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
        case PARAMETERS.outer_dia: return 0.2 // — Outer diameter of the shape
        case PARAMETERS.inner_dia: return 0.19 // — Inner diameter of the shape
        case PARAMETERS.line_width: return 0.01 // — Line width of the shape (applies to the whole shape)
        case PARAMETERS.angle: return 30 // — Angle of the spoke
        case PARAMETERS.gap: return 0.1 // — Gap angle from 0 degrees
        case PARAMETERS.num_spokes: return 4 // — Number of spokes
        // case 14: return 0 // — Gap angle from 0 degrees
        // case 15: return 0 // — Size of spoke gap
        // case 16: return 0 // — Number of spokes
        // case 17: return 0 // —r|s == 1|0 — Support for rounded or straight corners
        // case 18: return 0 // — Size of the cut ( see corner radius )
        default: return 0
      }
    })

    // const LOOKUP_ARRAY: number[][] = []
    // for (let i = 0; i < N; i++) {
    //   LOOKUP_ARRAY.push([0, i])
    //   // for (let j = 0; j < NUM_PARAMETERS; j++) {
    //   // }
    // }
    const LOOKUP_ARRAY = Array(N).fill(0).map((_, i) => i)
    console.log(LOOKUP_ARRAY)
    const LOOKUP_BUFFER = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N,
      data: LOOKUP_ARRAY
    })

    // console.log(LOOKUP_BUFFER.length)


    // const FEATURES_NDARRAY = ndarray(NEW_ARRAY, [NUM_PARAMETERS, N])
    // console.log(FEATURES_NDARRAY)
    const FEATURES_TEXTURE = REGL.texture({
      width: NUM_PARAMETERS,
      height: N,
      type: 'float',
      format: 'luminance',
      data: NEW_ARRAY,
    })
    // console.log(FEATURES_NDARRAY)
    console.log(FEATURES_TEXTURE.width, FEATURES_TEXTURE.height)

    interface DrawProps {
      features: regl.Texture2D
    }

    // interface CustomAttributeConfig extends regl.AttributeConfig {}

    type CustomAttributeConfig = Omit<regl.AttributeConfig, 'buffer'> & {
      buffer: regl.Buffer | undefined | null | false | ((context: regl.DefaultContext, props: DrawProps) => regl.Buffer) | regl.DynamicVariable<regl.Buffer>
    }

    interface Uniforms {
      u_Features: regl.Texture2D,
      u_FeaturesDimensions: vec2,
      u_Transform: mat3,
      u_InverseTransform: mat3,
      u_Resolution: vec2,
      u_Screen: vec2,
      u_Scale: number,
      u_PixelSize: number,
      u_OutlineMode: boolean,
      u_Color: vec3
    }

    interface Attributes {
      a_Position: vec2[],
      a_TexCoord: CustomAttributeConfig,
      a_Color: CustomAttributeConfig,
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
        u_Features: (_context: regl.DefaultContext, props: DrawProps) => props.features,
        u_FeaturesDimensions: (_context: regl.DefaultContext, props: DrawProps) => [props.features.width, props.features.height],
        u_Transform: () => transform,
        u_InverseTransform: () => inverseTransform,
        u_Resolution: (context) => [context.viewportWidth, context.viewportHeight],
        u_Screen: () => [window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio],
        u_Scale: () => scale,
        u_PixelSize: () => 3.6 / Math.pow(window.screen.width * window.devicePixelRatio * window.screen.height * window.devicePixelRatio, 0.5),
        u_OutlineMode: () => false,
        u_Color: [0.5, 0, 0.9],
        ...Object.entries(STANDARD_SYMBOLS).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Shapes.${key}`]: value }), {}),
        ...Object.entries(PARAMETERS).reduce((acc, [key, value]) => Object.assign(acc, { [`u_Parameters.${key}`]: value }), {})
      },

      attributes: {

        // Not a real prop, just testing
        a_Color: {
          buffer: colorBuffer1,
          // buffer: REGL.prop('color'),
          // buffer: (context, props: any) => props.color,
          divisor: 1 // one separate color for every triangle
        },

        a_Position: () => [
          [-1, -1],
          [+1, -1],
          [-1, +1],
          [+1, +1],
          [-1, -1],
          [+1, -1],
        ],

        a_TexCoord: {
          buffer: () => LOOKUP_BUFFER,
          stride: 1 * FLOAT_SIZE,
          offset: 0 * FLOAT_SIZE,
          divisor: 1,
          // size: 1
        },
      },

      primitive: 'triangle strip',
      count: 6,
      offset: 0,
      instances: N
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
        features: FEATURES_TEXTURE,
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
      features: FEATURES_TEXTURE,
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
