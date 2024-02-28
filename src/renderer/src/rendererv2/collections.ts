import REGL from 'regl'
import * as Shapes from './shapes'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import { FeatureTypeIdentifyer } from './types'
import { MacroRenderer, StepAndRepeatRenderer } from './layer'
import onChange from 'on-change'

import PadFrag from '../shaders/src/Pad.frag'
import PadVert from '../shaders/src/Pad.vert'
import LineFrag from '../shaders/src/Line.frag'
import LineVert from '../shaders/src/Line.vert'
import LineBrushedFrag from '../shaders/src/LineBrushed.frag'
import LineBrushedVert from '../shaders/src/LineBrushed.vert'
import ArcFrag from '../shaders/src/Arc.frag'
import ArcVert from '../shaders/src/Arc.vert'
import ArcBrushedFrag from '../shaders/src/ArcBrushed.frag'
import ArcBrushedVert from '../shaders/src/ArcBrushed.vert'
import SurfaceFrag from '../shaders/src/Surface.frag'
import SurfaceVert from '../shaders/src/Surface.vert'

// const SurfaceFragPtr = malloc(SurfaceFrag)
// const SurfaceVertPtr = malloc(SurfaceVert)

import { WorldContext } from './engine'
import { vec2 } from 'gl-matrix'

const {
  LINE_RECORD_PARAMETERS,
  BRUSHED_LINE_RECORD_PARAMETERS,
  BRUSHED_ARC_RECORD_PARAMETERS,
  PAD_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS_MAP,
  BRUSHED_LINE_RECORD_PARAMETERS_MAP,
  BRUSHED_ARC_RECORD_PARAMETERS_MAP,
  PAD_RECORD_PARAMETERS_MAP,
  ARC_RECORD_PARAMETERS_MAP,
  SURFACE_RECORD_PARAMETERS_MAP,
  // CONTOUR_RECORD_PARAMETERS_MAP,
  // CONTOUR_ARC_SEGMENT_RECORD_PARAMETERS_MAP,
  // CONTOUR_LINE_SEGMENT_RECORD_PARAMETERS_MAP
} = Shapes

type CustomAttributeConfig = Omit<REGL.AttributeConfig, 'buffer'> & {
  buffer:
    // | REGL.Buffer
    // | undefined
    // | null
    // | false
    | REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {}

interface LineUniforms {}

interface ArcUniforms {}

interface SurfaceUniforms {
  u_ContoursTexture: REGL.Texture2D
  u_ContoursTextureDimensions: vec2
  u_EndSurfaceId: number
  u_ContourId: number
  u_EndContourId: number
  u_LineSegmentId: number
  u_ArcSegmentId: number
}

interface PadAttributes {
  a_SymNum: CustomAttributeConfig
  a_Location: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror: CustomAttributeConfig
}

interface LineAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
}

interface BrushedLineAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror_X: CustomAttributeConfig
  a_Mirror_Y: CustomAttributeConfig
}

interface BrushedArcAttributes {
  a_SymNum: CustomAttributeConfig
  a_Start_Location: CustomAttributeConfig
  a_End_Location: CustomAttributeConfig
  a_Center_Location: CustomAttributeConfig
  a_Clockwise: CustomAttributeConfig
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_ResizeFactor: CustomAttributeConfig
  a_Rotation: CustomAttributeConfig
  a_Mirror_X: CustomAttributeConfig
  a_Mirror_Y: CustomAttributeConfig
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

interface SurfaceAttributes {
  a_Index: CustomAttributeConfig
  a_Polarity: CustomAttributeConfig
  a_Box: CustomAttributeConfig
}

interface PadAttachments {
  buffer: REGL.Buffer
  length: number
}

interface ArcAttachments {
  buffer: REGL.Buffer
  length: number
}

interface LineAttachments {
  buffer: REGL.Buffer
  length: number
}

interface SurfaceAttachments {
  contourTexture: REGL.Texture2D
  attributeBuffer: REGL.Buffer
}

interface BrushedLineAttachments {
  symbol: keyof typeof Symbols.STANDARD_SYMBOLS_MAP
  buffer: REGL.Buffer
  length: number
}

interface BrushedArcAttachments {
  symbol: keyof typeof Symbols.STANDARD_SYMBOLS_MAP
  buffer: REGL.Buffer
  length: number
}

interface TShaderAttachment {
  pads: PadAttachments
  lines: LineAttachments
  arcs: ArcAttachments
  surfaces: SurfaceAttachments[]
  brushedLines: BrushedLineAttachments[]
  brushedArcs: BrushedArcAttachments[]
}

interface TReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext & WorldContext> | undefined
  drawArcs: REGL.DrawCommand<REGL.DefaultContext & WorldContext> | undefined
  drawLines: REGL.DrawCommand<REGL.DefaultContext & WorldContext> | undefined
  drawBrushedLines: Record<keyof Symbols.STANDARD_SYMBOLS, REGL.DrawCommand<REGL.DefaultContext & WorldContext>>
  drawBrushedArcs: Record<keyof Symbols.STANDARD_SYMBOLS, REGL.DrawCommand<REGL.DefaultContext & WorldContext>>
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & WorldContext> | undefined
}

export const ReglRenderers: TReglRenderers = {
  drawPads: undefined,
  drawArcs: undefined,
  drawLines: undefined,
  drawSurfaces: undefined,
  drawBrushedLines: {} as Record<keyof Symbols.STANDARD_SYMBOLS, REGL.DrawCommand<REGL.DefaultContext & WorldContext>>,
  drawBrushedArcs: {} as Record<keyof Symbols.STANDARD_SYMBOLS, REGL.DrawCommand<REGL.DefaultContext & WorldContext>>
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

      a_Mirror: {
        buffer: regl.prop<PadAttachments, 'buffer'>('buffer'),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror * glFloatSize,
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
      u_ContoursTexture: regl.prop<SurfaceAttachments, 'contourTexture'>('contourTexture'),
      u_ContoursTextureDimensions: [
        // @ts-ignore - regl oddity
        regl.prop<SurfaceAttachments, 'contourTexture.width'>('contourTexture.width'),
        // @ts-ignore - regl oddity
        regl.prop<SurfaceAttachments, 'contourTexture.height'>('contourTexture.height')
      ],
      u_EndSurfaceId: Shapes.END_SURFACE_ID,
      u_ContourId: Shapes.CONTOUR_ID,
      u_EndContourId: Shapes.END_CONTOUR_ID,
      u_LineSegmentId: Shapes.CONTOUR_LINE_SEGMENT_ID,
      u_ArcSegmentId: Shapes.CONTOUR_ARC_SEGMENT_ID
    },

    attributes: {
      a_Index: {
        buffer: regl.prop<SurfaceAttachments, 'attributeBuffer'>('attributeBuffer'),
        offset: SURFACE_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1
      },

      a_Polarity: {
        buffer: regl.prop<SurfaceAttachments, 'attributeBuffer'>('attributeBuffer'),
        offset: SURFACE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1
      },

      a_Box: {
        buffer: regl.prop<SurfaceAttachments, 'attributeBuffer'>('attributeBuffer'),
        offset: SURFACE_RECORD_PARAMETERS_MAP.top * glFloatSize, // implies right, bottom, left is next in vec4
        divisor: 1
      }
    },

    instances: 1
  })

  Symbols.STANDARD_SYMBOLS.map((symbol) => {
    const frag = LineBrushedFrag.replace(dynamicShapeRegex, (match, shapes) => {
      if (shapes && shapes.split(',').includes(symbol)) {
        return ''
      }
      return match
    })
    ReglRenderers.drawBrushedLines[symbol] = regl<
      LineUniforms,
      BrushedLineAttributes,
      BrushedLineAttachments,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: frag,

      vert: LineBrushedVert,

      uniforms: {},

      attributes: {
        a_Index: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
          divisor: 1
        },

        a_Mirror_X: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.mirror_x * glFloatSize,
          divisor: 1
        },

        a_Mirror_Y: {
          buffer: regl.prop<BrushedLineAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_LINE_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.mirror_y * glFloatSize,
          divisor: 1
        }
      },

      instances: regl.prop<BrushedLineAttachments, 'length'>('length')
    })
  })

  Symbols.STANDARD_SYMBOLS.map((symbol) => {
    const frag = ArcBrushedFrag.replace(dynamicShapeRegex, (match, shapes) => {
      if (shapes && shapes.split(',').includes(symbol)) {
        return ''
      }
      return match
    })
    ReglRenderers.drawBrushedArcs[symbol] = regl<
      ArcUniforms,
      BrushedArcAttributes,
      BrushedArcAttachments,
      Record<string, never>,
      REGL.DefaultContext & WorldContext
    >({
      frag: frag,

      vert: ArcBrushedVert,

      uniforms: {},

      attributes: {
        a_Index: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
          divisor: 1
        },

        a_Start_Location: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
          divisor: 1
        },

        a_End_Location: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
          divisor: 1
        },

        a_Center_Location: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
          divisor: 1
        },

        a_Clockwise: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
          divisor: 1
        },

        a_SymNum: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
          divisor: 1
        },

        a_Polarity: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
          divisor: 1
        },

        a_ResizeFactor: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
          divisor: 1
        },

        a_Rotation: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
          divisor: 1
        },

        a_Mirror_X: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.mirror_x * glFloatSize,
          divisor: 1
        },

        a_Mirror_Y: {
          buffer: regl.prop<BrushedArcAttachments, 'buffer'>('buffer'),
          stride: BRUSHED_ARC_RECORD_PARAMETERS.length * glFloatSize,
          offset: BRUSHED_ARC_RECORD_PARAMETERS_MAP.mirror_y * glFloatSize,
          divisor: 1
        }
      },

      instances: regl.prop<BrushedArcAttachments, 'length'>('length')
    })
  })
}

const dynamicShapeRegex = /^#pragma dynamic_shape\(?(?<shapes>(?:\w|,)+)?\)?/gm

const { SURFACE_RECORD_PARAMETERS } = Shapes

const { SYMBOL_PARAMETERS } = Symbols

interface shapesList {
  pads: Shapes.Pad[]
  lines: Shapes.Line[]
  arcs: Shapes.Arc[]
  brushedLines: Shapes.BrushedLine[]
  brushedArcs: Shapes.BrushedArc[]
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
      brushedLines: [],
      brushedArcs: [],
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
      brushedLines: [],
      brushedArcs: []
    }
  }

  public refresh(): this {
    this.symbolsCollection.symbols.clear()
    this.shapes.clear()
    this.shaderAttachment.surfaces.map((surface) => {
      surface.contourTexture.destroy()
      surface.attributeBuffer.destroy()
    })
    this.shaderAttachment.surfaces.length = 0
    this.shaderAttachment.brushedLines.forEach((attachment) => {
      attachment.buffer.destroy()
    })
    this.shaderAttachment.brushedLines.length = 0

    this.records.forEach((record) => {
      if (record instanceof Shapes.Surface) {
        this.shapes.surfaces.push(record)
      } else if (record instanceof Shapes.Pad && record.symbol instanceof Symbols.StandardSymbol) {
        this.shapes.pads.push(record)
      } else if (record instanceof Shapes.Line && record.symbol instanceof Symbols.StandardSymbol) {
        this.shapes.lines.push(record)
      } else if (record instanceof Shapes.Arc && record.symbol instanceof Symbols.StandardSymbol) {
        this.shapes.arcs.push(record)
      } else if (
        record instanceof Shapes.BrushedLine &&
        record.symbol instanceof Symbols.StandardSymbol
      ) {
        this.shapes.brushedLines.push(record)
      } else if (
        record instanceof Shapes.BrushedArc &&
        record.symbol instanceof Symbols.StandardSymbol
      ) {
        this.shapes.brushedArcs.push(record)
      } else if (record instanceof Shapes.PolyLine) {
        drawPolyline(record, this.shapes)
      }
    })

    this.shapes.pads.forEach((record) => {
      if (!(record.symbol instanceof Symbols.StandardSymbol)) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.lines.forEach((record) => {
      if (!(record.symbol instanceof Symbols.StandardSymbol)) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.arcs.forEach((record) => {
      if (!(record.symbol instanceof Symbols.StandardSymbol)) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.brushedLines.forEach((record) => {
      if (!(record.symbol instanceof Symbols.StandardSymbol)) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.brushedArcs.forEach((record) => {
      if (!(record.symbol instanceof Symbols.StandardSymbol)) {
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
    this.shapes.brushedLines.sort((a, b) => b.index - a.index)
    this.shapes.brushedArcs.sort((a, b) => b.index - a.index)

    this.shaderAttachment.pads.length = this.shapes.pads.length
    this.shaderAttachment.lines.length = this.shapes.lines.length
    this.shaderAttachment.arcs.length = this.shapes.arcs.length

    this.shaderAttachment.pads.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.shapes.pads.length * glFloatSize,
      data: this.shapes.pads.map((record) => {
        return record.array
      })
    })
    this.shaderAttachment.lines.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.shapes.lines.length * glFloatSize,
      data: this.shapes.lines.map((record) => {
        return record.array
      })
    })
    this.shaderAttachment.arcs.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.shapes.arcs.length * glFloatSize,
      data: this.shapes.arcs.map((record) => {
        return record.array
      })
    })

    this.shapes.surfaces.forEach((record) => {
      const surfaceParameters = record.array
      const surfaceCountours = record.contoursArray
      const radius = Math.ceil(Math.sqrt(surfaceCountours.length))
      const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
        return surfaceCountours[index] ?? Shapes.END_SURFACE_ID
      })
      this.shaderAttachment.surfaces.push({
        contourTexture: this.regl.texture({
          width: radius,
          height: radius,
          type: 'float',
          format: 'luminance',
          wrap: 'clamp',
          // mag: 'linear',
          // min: 'linear',
          data: newData
        }),
        attributeBuffer: this.regl.buffer({
          usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
          type: 'float',
          length: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          data: surfaceParameters
        })
      })
    })

    Symbols.STANDARD_SYMBOLS.map((symbol) => {
      const shapes = this.shapes.brushedLines.filter((record) => {
        return record.symbol.symbol == Symbols.STANDARD_SYMBOLS_MAP[symbol]
      })
      this.shaderAttachment.brushedLines.push({
        symbol: symbol,
        length: shapes.length,
        buffer: this.regl.buffer({
          usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
          type: 'float',
          length: shapes.length * glFloatSize,
          data: shapes.map((record) => {
            return record.array
          })
        })
      })
    })

    Symbols.STANDARD_SYMBOLS.map((symbol) => {
      const shapes = this.shapes.brushedArcs.filter((record) => {
        return record.symbol.symbol == Symbols.STANDARD_SYMBOLS_MAP[symbol]
      })
      this.shaderAttachment.brushedArcs.push({
        symbol: symbol,
        length: shapes.length,
        buffer: this.regl.buffer({
          usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
          type: 'float',
          length: shapes.length * glFloatSize,
          data: shapes.map((record) => {
            return record.array
          })
        })
      })
    })

    return this
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
      if (this.symbols.get(symbol.id)!.array.toString() == symbol.array.toString()) {
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
      return symbol.array
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
      if (this.macros.get(symbol.id)!.macro.shapes.toString() == symbol.shapes.toString()) {
        // console.log(`Identical Macro with id ${symbol.id} already exists`)
        const sym = this.macros.get(symbol.id)
        symbol = sym!.macro
        return symbol.id
      }
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
      if (record.symbol instanceof Symbols.MacroSymbol) {
        this.makeUnique(record.symbol)
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
        const tringle = new Symbols.StandardSymbol({
          id: 'polyline-chamfer',
          symbol: Symbols.STANDARD_SYMBOLS_MAP.Triangle,
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
        const tringle = new Symbols.StandardSymbol({
          id: 'polyline-chamfer',
          symbol: Symbols.STANDARD_SYMBOLS_MAP.Triangle,
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
        const tringle2 = new Symbols.StandardSymbol({
          id: 'polyline-chamfer',
          symbol: Symbols.STANDARD_SYMBOLS_MAP.Triangle,
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
