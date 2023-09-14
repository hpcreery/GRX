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
  width: 1,
  height: 2,
  rotation: 3,
  mirror: 4,
  corner_radius: 5,
  corners: 6,
  outer_dia: 7,
  inner_dia: 8,
  line_width: 9,
  angle: 10,
  gap: 11,
  num_spokes: 12,
  round: 13,
  cut_size: 14,
} as const;

function REGLApp(): JSX.Element {
  const reglRef = React.useRef<HTMLDivElement>(document.createElement('div'))

  // N == Number of Shapes
  const N = 9000

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

    const NUM_PAD_RECORD_PARAMETERS = 8
    const PAD_RECORDS_ARRAY = Array(N * NUM_PAD_RECORD_PARAMETERS).fill(0).map((_, i) => {
      // index of feature
      const index = i / (N)
      // Center point.
      const x = Math.random() * 100
      const y = Math.random() * 100
      // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
      // const sym_num = STANDARD_SYMBOLS.Square
      const sym_num = i
      // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
      const resize_factor = 0
      // Polarity. 0 = negative, 1 = positive
      const polarity = 1
      // Pad orientation (degrees)
      const rotation = 0
      // 0 = no mirror, 1 = mirror
      const mirror = 0
      return [index, x, y, sym_num, resize_factor, polarity, rotation, mirror]
    })

    const PAD_RECORDS_BUFFER = REGL.buffer({
      usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: N * NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
      data: PAD_RECORDS_ARRAY
    })
    // console.log(FEATURES_BUFFER.length)

    // const NUM_LINE_PARAMETERS = 7
    // const LINE_RECORDS_ARRAY = Array(N).fill(0).map((_, i) => {
    //   // index of feature
    //   const index = i / (N)
    //   // Start point.
    //   const x1 = Math.random()
    //   const y1 = Math.random()
    //   // End point.
    //   const x2 = Math.random()
    //   const y2 = Math.random()
    //   // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
    //   const sym_num = STANDARD_SYMBOLS.Square
    //   // Polarity. 0 = negative, 1 = positive
    //   const polarity = 1
    //   return [index, x1, y1, x2, y2, sym_num, polarity]
    // })

    // const LINE_RECORDS_BUFFER = REGL.buffer({
    //   usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
    //   type: 'float',
    //   length: N * NUM_LINE_PARAMETERS * FLOAT_SIZE,
    //   data: LINE_RECORDS_ARRAY
    // })

    // const NUM_ARC_PARAMETERS = 10
    // const ARC_RECORDS_ARRAY = Array(N).fill(0).map((_, i) => {
    //   // index of feature
    //   const index = i / (N)
    //   // Start point.
    //   const x1 = Math.random()
    //   const y1 = Math.random()
    //   // End point.
    //   const x2 = Math.random()
    //   const y2 = Math.random()
    //   // Center point.
    //   const x = Math.random()
    //   const y = Math.random()
    //   // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
    //   const sym_num = STANDARD_SYMBOLS.Square
    //   // Polarity. 0 = negative, 1 = positive
    //   const polarity = 1
    //   // Clockwise. 0 = counterclockwise, 1 = clockwise
    //   const clockwise = 0
    //   return [index, x1, y1, x2, y2, x, y, sym_num, polarity, clockwise]
    // })

    // const ARC_RECORDS_BUFFER = REGL.buffer({
    //   usage: 'dynamic',  // give the WebGL driver a hint that this buffer may change
    //   type: 'float',
    //   length: N * NUM_ARC_PARAMETERS * FLOAT_SIZE,
    //   data: ARC_RECORDS_ARRAY
    // })


    const NUM_SYMBOL_PARAMETERS = 13
    // const MAX_TEXTURE_SIZE = REGL.limits.maxTextureSize

    const NEW_ARRAY = new Float32Array(N * NUM_SYMBOL_PARAMETERS).map((_, i) => {
      switch (i % NUM_SYMBOL_PARAMETERS) {
        case PARAMETERS.symbol: return (Math.ceil(i / NUM_SYMBOL_PARAMETERS) % 2) == 1 ? STANDARD_SYMBOLS.Triangle : STANDARD_SYMBOLS.Rounded_Round_Thermal // symbol
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

    // console.log(LOOKUP_BUFFER.length)


    // const FEATURES_NDARRAY = ndarray(NEW_ARRAY, [NUM_PARAMETERS, N])
    // console.log(FEATURES_NDARRAY)
    const FEATURES_TEXTURE = REGL.texture({
      width: NUM_SYMBOL_PARAMETERS,
      height: N,
      type: 'float',
      format: 'luminance',
      data: NEW_ARRAY,
    })
    // console.log(FEATURES_NDARRAY)
    console.log(FEATURES_TEXTURE.width, FEATURES_TEXTURE.height)

    interface DrawProps {
      features: regl.Buffer
      symbols: regl.Texture2D
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

    // [index, x, y, sym_num, resize_factor, polarity, rotation, mirror]
    interface Attributes {
      a_Color: CustomAttributeConfig,
      a_SymNum: CustomAttributeConfig,
      a_Position: vec2[],
      a_X: CustomAttributeConfig,
      a_Y: CustomAttributeConfig,
      a_ResizeFactor: CustomAttributeConfig,
      // a_Symbol: CustomAttributeConfig,
      a_Index: CustomAttributeConfig,
      a_Polarity: CustomAttributeConfig,
      // a_Location: CustomAttributeConfig,
      a_Rotation: CustomAttributeConfig,
      a_Mirror: CustomAttributeConfig,
      // a_Width: CustomAttributeConfig,
      // a_Height: CustomAttributeConfig,
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
        u_Features: (_context: regl.DefaultContext, props: DrawProps) => props.symbols,
        u_FeaturesDimensions: (_context: regl.DefaultContext, props: DrawProps) => [props.symbols.width, props.symbols.height],
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



        // [index, x, y, sym_num, resize_factor, polarity, rotation, mirror]
        // a_Symbol: {
        //   buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
        //   stride: NUM_PARAMETERS * FLOAT_SIZE,
        //   offset: 0 * FLOAT_SIZE,
        //   divisor: 1,
        // },

        a_Index: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 0 * FLOAT_SIZE,
          divisor: 1
        },

        a_X: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 1 * FLOAT_SIZE,
          divisor: 1
        },

        a_Y: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 2 * FLOAT_SIZE,
          divisor: 1
        },

        a_SymNum: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 3 * FLOAT_SIZE,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 4 * FLOAT_SIZE,
          divisor: 1
        },

        a_Polarity: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 5 * FLOAT_SIZE,
          divisor: 1
        },

        a_Rotation: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 6 * FLOAT_SIZE,
          divisor: 1
        },

        a_Mirror: {
          buffer: (_context: regl.DefaultContext, props: DrawProps) => props.features,
          stride: NUM_PAD_RECORD_PARAMETERS * FLOAT_SIZE,
          offset: 7 * FLOAT_SIZE,
          divisor: 1
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
        symbols: FEATURES_TEXTURE,
        features: PAD_RECORDS_BUFFER
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
      symbols: FEATURES_TEXTURE,
      features: PAD_RECORDS_BUFFER
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
