import REGL from 'regl'
import { vec3 } from 'gl-matrix'

export default class Layer {
  public visible = true
  public name = ''
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public pads: REGL.Buffer
  public qtyPads: number
  public lines: REGL.Buffer
  public qtyLines: number
  public arcs: REGL.Buffer
  public qtyArcs: number
  public symbols: REGL.Texture2D
  public framebuffer: REGL.Framebuffer2D
  constructor(
    props: Pick<Layer, 'name' | 'pads' | 'lines' | 'arcs' | 'symbols' | 'qtyPads' | 'qtyLines' | 'qtyArcs' | 'framebuffer'>
  ) {
    this.name = props.name
    this.pads = props.pads
    this.qtyPads = props.qtyPads
    this.lines = props.lines
    this.qtyLines = props.qtyLines
    this.arcs = props.arcs
    this.qtyArcs = props.qtyArcs
    this.symbols = props.symbols
    this.framebuffer = props.framebuffer
  }
}
