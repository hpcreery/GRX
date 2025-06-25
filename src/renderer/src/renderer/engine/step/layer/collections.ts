import REGL from "regl"
import * as Shapes from "./shape/shape"
import * as Symbols from "./shape/symbol/symbol"
import { glFloatSize } from "../../constants"
import { FeatureTypeIdentifier, Binary } from "../../types"
import { MacroRenderer, StepAndRepeatRenderer } from "./shape-renderer"

import PadFrag from "./../../shaders/src/Pad.frag"
import PadVert from "./../../shaders/src/Pad.vert"
import LineFrag from "./../../shaders/src/Line.frag"
import LineVert from "./../../shaders/src/Line.vert"
import ArcFrag from "./../../shaders/src/Arc.frag"
import ArcVert from "./../../shaders/src/Arc.vert"
import SurfaceFrag from "./../../shaders/src/Surface.frag"
import SurfaceVert from "./../../shaders/src/Surface.vert"
import GlyphtextFrag from "./../../shaders/src/GlyphText.frag"
import GlyphtextVert from "./../../shaders/src/GlyphText.vert"
import DatumFrag from "./../../shaders/src/Datum.frag"
import DatumVert from "./../../shaders/src/Datum.vert"

import GridFrag from "./../../shaders/src/Grid.frag"
import OriginFrag from "./../../shaders/src/Origin.frag"
// import LoadingFrag from "./../../shaders/src/Loading/Winding.frag"
import FullScreenQuad from "./../../shaders/src/FullScreenQuad.vert"

import { GridSettings, OriginRenderProps } from "../../settings"

import { UniverseContext } from "../../engine"
import { vec2, vec4 } from "gl-matrix"

import { settings } from "../../settings"

import earcut from "earcut"

import { fontInfo as cozetteFontInfo } from "./shape/text/cozette/font"
import { WorldContext } from "../step"

const {
  LINE_RECORD_PARAMETERS,
  PAD_RECORD_PARAMETERS,
  ARC_RECORD_PARAMETERS,
  LINE_RECORD_PARAMETERS_MAP,
  PAD_RECORD_PARAMETERS_MAP,
  ARC_RECORD_PARAMETERS_MAP,
} = Shapes

type CustomAttributeConfig = Omit<REGL.AttributeConfig, "buffer"> & {
  buffer: REGL.DynamicVariable<REGL.Buffer>
}

interface PadUniforms {}

interface LineUniforms {}

interface ArcUniforms {}

interface DatumTextUniforms {
  u_Texture: REGL.Texture2D
  u_TextureDimensions: vec2
  u_CharDimensions: vec2
  u_CharSpacing: vec2
}

interface DatumUniforms {}

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

interface DatumTextAttributes {
  a_Position: CustomAttributeConfig
  a_Texcoord: CustomAttributeConfig
  a_CharPosition: CustomAttributeConfig
  a_VertexPosition: number[][]
}

interface DatumAttributes {
  a_Location: CustomAttributeConfig
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

export interface DatumTextAttachments {
  positions: REGL.Buffer
  texcoords: REGL.Buffer
  charPosition: REGL.Buffer
  length: number
}

export interface DatumAttachments {
  positions: REGL.Buffer
  length: number
}

interface SurfaceUniforms {
  u_Vertices: REGL.Texture2D
  u_VerticesDimensions: vec2
}

interface SurfaceAttributes {
  a_ContourIndex: CustomAttributeConfig
  a_ContourPolarity: CustomAttributeConfig
  a_ContourOffset: CustomAttributeConfig
  a_Indicies: CustomAttributeConfig
  a_VertexPosition: number[][]
  a_QtyVerts: CustomAttributeConfig
  a_QtyContours: CustomAttributeConfig
  a_SurfaceIndex: CustomAttributeConfig
  a_SurfacePolarity: CustomAttributeConfig
  a_SurfaceOffset: CustomAttributeConfig
}

export interface SurfaceAttachments {
  vertices: REGL.Texture2D
  verticiesDimensions: vec2
  length: number
  qtyContours: REGL.Buffer
  contourVertexQtyBuffer: REGL.Buffer
  contourIndexBuffer: REGL.Buffer
  contourOffsetBuffer: REGL.Buffer
  contourPolarityBuffer: REGL.Buffer
  indiciesBuffer: REGL.Buffer
  surfacePolarityBuffer: REGL.Buffer
  surfaceIndexBuffer: REGL.Buffer
  surfaceOffsetBuffer: REGL.Buffer
}

export interface SurfaceWithHolesAttachments extends SurfaceAttachments {
  surfacePolarity: Binary
  surfaceIndex: number
}

interface FrameBufferRenderUniforms {
  u_QtyFeatures: number
  u_Index: number
  u_Polarity: number
  u_RenderTexture: REGL.Framebuffer2D
}
interface FrameBufferRendeAttributes {}

export interface FrameBufferRenderAttachments {
  qtyFeatures: number
  index: number
  polarity: number
  renderTexture: REGL.Framebuffer2D
}

export interface ScreenRenderProps {
  renderTexture: REGL.Framebuffer | REGL.Texture2D
  blend?: boolean
}

export interface ScreenRenderUniforms {
  u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
}

interface GridRenderUniforms {
  u_Spacing: vec2
  u_Offset: vec2
  u_Type: number
  u_Color: vec4
}

interface OriginRenderUniforms {
  u_Color: vec4
}

interface TShaderAttachment {
  pads: PadAttachments
  lines: LineAttachments
  arcs: ArcAttachments
  surfaces: SurfaceAttachments[]
  surfacesWithHoles: SurfaceWithHolesAttachments[]
  datumPoints: PadAttachments
  datumLines: LineAttachments
  datumArcs: ArcAttachments
}
export interface TLoadedReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, PadAttachments>
  drawArcs: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, ArcAttachments>
  drawLines: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, LineAttachments>
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, SurfaceAttachments>
  drawDatums: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, DatumAttachments>
  drawDatumText: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, DatumTextAttachments>
  drawFrameBuffer: REGL.DrawCommand<REGL.DefaultContext & UniverseContext, FrameBufferRenderAttachments>
  renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps>
  blend: REGL.DrawCommand
  overlayBlendFunc: REGL.DrawCommand
  contrastBlendFunc: REGL.DrawCommand
  overlay: REGL.DrawCommand
  renderGrid: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, GridSettings>
  renderOrigin: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, OriginRenderProps>
}

export interface TReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, PadAttachments> | undefined
  drawArcs: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, ArcAttachments> | undefined
  drawLines: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, LineAttachments> | undefined
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, SurfaceAttachments> | undefined
  drawDatums: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, DatumAttachments> | undefined
  drawDatumText: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, DatumTextAttachments> | undefined
  drawFrameBuffer: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, FrameBufferRenderAttachments> | undefined
  renderToScreen: REGL.DrawCommand<REGL.DefaultContext, ScreenRenderProps> | undefined
  blend: REGL.DrawCommand | undefined
  overlayBlendFunc: REGL.DrawCommand | undefined
  contrastBlendFunc: REGL.DrawCommand | undefined
  overlay: REGL.DrawCommand | undefined
  renderGrid: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, GridSettings> | undefined
  renderOrigin: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext, OriginRenderProps> | undefined
}

export const ReglRenderers: TReglRenderers = {
  drawPads: undefined,
  drawArcs: undefined,
  drawLines: undefined,
  drawSurfaces: undefined,
  drawDatums: undefined,
  drawDatumText: undefined,
  drawFrameBuffer: undefined,
  renderToScreen: undefined,
  blend: undefined,
  overlayBlendFunc: undefined,
  contrastBlendFunc: undefined,
  overlay: undefined,
  renderGrid: undefined,
  renderOrigin: undefined,
}

export function initializeFontRenderer(regl: REGL.Regl, data: Uint8ClampedArray): void {
  const texture = regl.texture({
    data,
    width: cozetteFontInfo.textureSize[0],
    height: cozetteFontInfo.textureSize[1],
    format: "rgba",
    type: "uint8",
    mag: "nearest",
    min: "nearest",
  })

  ReglRenderers.drawDatumText = regl<
    DatumTextUniforms,
    DatumTextAttributes,
    DatumTextAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: GlyphtextFrag,
    vert: GlyphtextVert,

    attributes: {
      a_Position: {
        buffer: regl.prop<DatumTextAttachments, "positions">("positions"),
        offset: 0,
        stride: 2 * glFloatSize,
        divisor: 1,
      },
      a_Texcoord: {
        buffer: regl.prop<DatumTextAttachments, "texcoords">("texcoords"),
        offset: 0,
        stride: 2 * glFloatSize,
        divisor: 1,
      },
      a_CharPosition: {
        buffer: regl.prop<DatumTextAttachments, "charPosition">("charPosition"),
        offset: 0,
        stride: 2 * glFloatSize,
        divisor: 1,
      },
      a_VertexPosition: [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
    },

    uniforms: {
      u_Texture: texture,
      u_TextureDimensions: cozetteFontInfo.textureSize,
      u_CharDimensions: cozetteFontInfo.fontSize,
      u_CharSpacing: cozetteFontInfo.fontSpacing,
    },

    instances: regl.prop<SurfaceAttachments, "length">("length"),
    count: 6,
    primitive: "triangles",
  })
}

export function initializeRenderers(regl: REGL.Regl): void {
  ReglRenderers.drawPads = regl<
    PadUniforms,
    PadAttributes,
    PadAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: PadFrag,
    vert: PadVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1,
      },

      a_Location: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.x * glFloatSize,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1,
      },

      a_ResizeFactor: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * glFloatSize,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1,
      },

      a_Rotation: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.rotation * glFloatSize,
        divisor: 1,
      },

      a_Mirror_X: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_x * glFloatSize,
        divisor: 1,
      },

      a_Mirror_Y: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * glFloatSize,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_y * glFloatSize,
        divisor: 1,
      },
    },

    instances: regl.prop<PadAttachments, "length">("length"),
  })

  ReglRenderers.drawArcs = regl<
    ArcUniforms,
    ArcAttributes,
    ArcAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: ArcFrag,

    vert: ArcVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1,
      },

      a_Start_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xs * glFloatSize,
        divisor: 1,
      },

      a_End_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xe * glFloatSize,
        divisor: 1,
      },

      a_Center_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.xc * glFloatSize,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1,
      },

      a_Clockwise: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * glFloatSize,
        offset: ARC_RECORD_PARAMETERS_MAP.clockwise * glFloatSize,
        divisor: 1,
      },
    },

    instances: regl.prop<ArcAttachments, "length">("length"),
  })

  ReglRenderers.drawLines = regl<
    LineUniforms,
    LineAttributes,
    LineAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: LineFrag,

    vert: LineVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.index * glFloatSize,
        divisor: 1,
      },

      a_Start_Location: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.xs * glFloatSize,
        divisor: 1,
      },

      a_End_Location: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.xe * glFloatSize,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.sym_num * glFloatSize,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * glFloatSize,
        offset: LINE_RECORD_PARAMETERS_MAP.polarity * glFloatSize,
        divisor: 1,
      },
    },

    instances: regl.prop<LineAttachments, "length">("length"),
  })

  ReglRenderers.drawSurfaces = regl<
    SurfaceUniforms,
    SurfaceAttributes,
    SurfaceAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: SurfaceFrag,

    vert: SurfaceVert,

    uniforms: {
      u_Vertices: regl.prop<SurfaceAttachments, "vertices">("vertices"),
      u_VerticesDimensions: regl.prop<SurfaceAttachments, "verticiesDimensions">("verticiesDimensions"),
    },

    attributes: {
      a_ContourIndex: {
        buffer: regl.prop<SurfaceAttachments, "contourIndexBuffer">("contourIndexBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_ContourPolarity: {
        buffer: regl.prop<SurfaceAttachments, "contourPolarityBuffer">("contourPolarityBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_ContourOffset: {
        buffer: regl.prop<SurfaceAttachments, "contourOffsetBuffer">("contourOffsetBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_Indicies: {
        buffer: regl.prop<SurfaceAttachments, "indiciesBuffer">("indiciesBuffer"),
        stride: 3 * glFloatSize,
        divisor: 1,
      },

      a_QtyVerts: {
        buffer: regl.prop<SurfaceAttachments, "contourVertexQtyBuffer">("contourVertexQtyBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_QtyContours: {
        buffer: regl.prop<SurfaceAttachments, "qtyContours">("qtyContours"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_SurfaceIndex: {
        buffer: regl.prop<SurfaceAttachments, "surfaceIndexBuffer">("surfaceIndexBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_SurfacePolarity: {
        buffer: regl.prop<SurfaceAttachments, "surfacePolarityBuffer">("surfacePolarityBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_SurfaceOffset: {
        buffer: regl.prop<SurfaceAttachments, "surfaceOffsetBuffer">("surfaceOffsetBuffer"),
        stride: 1 * glFloatSize,
        divisor: 1,
      },

      a_VertexPosition: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    },

    cull: {
      enable: false,
    },

    instances: regl.prop<SurfaceAttachments, "length">("length"),
    count: 3,
    // primitive: 'line loop'
  })

  ReglRenderers.drawFrameBuffer = regl<
    FrameBufferRenderUniforms,
    FrameBufferRendeAttributes,
    FrameBufferRenderAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
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
      func: "greater",
      range: [0, 1],
    },
    uniforms: {
      u_QtyFeatures: regl.prop<FrameBufferRenderAttachments, "qtyFeatures">("qtyFeatures"),
      u_RenderTexture: regl.prop<FrameBufferRenderAttachments, "renderTexture">("renderTexture"),
      u_Index: regl.prop<FrameBufferRenderAttachments, "index">("index"),
      u_Polarity: regl.prop<FrameBufferRenderAttachments, "polarity">("polarity"),
    },
  })

  ReglRenderers.renderToScreen = regl<ScreenRenderUniforms, Record<string, never>, ScreenRenderProps>({
    vert: `
      precision highp float;
      attribute vec2 a_Vertex_Position;
      varying vec2 v_UV;
      void main () {
        v_UV = a_Vertex_Position;
        gl_Position = vec4(a_Vertex_Position, 1, 1);
      }
    `,
    frag: `
      precision highp float;
      uniform sampler2D u_RenderTexture;
      varying vec2 v_UV;
      void main () {

        // gl_FragColor = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        vec4 color = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        if (color.a == 0.0) {
          discard;
        }
        gl_FragColor = color;
      }
    `,

    // blend: {
    //   enable: true,

    //   func: {
    //     srcRGB: 'one minus dst color',
    //     srcAlpha: 'one',
    //     dstRGB: 'one minus src color',
    //     dstAlpha: 'one'
    //   },

    //   equation: {
    //     rgb: 'add',
    //     alpha: 'add'
    //   },
    //   color: [0, 0, 0, 0.1]
    // },

    depth: {
      enable: false,
      mask: false,
      func: "greater",
      range: [0, 1],
    },

    uniforms: {
      u_RenderTexture: regl.prop<ScreenRenderProps, "renderTexture">("renderTexture"),
    },
  })

  ReglRenderers.drawDatums = regl<
    DatumUniforms,
    DatumAttributes,
    DatumAttachments,
    Record<string, never>,
    REGL.DefaultContext & UniverseContext & WorldContext
  >({
    frag: DatumFrag,

    vert: DatumVert,

    uniforms: {},

    attributes: {
      a_Location: {
        buffer: regl.prop<DatumAttachments, "positions">("positions"),
        stride: 2 * glFloatSize,
        offset: 0,
        divisor: 1,
      },
    },

    instances: regl.prop<DatumAttachments, "length">("length"),
  })

  ReglRenderers.renderGrid = regl<GridRenderUniforms, Record<string, never>, GridSettings, UniverseContext & WorldContext>({
    vert: FullScreenQuad,
    frag: GridFrag,
    uniforms: {
      u_Color: (_context: REGL.DefaultContext, props: GridSettings) => props.color,
      u_Spacing: (_context: REGL.DefaultContext, props: GridSettings) => [props.spacing_x, props.spacing_y],
      u_Offset: (_context: REGL.DefaultContext, props: GridSettings) => [props.offset_x, props.offset_y],
      u_Type: (_context: REGL.DefaultContext, props: GridSettings) => props._type,
    },
  })

  ReglRenderers.renderOrigin = regl<OriginRenderUniforms, Record<string, never>, OriginRenderProps, UniverseContext & WorldContext>({
    vert: FullScreenQuad,
    frag: OriginFrag,
    uniforms: {
      u_Color: () => {
        const color = vec4.create()
        vec4.subtract(color, [1, 1, 1, 1], settings.BACKGROUND_COLOR)
        color[3] = 1
        return color
      },
    },
  })

  ReglRenderers.blend = regl({
    blend: {
      enable: true,

      // func: {
      //   srcRGB:"one minus dst color",
      //   srcAlpha: "one",
      //   dstRGB: "one minus src color",
      //   dstAlpha: "one",
      // },

      equation: {
        rgb: "add",
        alpha: "add",
      },
      color: [0, 0, 0, 0.1],
    },
  })

  ReglRenderers.overlayBlendFunc = regl({
    blend: {
      func: {
        srcRGB: "src color",
        srcAlpha: "one",
        dstRGB: "one minus src color",
        dstAlpha: "one",
      },
    },
  })

  ReglRenderers.contrastBlendFunc = regl({
    blend: {
      func: {
        srcRGB: "one minus dst color",
        srcAlpha: "one",
        dstRGB: "one minus src color",
        dstAlpha: "one",
      },
    },
  })

  ReglRenderers.overlay = regl({
    blend: {
      enable: true,

      func: {
        srcRGB: "src alpha",
        srcAlpha: "src alpha",
        dstRGB: "one minus src alpha",
        dstAlpha: "one minus src alpha",
      },

      equation: {
        rgb: "add",
        alpha: "add",
      },
      color: [0, 0, 0, 0.1],
    },
  })
}

const { SYMBOL_PARAMETERS } = Symbols

interface ShapesList {
  pads: Shapes.Pad[]
  lines: Shapes.Line[]
  arcs: Shapes.Arc[]
  surfaces: Shapes.Surface[]
  datumPoints: Shapes.DatumPoint[]
  datumLines: Shapes.DatumLine[]
  datumArcs: Shapes.DatumArc[]
  clear: () => void
}

interface ShapesListHistogram {
  pads: number
  lines: number
  arcs: number
  surfaces: number
}

export class ShapesShaderCollection {
  private regl: REGL.Regl

  public symbolsCollection: SymbolShaderCollection

  public shapes: ShapesList

  public shaderAttachment: TShaderAttachment

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.regl = regl
    this.symbolsCollection = new SymbolShaderCollection({
      regl,
    })
    this.shapes = {
      pads: [],
      lines: [],
      arcs: [],
      surfaces: [],
      datumPoints: [],
      datumLines: [],
      datumArcs: [],
      clear: function (): void {
        this.pads.length = 0
        this.lines.length = 0
        this.arcs.length = 0
        this.surfaces.length = 0
        this.datumPoints.length = 0
        this.datumLines.length = 0
        this.datumArcs.length = 0
      },
    }
    this.shaderAttachment = {
      pads: {
        buffer: regl.buffer(0),
        length: 0,
      },
      lines: {
        buffer: regl.buffer(0),
        length: 0,
      },
      arcs: {
        buffer: regl.buffer(0),
        length: 0,
      },
      datumPoints: {
        buffer: regl.buffer(0),
        length: 0,
      },
      datumLines: {
        buffer: regl.buffer(0),
        length: 0,
      },
      datumArcs: {
        buffer: regl.buffer(0),
        length: 0,
      },
      surfaces: [],
      surfacesWithHoles: [],
    }
  }

  public get histogram(): ShapesListHistogram {
    return {
      pads: this.shapes.pads.length,
      lines: this.shapes.lines.length,
      arcs: this.shapes.arcs.length,
      surfaces: this.shapes.surfaces.length,
    }
  }

  public refresh(image: Shapes.Shape[]): this {
    // first order of business is to clear the shapes
    this.symbolsCollection.symbols.clear()
    this.shapes.clear()

    this.shaderAttachment.surfaces.map((surface) => {
      surface.vertices.destroy()
      surface.contourIndexBuffer.destroy()
      surface.contourOffsetBuffer.destroy()
      surface.contourPolarityBuffer.destroy()
      surface.indiciesBuffer.destroy()
      surface.contourVertexQtyBuffer.destroy()
      surface.qtyContours.destroy()
      surface.surfaceIndexBuffer.destroy()
      surface.surfacePolarityBuffer.destroy()
      surface.surfaceOffsetBuffer.destroy()
    })
    this.shaderAttachment.surfaces.length = 0
    this.shaderAttachment.surfacesWithHoles.map((surface) => {
      surface.vertices.destroy()
      surface.contourIndexBuffer.destroy()
      surface.contourOffsetBuffer.destroy()
      surface.contourPolarityBuffer.destroy()
      surface.indiciesBuffer.destroy()
      surface.contourVertexQtyBuffer.destroy()
      surface.qtyContours.destroy()
      surface.surfaceIndexBuffer.destroy()
      surface.surfacePolarityBuffer.destroy()
      surface.surfaceOffsetBuffer.destroy()
    })
    this.shaderAttachment.surfacesWithHoles.length = 0

    function isGetter(obj, prop): boolean {
      const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
      if (descriptor === undefined) {
        return false
      }
      return !!Object.getOwnPropertyDescriptor(obj, prop)!["get"]
    }

    function fixSymbolGetter(record: Shapes.Pad | Shapes.Line | Shapes.Arc | Shapes.DatumArc | Shapes.DatumLine | Shapes.DatumPoint): void {
      if (!isGetter(record, "sym_num")) {
        Object.defineProperty(record, "sym_num", {
          get: function (): number {
            return this.symbol.sym_num.value
          },
        })
      }
    }

    image.forEach((record) => {
      if (record.type === FeatureTypeIdentifier.SURFACE) {
        this.shapes.surfaces.push(record)
      } else if (record.type === FeatureTypeIdentifier.PAD && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.pads.push(record)
      } else if (record.type === FeatureTypeIdentifier.LINE && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.lines.push(record)
      } else if (record.type === FeatureTypeIdentifier.ARC && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.arcs.push(record)
      } else if (record.type === FeatureTypeIdentifier.POLYLINE) {
        drawPolyline(record, this.shapes)
      } else if (record.type === FeatureTypeIdentifier.DATUM_LINE && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.datumLines.push(record)
      } else if (record.type === FeatureTypeIdentifier.DATUM_ARC && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.datumArcs.push(record)
      } else if (record.type === FeatureTypeIdentifier.DATUM_POINT && record.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        fixSymbolGetter(record)
        this.shapes.datumPoints.push(record)
      }
    })

    this.shapes.pads.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.lines.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.arcs.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.datumLines.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.datumArcs.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })
    this.shapes.datumPoints.forEach((record) => {
      if (record.symbol.type != FeatureTypeIdentifier.SYMBOL_DEFINITION) {
        return
      }
      this.symbolsCollection.add(record.symbol)
    })

    this.symbolsCollection.refresh()

    // inverse order to render from front to back to save on overdraw
    this.shapes.pads.sort((a, b) => b.index - a.index)
    this.shapes.lines.sort((a, b) => b.index - a.index)
    this.shapes.arcs.sort((a, b) => b.index - a.index)
    this.shapes.datumPoints.sort((a, b) => b.index - a.index)
    this.shapes.datumLines.sort((a, b) => b.index - a.index)
    this.shapes.datumArcs.sort((a, b) => b.index - a.index)
    this.shapes.surfaces.sort((a, b) => b.index - a.index)

    this.shaderAttachment.pads.length = this.shapes.pads.length
    this.shaderAttachment.lines.length = this.shapes.lines.length
    this.shaderAttachment.arcs.length = this.shapes.arcs.length
    this.shaderAttachment.datumPoints.length = this.shapes.datumPoints.length
    this.shaderAttachment.datumLines.length = this.shapes.datumLines.length
    this.shaderAttachment.datumArcs.length = this.shapes.datumArcs.length

    this.shaderAttachment.pads.buffer(this.shapes.pads.map((record) => PAD_RECORD_PARAMETERS.map((key) => record[key])))
    this.shaderAttachment.lines.buffer(this.shapes.lines.map((record) => LINE_RECORD_PARAMETERS.map((key) => record[key])))
    this.shaderAttachment.arcs.buffer(this.shapes.arcs.map((record) => ARC_RECORD_PARAMETERS.map((key) => record[key])))
    this.shaderAttachment.datumPoints.buffer(this.shapes.datumPoints.map((record) => PAD_RECORD_PARAMETERS.map((key) => record[key])))
    this.shaderAttachment.datumLines.buffer(this.shapes.datumLines.map((record) => LINE_RECORD_PARAMETERS.map((key) => record[key])))
    this.shaderAttachment.datumArcs.buffer(this.shapes.datumArcs.map((record) => ARC_RECORD_PARAMETERS.map((key) => record[key])))

    const surfacePolarities: number[] = []
    const surfaceOffsets: number[] = []
    const surfaceIndexes: number[] = []
    const allContourPolarities: number[] = []
    const allContourOffsets: number[] = []
    const allContourIndexes: number[] = []
    const allContourQty: number[] = []
    const allIndicies: number[] = []
    const allContourVertexQty: number[] = []
    const allVertices: number[] = []

    let surfaceOffset = 0
    this.shapes.surfaces.forEach((record) => {
      const contourPolarities: number[] = []
      const contourOffsets: number[] = []
      const contourIndexes: number[] = []
      const indicies: number[] = []
      const contourVertexQty: number[] = []
      let contourOffset = 0
      let contourIndex = 0
      let hasHoles = false
      const vertices = record.contours.flatMap((contour) => {
        if (contour.poly_type === 0) hasHoles = true
        const vertices = this.getVertices(contour)
        const ears = earcut(vertices)
        ears.forEach((ear) => indicies.push(ear))
        const lengthArray = new Array<number>(ears.length / 3)
        lengthArray.fill(contour.poly_type).forEach((polarity) => contourPolarities.push(polarity))
        lengthArray.fill(contourOffset).forEach((offset) => contourOffsets.push(offset))
        lengthArray.fill(contourIndex).forEach((index) => contourIndexes.push(index))
        lengthArray.fill(vertices.length / 2).forEach((qty) => contourVertexQty.push(qty))
        contourOffset += vertices.length
        contourIndex++
        return vertices
      })

      if (hasHoles) {
        const { width, height, data } = fixedTextureData(this.regl.limits.maxTextureSize, vertices)
        const length = indicies.length / 3
        this.shaderAttachment.surfacesWithHoles.push({
          vertices: this.regl.texture({
            width,
            height,
            type: "float",
            channels: 1,
            wrap: "clamp",
            mag: "nearest",
            min: "nearest",
            data,
          }),
          verticiesDimensions: [width, height],
          indiciesBuffer: this.regl.buffer(indicies),
          contourPolarityBuffer: this.regl.buffer(contourPolarities),
          contourOffsetBuffer: this.regl.buffer(contourOffsets),
          contourIndexBuffer: this.regl.buffer(contourIndexes),
          qtyContours: this.regl.buffer(new Array<number>(length).fill(record.contours.length)),
          contourVertexQtyBuffer: this.regl.buffer(contourVertexQty),
          surfaceIndex: record.index,
          surfacePolarity: record.polarity,
          surfaceIndexBuffer: this.regl.buffer(new Array<number>(length).fill(record.index)),
          surfacePolarityBuffer: this.regl.buffer(new Array<Binary>(length).fill(record.polarity)),
          surfaceOffsetBuffer: this.regl.buffer(new Array<number>(length).fill(0)),
          length: length,
        })
      } else {
        contourPolarities.forEach((polarity) => allContourPolarities.push(polarity))
        contourOffsets.forEach((offset) => allContourOffsets.push(offset))
        contourIndexes.forEach((index) => allContourIndexes.push(index))
        contourVertexQty.forEach((qty) => allContourVertexQty.push(qty))

        indicies.forEach((index) => allIndicies.push(index))
        vertices.forEach((vertex) => allVertices.push(vertex))

        const length = indicies.length / 3
        new Array<number>(length).fill(0).forEach(() => surfaceIndexes.push(record.index))
        new Array<Binary>(length).fill(0).forEach(() => surfacePolarities.push(record.polarity))
        new Array<number>(length).fill(0).forEach(() => surfaceOffsets.push(surfaceOffset))
        surfaceOffset += vertices.length
        new Array<number>(length).fill(0).forEach(() => allContourQty.push(record.contours.length))
      }
    })

    if (allVertices.length != 0) {
      const { width, height, data } = fixedTextureData(this.regl.limits.maxTextureSize, allVertices)
      this.shaderAttachment.surfaces.push({
        vertices: this.regl.texture({
          width,
          height,
          type: "float",
          channels: 1,
          wrap: "clamp",
          mag: "nearest",
          min: "nearest",
          data,
        }),
        verticiesDimensions: [width, height],
        contourPolarityBuffer: this.regl.buffer(allContourPolarities),
        contourOffsetBuffer: this.regl.buffer(allContourOffsets),
        contourIndexBuffer: this.regl.buffer(allContourIndexes),
        contourVertexQtyBuffer: this.regl.buffer(allContourVertexQty),
        indiciesBuffer: this.regl.buffer(allIndicies),
        qtyContours: this.regl.buffer(allContourQty),
        surfaceIndexBuffer: this.regl.buffer(surfaceIndexes),
        surfacePolarityBuffer: this.regl.buffer(surfacePolarities),
        surfaceOffsetBuffer: this.regl.buffer(surfaceOffsets),
        length: allIndicies.length / 3,
      })
    }

    return this
  }

  public getVertices(contour: Shapes.Contour): number[] {
    let previous: { x: number; y: number } = { x: contour.xs, y: contour.ys }
    const vertices = contour.segments.flatMap((segment) => {
      if (segment.type === FeatureTypeIdentifier.LINESEGMENT) {
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
        let angle = Math.atan2(-detComp, -dotComp) + (segment.clockwise ? Math.PI : -Math.PI)
        if (angle == 0) {
          angle = Math.PI * 2
        }
        const radius = Math.sqrt((segment.x - segment.xc) ** 2 + (segment.y - segment.yc) ** 2)
        const segments: number[] = []
        const steps = Math.ceil(50 * (Math.abs(angle) / (Math.PI * 2)))
        for (let i = 1; i <= steps; i++) {
          const a = -angle * (i / steps) + start_angle
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

export class DatumTextShaderCollection {
  private regl: REGL.Regl

  public attachment: DatumTextAttachments
  public texts: Shapes.DatumText[] = []

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.regl = regl
    this.attachment = {
      positions: this.regl.buffer(0),
      texcoords: this.regl.buffer(0),
      charPosition: this.regl.buffer(0),
      length: 0,
    }
  }

  refresh(image: Shapes.Shape[]): this {
    const positions: number[] = []
    const texcoords: number[] = []
    const charPosition: vec2[] = []
    image.map((record) => {
      if (record.type !== FeatureTypeIdentifier.DATUM_TEXT) return
      this.texts.push(record)
      const string = record.text
      const x = record.x
      const y = record.y
      let row = 0
      let col = 0
      for (let i = 0; i < string.length; ++i) {
        const letter = string[i]
        const glyphInfo = cozetteFontInfo.characterLocation[letter]
        if (glyphInfo !== undefined) {
          positions.push(x, y)
          texcoords.push(glyphInfo.x, glyphInfo.y)
          charPosition.push([col, row])
        }
        col++
        if (letter === "\n") {
          row--
          col = 0
        }
      }
    })

    this.attachment.positions(positions)
    this.attachment.texcoords(texcoords)
    this.attachment.charPosition(charPosition)
    this.attachment.length = positions.length / 2
    return this
  }
}

export class DatumShaderCollection {
  private regl: REGL.Regl

  public attachment: DatumAttachments

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.regl = regl
    this.attachment = {
      positions: this.regl.buffer(0),
      length: 0,
    }
  }

  public refresh(image: Shapes.Shape[]): this {
    const positions: number[] = []
    positions.push(0, 0)
    image.map((record) => {
      if (record.type !== FeatureTypeIdentifier.DATUM_POINT) return
      positions.push(record.x, record.y)
    })
    this.attachment.positions(positions)
    this.attachment.length = positions.length / 2
    return this
  }
}

export class SymbolShaderCollection {
  public texture: REGL.Texture2D
  public symbols: Map<string, Symbols.StandardSymbol> = new Map<string, Symbols.StandardSymbol>()
  public get length(): number {
    return this.symbols.size
  }

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.texture = regl.texture()
    this.refresh()
  }

  protected makeUnique(symbol: Symbols.StandardSymbol): string {
    if (this.symbols.has(symbol.id)) {
      if (this.getSymbolParameters(symbol).toString() == this.getSymbolParameters(this.symbols.get(symbol.id)!).toString()) {
        // console.log(`Identical Symbol with id ${symbol.id} already exists`)
        symbol.sym_num = this.symbols.get(symbol.id)!.sym_num
        return symbol.id
      }
      // console.log(`Unsimilar Symbol with id ${symbol.id} already exists`)
      if (symbol.id.match(/\+\d+$/)) {
        const [base, count] = symbol.id.split("+")
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
        type: "float",
        format: "luminance",
        data: [0],
      })
      return this
    }
    const symbols = Array.from(this.symbols.values()).map((symbol, i) => {
      symbol.sym_num.value = i
      return this.getSymbolParameters(symbol)
    })
    // TODO: make symbols texture fit to max texture size
    this.texture({
      width: SYMBOL_PARAMETERS.length,
      height: symbols.length,
      type: "float",
      format: "luminance",
      data: symbols,
    })
    return this
  }
}

export class MacroShaderCollection {
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
  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.regl = regl
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
        const [base, count] = symbol.id.split("+")
        symbol.id = `${base}+${Number(count) + 1}`
        return this.makeUnique(symbol)
      }
      symbol.id = `${symbol.id}+${1}`
      return this.makeUnique(symbol)
    }
    return symbol.id
  }

  public refresh(image: Shapes.Shape[]): this {
    this.macros.clear()
    image.forEach((record) => {
      if (record.type != FeatureTypeIdentifier.PAD) {
        return
      }
      if (record.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION) {
        // this.makeUnique(record.symbol)
        if (!this.macros.has(record.symbol.id)) {
          this.macros.set(record.symbol.id, {
            renderer: new MacroRenderer({
              regl: this.regl,
              image: record.symbol.shapes,
              flatten: record.symbol.flatten,
            }),
            records: [],
            macro: record.symbol,
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
  public steps: StepAndRepeatRenderer[] = []
  private regl: REGL.Regl

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    this.regl = regl
  }

  public refresh(image: Shapes.Shape[]): this {
    this.steps.length = 0
    image.forEach((record) => {
      if (record.type != FeatureTypeIdentifier.STEP_AND_REPEAT) {
        return
      }
      this.steps.push(
        new StepAndRepeatRenderer({
          regl: this.regl,
          record: record,
        }),
      )
    })
    return this
  }
}

function drawPolyline(record: Shapes.PolyLine, shapes: ShapesList): void {
  let endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Null
  if (record.pathtype == "round") {
    endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Round
  } else if (record.pathtype == "square") {
    endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Square
  }

  const endSymbol = new Symbols.StandardSymbol({
    id: "polyline-cap",
    symbol: endSymbolType,
    width: record.width,
    height: record.width,
    outer_dia: record.width,
  })

  const lineSymbol = new Symbols.StandardSymbol({
    id: "polyline-line",
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Null,
    width: record.width,
    height: record.width,
    outer_dia: record.width,
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
          rotation: prevAngleDeg,
          symbol: endSymbol,
          polarity: record.polarity,
          index: record.index,
        }),
      )
    }

    const line = new Shapes.Line({
      xs: prevx,
      ys: prevy,
      xe: x,
      ye: y,
      symbol: lineSymbol,
      polarity: record.polarity,
      index: record.index,
    })
    shapes.lines.push(line)

    if (i == record.lines.length - 1) {
      shapes.pads.push(
        new Shapes.Pad({
          x: x,
          y: y,
          rotation: prevAngleDeg,
          symbol: endSymbol,
          polarity: record.polarity,
          index: record.index,
        }),
      )
    } else {
      const nextAngle = Math.atan2(record.lines[i + 1].y - y, record.lines[i + 1].x - x)
      if (record.cornertype == "round") {
        shapes.pads.push(
          new Shapes.Pad({
            x: x,
            y: y,
            symbol: endSymbol,
            polarity: record.polarity,
            index: record.index,
          }),
        )
      } else if (record.cornertype == "chamfer") {
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
          id: "polyline-chamfer",
          width: base,
          height: height,
        })
        const pad = new Shapes.Pad({
          x: x + offsetx,
          y: y + offsety,
          rotation: (angle * 180) / Math.PI,
          symbol: tringle,
          polarity: record.polarity,
          index: record.index,
        })
        shapes.pads.push(pad)
      } else if (record.cornertype == "miter") {
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
          id: "polyline-chamfer",
          width: base,
          height: height,
        })
        const pad = new Shapes.Pad({
          x: x + offsetx,
          y: y + offsety,
          rotation: (angle * 180) / Math.PI,
          symbol: tringle,
          polarity: record.polarity,
          index: record.index,
        })
        shapes.pads.push(pad)
        const height2 = Math.abs((base / 2) * Math.tan(deltaAngle / 2))
        const offsetx2 = Math.cos(angle2) * -(height + height2 / 2)
        const offsety2 = Math.sin(angle2) * -(height + height2 / 2)
        const tringle2 = new Symbols.TriangleSymbol({
          id: "polyline-chamfer",
          width: base,
          height: height2,
        })
        const pad2 = new Shapes.Pad({
          x: x + offsetx2,
          y: y + offsety2,
          rotation: ((angle + Math.PI) * 180) / Math.PI,
          symbol: tringle2,
          polarity: record.polarity,
          index: record.index,
        })
        shapes.pads.push(pad2)
      }
    }
    prevx = x
    prevy = y
  }
}

export function fixedTextureData(
  maxTextureSize: number,
  inputData: number[],
): {
  width: number
  height: number
  data: number[]
} {
  if (inputData.length > Math.pow(maxTextureSize, 2)) {
    throw new Error("Cannot fit data into size")
  }
  const width = inputData.length < maxTextureSize ? inputData.length % maxTextureSize : maxTextureSize
  const height = Math.ceil(inputData.length / maxTextureSize)

  const data = new Array(width * height).fill(0).map((_, index) => {
    return inputData[index] ?? 0
  })
  return { width, height, data }
}
