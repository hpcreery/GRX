import REGL from 'regl'
import * as Shapes from './shapes'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import { FeatureTypeIdentifyer, Binary } from './types'
import { MacroRenderer, StepAndRepeatRenderer } from './layer'
import onChange from 'on-change'

import PadFrag from '../shaders/src/Pad.frag'
import PadVert from '../shaders/src/Pad.vert'
import LineFrag from '../shaders/src/Line.frag'
import LineVert from '../shaders/src/Line.vert'
import ArcFrag from '../shaders/src/Arc.frag'
import ArcVert from '../shaders/src/Arc.vert'
import SurfaceFrag from '../shaders/src/Surface.frag'
import SurfaceVert from '../shaders/src/Surface.vert'

import { WorldContext } from './engine'
import { vec2 } from 'gl-matrix'

import earcut from 'earcut'

const {
  LINE_RECORD_PARAMETERS,
  PAD_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS_MAP,
  PAD_RECORD_PARAMETERS_MAP,
  ARC_RECORD_PARAMETERS_MAP
} = Shapes

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer: REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {}

interface LineUniforms {}

interface ArcUniforms {}

interface PadAttributes {
  a_SymNum: CustomAttributeConfig
  a_Location: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror_X: CustomAttributeConfig
  a_Mirror_Y: CustomAttributeConfig
}

interface LineAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
}

interface ArcAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Center_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Clockwise: CustomAttributeConfig
}

export interface PadAttachments {
  buffer: REGL.Buffer
  length: number
}

export interface ArcAttachments {
  buffer: REGL.Buffer
  length: number
}

export interface LineAttachments {
  buffer: REGL.Buffer
  length: number
}

interface SurfaceUniforms {
  u_Vertices: REGL.Texture2D
  u_VerticesDimensions: vec2
  u_QtyContours: number
  u_Index: number
  u_Polarity: number
}

interface SurfaceAttributes {
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Offset: CustomAttributeConfig
  a_Indicies: CustomAttributeConfig
  a_Vertex_Position: number[][]
  a_QtyVerts: CustomAttributeConfig
}

export interface SurfaceAttachments {
  vertices: REGL.Texture2D
  verticiesDimensions: vec2
  polarity: Binary
  index: number
  length: number
  qtyContours: number
  qtyVertsBuffer: REGL.Buffer
  indexBuffer: REGL.Buffer
  offsetBuffer: REGL.Buffer
  polarityBuffer: REGL.Buffer
  indiciesBuffer: REGL.Buffer
}

interface FrameBufferRenderUniforms {
  u_QtyFeatures: number
  u_Index: number
  u_Polarity: number
  u_RenderTexture: REGL.Framebuffer2D
}
interface FrameBufferRendeAttributes {}

export interface FrameBufferRendeAttachments {
  qtyFeatures: number
  index: number
  polarity: number
  renderTexture: REGL.Framebuffer2D
}

interface TShaderAttachment {
  pads: PadAttachments
  lines: LineAttachments
  arcs: ArcAttachments
  surfaces: SurfaceAttachments[]
  surfacesWithHoles: SurfaceAttachments[]
}

interface TReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext & WorldContext, PadAttachments> | undefined
  drawArcs: REGL.DrawCommand<REGL.DefaultContext & WorldContext, ArcAttachments> | undefined
  drawLines: REGL.DrawCommand<REGL.DefaultContext & WorldContext, LineAttachments> | undefined
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & WorldContext, SurfaceAttachments> | undefined
  drawFrameBuffer:
    | REGL.DrawCommand<REGL.DefaultContext & WorldContext, FrameBufferRendeAttachments>
    | undefined
}

export const ReglRenderers: TReglRenderers = {
  drawPads: undefined,
  drawArcs: undefined,
  drawLines: undefined,
  drawSurfaces: undefined,
  drawFrameBuffer: undefined
}

export function initializeRenderers(regl: REGL.Regl): void {
  ReglRenderers.drawPads = regl<
    PadUniforms,
    PadAttributes,
    PadAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    frag: PadFrag.replace(dynamicShapeRegex, ''),
    vert: PadVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1
      },

      a_Location: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.x * glFloatSize,
        divisor: 1
      },

      a_SymNum: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1
      },

      a_ResizeFactor: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
        divisor: 1
      },

      a_Polarity: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1
      },

      a_Rotation: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
        divisor: 1
      },

      a_Mirror_X: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_x * glFloatSize,
        divisor: 1
      },

      a_Mirror_Y: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_y * glFloatSize,
        divisor: 1
      }
    },

    instances: regl.prop<PadAttachments, 'length'>('length')
  })

  ReglRenderers.drawArcs = regl<
    ArcUniforms,
    ArcAttributes,
    ArcAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    frag: ArcFrag.replace(dynamicShapeRegex, ''),

    vert: ArcVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1
      },

      a_Start_Location: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
        divisor: 1
      },

      a_End_Location: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
        divisor: 1
      },

      a_Center_Location: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
        divisor: 1
      },

      a_SymNum: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1
      },

      a_Polarity: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1
      },

      a_Clockwise: {
        buffer: regl.prop<ArcAttachments, 'buffer'>('buffer'),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
        divisor: 1
      }
    },

    instances: regl.prop<ArcAttachments, 'length'>('length')
  })

  ReglRenderers.drawLines = regl<
    LineUniforms,
    LineAttributes,
    LineAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    frag: LineFrag.replace(dynamicShapeRegex, ''),

    vert: LineVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<LineAttachments, 'buffer'>('buffer'),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1
      },

      a_Start_Location: {
        buffer: regl.prop<LineAttachments, 'buffer'>('buffer'),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
        divisor: 1
      },

      a_End_Location: {
        buffer: regl.prop<LineAttachments, 'buffer'>('buffer'),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
        divisor: 1
      },

      a_SymNum: {
        buffer: regl.prop<LineAttachments, 'buffer'>('buffer'),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1
      },

      a_Polarity: {
        buffer: regl.prop<LineAttachments, 'buffer'>('buffer'),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1
      }
    },

    instances: regl.prop<LineAttachments, 'length'>('length')
  })

  ReglRenderers.drawSurfaces = regl<
    SurfaceUniforms,
    SurfaceAttributes,
    SurfaceAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    frag: SurfaceFrag,

    vert: SurfaceVert,

    uniforms: {
      u_Vertices: regl.prop<SurfaceAttachments, 'vertices'>('vertices'),
      u_VerticesDimensions: regl.prop<SurfaceAttachments, 'verticiesDimensions'>(
        'verticiesDimensions'
      ),
      u_QtyContours: regl.prop<SurfaceAttachments, 'qtyContours'>('qtyContours'),
      u_Index: regl.prop<SurfaceAttachments, 'index'>('index'),
      u_Polarity: regl.prop<SurfaceAttachments, 'polarity'>('polarity')
    },

    attributes: {
      a_Index: {
        buffer: regl.prop<SurfaceAttachments, 'indexBuffer'>('indexBuffer'),
        stride: 1 * glFloatSize,
        divisor: 1
      },

      a_Polarity: {
        buffer: regl.prop<SurfaceAttachments, 'polarityBuffer'>('polarityBuffer'),
        stride: 1 * glFloatSize,
        divisor: 1
      },

      a_Offset: {
        buffer: regl.prop<SurfaceAttachments, 'offsetBuffer'>('offsetBuffer'),
        stride: 1 * glFloatSize,
        divisor: 1
      },

      a_Indicies: {
        buffer: regl.prop<SurfaceAttachments, 'indiciesBuffer'>('indiciesBuffer'),
        stride: 3 * glFloatSize,
        divisor: 1
      },

      a_QtyVerts: {
        buffer: regl.prop<SurfaceAttachments, 'qtyVertsBuffer'>('qtyVertsBuffer'),
        stride: 1 * glFloatSize,
        divisor: 1
      },

      a_Vertex_Position: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    },

    cull: {
      enable: false
    },

    instances: regl.prop<SurfaceAttachments, 'length'>('length'),
    count: 3
    // primitive: 'line loop'
  })

  ReglRenderers.drawFrameBuffer = regl<
    FrameBufferRenderUniforms,
    FrameBufferRendeAttributes,
    FrameBufferRendeAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    vert: `
  precision highp float;

  uniform float u_Index;
  uniform float u_QtyFeatures;

  attribute vec2 a_Vertex_Position;

  varying float v_Index;
  varying vec2 v_UV;

  void main () {
    float Index = u_Index / u_QtyFeatures;
    v_UV = a_Vertex_Position;
    v_Index =  Index;
    gl_Position = vec4(a_Vertex_Position, Index, 1.0);
  }
`,
    frag: `
  precision highp float;

  uniform sampler2D u_RenderTexture;
  uniform float u_Polarity;
  uniform bool u_OutlineMode;

  varying vec2 v_UV;
  varying float v_Index;

  void main () {
    vec4 color = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
    if (color.r == 0.0 && color.g == 0.0 && color.b == 0.0) {
      discard;
    }
    if (u_Polarity == 0.0 && !u_OutlineMode) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
    gl_FragColor = color;
    //gl_FragColor = vec4(v_Index, 0.0, 0.0, 1.0);
  }
`,
    depth: {
      enable: true,
      mask: true,
      func: 'greater',
      range: [0, 1]
    },
    uniforms: {
      u_QtyFeatures: regl.prop<FrameBufferRendeAttachments, 'qtyFeatures'>('qtyFeatures'),
      u_RenderTexture: regl.prop<FrameBufferRendeAttachments, 'renderTexture'>('renderTexture'),
      u_Index: regl.prop<FrameBufferRendeAttachments, 'index'>('index'),
      u_Polarity: regl.prop<FrameBufferRendeAttachments, 'polarity'>('polarity')
    }
  })
}

const dynamicShapeRegex = /^#pragma dynamic_shape\(?(?<shapes>(?:\w|,)+)?\)?/gm

const { SYMBOL_PARAMETERS } = Symbols

interface shapesList {
  pads: Shapes.Pad[]
  lines: Shapes.Line[]
  arcs: Shapes.Arc[]
  surfaces: Shapes.Surface[]
  clear: () => void
}

export class ShapesShaderCollection {
  private regl: REGL.Regl
  private records: Shapes.Shape[] = []

  public symbolsCollection: SymbolShaderCollection

  public shapes: shapesList

  public shaderAttachment: TShaderAttachment

  constructor(props: { regl: REGL.Regl; records: Shapes.Shape[] }) {
    const { regl, records } = props
    this.regl = regl
    this.records = records
    this.symbolsCollection = new SymbolShaderCollection({
      regl
    })
    this.shapes = {
      pads: [],
      lines: [],
      arcs: [],
      surfaces: [],
      clear: function (): void {
        this.pads.length = 0
        this.lines.length = 0
        this.arcs.length = 0
        this.surfaces.length = 0
      }
    }
    this.shaderAttachment = {
      pads: {
        buffer: regl.buffer(0),
        length: 0
      },
      lines: {
        buffer: regl.buffer(0),
        length: 0
      },
      arcs: {
        buffer: regl.buffer(0),
        length: 0
      },
      surfaces: [],
      surfacesWithHoles: []
    }
  }

  public refresh(): this {
    this.symbolsCollection.symbols.clear()
    this.shapes.clear()

    this.shaderAttachment.surfaces.map((surface) => {
      surface.vertices.destroy()
      surface.indexBuffer.destroy()
      surface.offsetBuffer.destroy()
      surface.polarityBuffer.destroy()
      surface.indiciesBuffer.destroy()
      surface.qtyVertsBuffer.destroy()
    })
    this.shaderAttachment.surfaces.length = 0
    this.shaderAttachment.surfacesWithHoles.map((surface) => {
      surface.vertices.destroy()
      surface.indexBuffer.destroy()
      surface.offsetBuffer.destroy()
      surface.polarityBuffer.destroy()
      surface.indiciesBuffer.destroy()
      surface.qtyVertsBuffer.destroy()
    })
    this.shaderAttachment.surfacesWithHoles.length = 0

    function isGetter(obj, prop): boolean {
      const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
      if (descriptor === undefined) {
        return false
      }
      return !!Object.getOwnPropertyDescriptor(obj, prop)!['get']
    }

    function fixSymbolGetter(record: Shapes.Pad | Shapes.Line | Shapes.Arc): void {
      if (!isGetter(record, 'sym_num')) {
        Object.defineProperty(record, 'sym_num', {
          get: function (): number {
            return this.symbol.sym_num.value
          }
        })
      }
    }

    this.records.forEach((record) => {
      if (record.type === FeatureTypeIdentifyer.SURFACE) {
        this.shapes.surfaces.push(record)
      } else if (
        record.type === FeatureTypeIdentifyer.PAD &&
        record.symbol.type === FeatureTypeIdentifyer.SYMBOL_DEFINITION
      ) {
        fixSymbolGetter(record)
        this.shapes.pads.push(record)
      } else if (
        record.type === FeatureTypeIdentifyer.LINE &&
        record.symbol.type === FeatureTypeIdentifyer.SYMBOL_DEFINITION
      ) {
        fixSymbolGetter(record)
        this.shapes.lines.push(record)
      } else if (
        record.type === FeatureTypeIdentifyer.ARC &&
        record.symbol.type === FeatureTypeIdentifyer.SYMBOL_DEFINITION
      ) {
        fixSymbolGetter(record)
        this.shapes.arcs.push(record)
      } else if (record.type === FeatureTypeIdentifyer.POLYLINE) {
        drawPolyline(record, this.shapes)
      }
    })

    this.shapes.pads.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifyer.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.lines.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifyer.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.arcs.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifyer.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })

    this.symbolsCollection.refresh()

    // inverse order to render from front to back to save on overdraw
    this.shapes.pads.sort((a, b) => b.index - a.index)
    this.shapes.lines.sort((a, b) => b.index - a.index)
    this.shapes.arcs.sort((a, b) => b.index - a.index)
    this.shapes.surfaces.sort((a, b) => b.index - a.index)

    this.shaderAttachment.pads.length = this.shapes.pads.length
    this.shaderAttachment.lines.length = this.shapes.lines.length
    this.shaderAttachment.arcs.length = this.shapes.arcs.length

    this.shaderAttachment.pads.buffer(
      this.shapes.pads.map((record) => PAD_RECORD_PARAMETERS.map((key) => record[key]))
    )

    this.shaderAttachment.lines.buffer(
      this.shapes.lines.map((record) => LINE_RECORD_PARAMETERS.map((key) => record[key]))
    )
    this.shaderAttachment.arcs.buffer(
      this.shapes.arcs.map((record) => ARC_RECORD_PARAMETERS.map((key) => record[key]))
    )

    this.shapes.surfaces.forEach((record) => {
      const polarities: number[] = []
      const offsets: number[] = []
      const indexes: number[] = []
      const indicies: number[] = []
      const vertQty: number[] = []
      let offset = 0
      let index = 0
      let hasHoles = false
      const vertices = record.contours.flatMap((contour) => {
        if (contour.poly_type === 0) hasHoles = true
        const verts = this.getVertices(contour)
        const ears = earcut(verts)
        indicies.push(...ears)
        const lengthArray = new Array<number>(ears.length / 3)
        polarities.push(...lengthArray.fill(contour.poly_type))
        offsets.push(...lengthArray.fill(offset))
        indexes.push(...lengthArray.fill(index))
        vertQty.push(...lengthArray.fill(verts.length / 2))
        offset += verts.length
        index++
        return verts
      })
      let radius = Math.ceil(Math.sqrt(vertices.length))
      radius = radius % 2 === 0 ? radius : radius + 1
      const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
        return vertices[index] ?? 0
      })
      let targetAttachment = this.shaderAttachment.surfaces
      if (hasHoles) {
        targetAttachment = this.shaderAttachment.surfacesWithHoles
      }
      targetAttachment.push({
        vertices: this.regl.texture({
          width: radius,
          height: radius,
          type: 'float',
          format: 'luminance',
          wrap: 'clamp',
          // mag: 'linear',
          // min: 'linear',
          data: newData
        }),
        verticiesDimensions: [radius, radius],
        polarityBuffer: this.regl.buffer(polarities),
        offsetBuffer: this.regl.buffer(offsets),
        indexBuffer: this.regl.buffer(indexes),
        indiciesBuffer: this.regl.buffer(indicies),
        qtyVertsBuffer: this.regl.buffer(vertQty),
        length: indicies.length / 3,
        qtyContours: record.contours.length,
        index: record.index,
        polarity: record.polarity
      })
    })

    return this
  }

  public getVertices(contour: Shapes.Contour): number[] {
    let previous: { x: number; y: number } = { x: contour.xs, y: contour.ys }
    const vertices = contour.segments.flatMap((segment) => {
      if (segment.type === FeatureTypeIdentifyer.LINESEGMENT) {
        previous = { x: segment.x, y: segment.y }
        return [segment.x, segment.y]
      } else {
        const start_angle = Math.atan2(previous.y - segment.yc, previous.x - segment.xc)
        const dot = (x1: number, y1: number, x2: number, y2: number): number => x1 * x2 + y1 * y2
        const det = (x1: number, y1: number, x2: number, y2: number): number => x1 * y2 - y1 * x2
        const v2 = { x: previous.x - segment.xc, y: previous.y - segment.yc }
        const v1 = { x: segment.x - segment.xc, y: segment.y - segment.yc }

        const dotComp = dot(v1.x, v1.y, v2.x, v2.y)
        const detComp = det(v1.x, v1.y, v2.x, v2.y)
        let angle = Math.atan2(detComp, dotComp)
        angle = Math.abs(angle)
        if (angle == 0) {
          angle = Math.PI * 2
        }
        const radius = Math.sqrt((segment.x - segment.xc) ** 2 + (segment.y - segment.yc) ** 2)
        const segments: number[] = []
        const steps = 100
        if (segment.clockwise === 1) {
          angle = -angle
        }
        for (let i = 1; i <= steps; i++) {
          const a = angle * (i / steps) + start_angle
          segments.push(segment.xc + Math.cos(a) * radius, segment.yc + Math.sin(a) * radius)
        }
        segments.push(segment.x, segment.y)
        previous = { x: segment.x, y: segment.y }
        return segments
      }
    })
    vertices.unshift(contour.xs, contour.ys)
    return vertices
  }
}

export class SymbolShaderCollection {
  public texture: REGL.Texture2D
  public symbols: Map<string, Symbols.StandardSymbol> = new Map<string, Symbols.StandardSymbol>()
  get length(): number {
    return this.symbols.size
  }

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.texture = regl.texture()
  }

  protected makeUnique(symbol: Symbols.StandardSymbol): string {
    if (this.symbols.has(symbol.id)) {
      if (
        this.getSymbolParameters(symbol).toString() ==
        this.getSymbolParameters(this.symbols.get(symbol.id)!).toString()
      ) {
        // console.log(`Identical Symbol with id ${symbol.id} already exists`)
        symbol.sym_num = this.symbols.get(symbol.id)!.sym_num
        return symbol.id
      }
      // console.log(`Unsimilar Symbol with id ${symbol.id} already exists`)
      if (symbol.id.match(/\+\d+$/)) {
        const [base, count] = symbol.id.split('+')
        symbol.id = `${base}+${Number(count) + 1}`
        return this.makeUnique(symbol)
      }
      symbol.id = `${symbol.id}+${1}`
      return this.makeUnique(symbol)
    }
    return symbol.id
  }

  protected getSymbolParameters(symbol: Symbols.StandardSymbol): number[] {
    return SYMBOL_PARAMETERS.map((key) => symbol[key])
  }

  public add(symbol: Symbols.StandardSymbol): this {
    this.makeUnique(symbol)
    this.symbols.set(symbol.id, symbol)
    return this
  }

  public remove(symbol: Symbols.StandardSymbol): this {
    this.symbols.delete(symbol.id)
    return this
  }

  public refresh(): this {
    if (this.symbols.size === 0) {
      this.texture({
        width: 1,
        height: 1,
        type: 'float',
        format: 'luminance',
        data: [0]
      })
      return this
    }
    const symbols = Array.from(this.symbols.values()).map((symbol, i) => {
      // symbol.sym_num = i
      onChange.target(symbol).sym_num.value = i
      return this.getSymbolParameters(symbol)
    })
    this.texture({
      width: SYMBOL_PARAMETERS.length,
      height: symbols.length,
      type: 'float',
      format: 'luminance',
      data: symbols
    })
    console.log('refreshing symbols', this.symbols.size)
    return this
  }
}

export class MacroShaderCollection {
  private records: Shapes.Shape[] = []
  public macros: Map<
    string,
    {
      renderer: MacroRenderer
      records: Shapes.Pad[]
      macro: Symbols.MacroSymbol
    }
  > = new Map<
    string,
    {
      renderer: MacroRenderer
      records: Shapes.Pad[]
      macro: Symbols.MacroSymbol
    }
  >()
  private regl: REGL.Regl
  constructor(props: { regl: REGL.Regl; records: Shapes.Shape[] }) {
    const { records, regl } = props
    this.regl = regl
    this.records = records
  }

  protected makeUnique(symbol: Symbols.MacroSymbol): string {
    if (this.macros.has(symbol.id)) {
      // ** Always make macros unique
      // if (this.macros.get(symbol.id)!.macro.shapes.toString() == symbol.shapes.toString()) {
      //   // console.log(`Identical Macro with id ${symbol.id} already exists`)
      //   const sym = this.macros.get(symbol.id)
      //   symbol = sym!.macro
      //   return symbol.id
      // }
      // console.log(`Unsimilar Macro with id ${symbol.id} already exists`)
      if (symbol.id.match(/\+\d+$/)) {
        const [base, count] = symbol.id.split('+')
        symbol.id = `${base}+${Number(count) + 1}`
        return this.makeUnique(symbol)
      }
      symbol.id = `${symbol.id}+${1}`
      return this.makeUnique(symbol)
    }
    return symbol.id
  }

  public refresh(): this {
    this.macros.clear()
    this.records.forEach((record) => {
      if (record.type != FeatureTypeIdentifyer.PAD) {
        return
      }
      if (record.symbol.type == FeatureTypeIdentifyer.MACRO_DEFINITION) {
        // this.makeUnique(record.symbol)
        if (!this.macros.has(record.symbol.id)) {
          this.macros.set(record.symbol.id, {
            renderer: new MacroRenderer({
              regl: this.regl,
              image: record.symbol.shapes,
              flatten: record.symbol.flatten
            }),

            records: [],
            macro: record.symbol
          })
        }
        this.macros.get(record.symbol.id)!.records.push(record as Shapes.Pad)
      }
    })
    this.macros.forEach((macro) => {
      macro.records.sort((a, b) => {
        return b.index - a.index
      })
    })
    // console.log('refreshed macros', this.macros.size)
    return this
  }
}

export class StepAndRepeatCollection {
  private records: Shapes.Shape[] = []
  public steps: StepAndRepeatRenderer[] = []
  private regl: REGL.Regl

  constructor(props: { regl: REGL.Regl; records: Shapes.Shape[] }) {
    const { records, regl } = props
    this.regl = regl
    this.records = records
  }

  public refresh(): this {
    this.steps.length = 0
    this.records.forEach((record) => {
      if (record.type != FeatureTypeIdentifyer.STEP_AND_REPEAT) {
        return
      }
      this.steps.push(
        new StepAndRepeatRenderer({
          regl: this.regl,
          image: record.shapes,
          repeats: record.repeats
        })
      )
    })
    return this
  }
}

function drawPolyline(record: Shapes.PolyLine, shapes: shapesList): void {
  let endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Null
  if (record.pathtype == 'round') {
    endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Round
  } else if (record.pathtype == 'square') {
    endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Square
  }

  const endSymbol = new Symbols.StandardSymbol({
    id: 'polyline-cap',
    symbol: endSymbolType,
    width: record.width,
    height: record.width,
    outer_dia: record.width
  })

  const lineSymbol = new Symbols.StandardSymbol({
    id: 'polyline-line',
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Null,
    width: record.width,
    height: record.width,
    outer_dia: record.width
  })

  let prevx = record.xs
  let prevy = record.ys
  for (let i = 0; i < record.lines.length; i++) {
    const { x, y } = record.lines[i]
    const prevAngle = Math.atan2(y - prevy, x - prevx)
    const prevAngleDeg = (prevAngle * 180) / Math.PI

    if (i == 0) {
      shapes.pads.push(
        new Shapes.Pad({
          x: prevx,
          y: prevy,
          rotation: -prevAngleDeg,
          symbol: endSymbol,
          polarity: record.polarity,
          index: record.index
        })
      )
    }

    const line = new Shapes.Line({
      xs: prevx,
      ys: prevy,
      xe: x,
      ye: y,
      symbol: lineSymbol,
      polarity: record.polarity,
      index: record.index
    })
    shapes.lines.push(line)

    if (i == record.lines.length - 1) {
      shapes.pads.push(
        new Shapes.Pad({
          x: x,
          y: y,
          rotation: -prevAngleDeg,
          symbol: endSymbol,
          polarity: record.polarity,
          index: record.index
        })
      )
    } else {
      const nextAngle = Math.atan2(record.lines[i + 1].y - y, record.lines[i + 1].x - x)
      if (record.cornertype == 'round') {
        shapes.pads.push(
          new Shapes.Pad({
            x: x,
            y: y,
            symbol: endSymbol,
            polarity: record.polarity,
            index: record.index
          })
        )
      } else if (record.cornertype == 'chamfer') {
        const deltaAngle = Math.abs(nextAngle - prevAngle)
        const base = Math.abs(record.width * Math.sin(deltaAngle / 2))
        const height = Math.abs(record.width * Math.cos(deltaAngle / 2)) / 2
        let angle = (prevAngle + nextAngle) / 2
        if (nextAngle - prevAngle < 0) {
          angle += Math.PI
        }
        const angle2 = angle + Math.PI / 2
        const offsetx = Math.cos(angle2) * -(height / 2)
        const offsety = Math.sin(angle2) * -(height / 2)
        const tringle = new Symbols.TriangleSymbol({
          id: 'polyline-chamfer',
          width: base,
          height: height
        })
        const pad = new Shapes.Pad({
          x: x + offsetx,
          y: y + offsety,
          rotation: -(angle * 180) / Math.PI,
          symbol: tringle,
          polarity: record.polarity,
          index: record.index
        })
        shapes.pads.push(pad)
      } else if (record.cornertype == 'miter') {
        const deltaAngle = Math.abs(nextAngle - prevAngle)
        const base = Math.abs(record.width * Math.sin(deltaAngle / 2))
        const height = Math.abs(record.width * Math.cos(deltaAngle / 2)) / 2
        let angle = (prevAngle + nextAngle) / 2
        if (nextAngle - prevAngle < 0) {
          angle += Math.PI
        }
        const angle2 = angle + Math.PI / 2
        const offsetx = Math.cos(angle2) * -(height / 2)
        const offsety = Math.sin(angle2) * -(height / 2)
        const tringle = new Symbols.TriangleSymbol({
          id: 'polyline-chamfer',
          width: base,
          height: height
        })
        const pad = new Shapes.Pad({
          x: x + offsetx,
          y: y + offsety,
          rotation: -(angle * 180) / Math.PI,
          symbol: tringle,
          polarity: record.polarity,
          index: record.index
        })
        shapes.pads.push(pad)
        const height2 = Math.abs((base / 2) * Math.tan(deltaAngle / 2))
        const offsetx2 = Math.cos(angle2) * -(height + height2 / 2)
        const offsety2 = Math.sin(angle2) * -(height + height2 / 2)
        const tringle2 = new Symbols.TriangleSymbol({
          id: 'polyline-chamfer',
          width: base,
          height: height2
        })
        const pad2 = new Shapes.Pad({
          x: x + offsetx2,
          y: y + offsety2,
          rotation: -((angle + Math.PI) * 180) / Math.PI,
          symbol: tringle2,
          polarity: record.polarity,
          index: record.index
        })
        shapes.pads.push(pad2)
      }
    }
    prevx = x
    prevy = y
  }
}
