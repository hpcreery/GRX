import React from 'react'
import '../App.css'
import BasicFrag from '../shaders/Basic.frag'
import BasicVert from '../shaders/Basic.vert'

function GlApp() {
  const canvasRef = React.useRef<HTMLCanvasElement>(document.createElement('canvas'))

  React.useEffect(() => {
    const canvas = canvasRef.current
    // const ctx = canvas.getContext('2d')
    // if (!ctx) return
    // ctx.clearRect(0, 0, window.innerHeight, window.innerWidth)
    const gl = canvas.getContext('webgl')
    if (!gl) return
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, BasicVert)
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, BasicFrag)
    if (!vertexShader || !fragmentShader) return
    var program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return
    var positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    var positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    // three 2d points
    var positions = [0, 0, 0, 0.5, 0.7, 0]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2 // 2 components per iteration
    var type = gl.FLOAT // the data is 32bit floats
    var normalize = false // don't normalize the data
    var stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0 // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

    var primitiveType = gl.TRIANGLES
    var offset = 0
    var count = 3
    gl.drawArrays(primitiveType, offset, count)
  }, [])

  function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    var shader = gl.createShader(type)
    if (!shader) return
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (success) {
      return shader
    }

    console.log(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return
  }

  function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    var program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    var success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (success) {
      return program
    }

    console.log(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return
  }

  function handleCanvasClick(e) {
    const glX = (e.clientX / window.innerWidth) * 2 - 1
    const glY = -((e.clientY / window.innerHeight) * 2 - 1)
    console.log(glX, glY)
  }

  return (
    <canvas
      ref={canvasRef}
      id="glcanvas"
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleCanvasClick}
    ></canvas>
  )
}

export default GlApp
