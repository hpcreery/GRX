import * as Shapes from "@src/data/shape/shape"
import { type vec2, vec4 } from "gl-matrix"
import type REGL from "regl"
import { fontInfo as cozetteFontInfo } from "../data/shape/text/cozette/font"
import { type GridSettings, type OriginRenderProps, settings } from "../settings"
import ArcFrag from "./../shaders/src/Arc.frag"
import ArcVert from "./../shaders/src/Arc.vert"
import DatumFrag from "./../shaders/src/Datum.frag"
import DatumVert from "./../shaders/src/Datum.vert"
// import LoadingFrag from "./../shaders/src/Loading/Winding.frag"
import FullScreenQuad from "./../shaders/src/FullScreenQuad.vert"
import GlyphtextFrag from "./../shaders/src/GlyphText.frag"
import GlyphtextVert from "./../shaders/src/GlyphText.vert"
import GridFrag from "./../shaders/src/Grid.frag"
import LineFrag from "./../shaders/src/Line.frag"
import LineVert from "./../shaders/src/Line.vert"
import OriginFrag from "./../shaders/src/Origin.frag"
import PadFrag from "./../shaders/src/Pad.frag"
import PadVert from "./../shaders/src/Pad.vert"
import SurfaceFrag from "./../shaders/src/Surface.frag"
import SurfaceVert from "./../shaders/src/Surface.vert"
import type { Binary } from "../types"
import type { WorldContext } from "./view"

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

type PadUniforms = {}

type LineUniforms = {}

type ArcUniforms = {}

interface DatumTextUniforms {
  u_Texture: REGL.Texture2D
  u_TextureDimensions: vec2
  u_CharDimensions: vec2
  u_CharSpacing: vec2
}

type DatumUniforms = {}

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
type FrameBufferRendeAttributes = {}

export interface FrameBufferRenderAttachments {
  qtyFeatures: number
  index: number
  polarity: number
  renderTexture: REGL.Framebuffer2D
}

export interface TextureToScreenRendererProps {
  renderTexture: REGL.Framebuffer | REGL.Texture2D
}

export interface TextureToScreenRendererUniforms {
  u_RenderTexture: REGL.Framebuffer | REGL.Texture2D
}

export interface TextureToScreenRendererAttributes {
  a_Vertex_Position: number[][]
}

export interface TextureToScreen3DRendererAttributes {
  a_Vertex_Position: number[][]
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

export interface TLoadedReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext, PadAttachments>
  drawArcs: REGL.DrawCommand<REGL.DefaultContext, ArcAttachments>
  drawLines: REGL.DrawCommand<REGL.DefaultContext, LineAttachments>
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext, SurfaceAttachments>
  drawDatums: REGL.DrawCommand<REGL.DefaultContext, DatumAttachments>
  drawDatumText: REGL.DrawCommand<REGL.DefaultContext, DatumTextAttachments>
  drawGroupedShapes: REGL.DrawCommand<REGL.DefaultContext, FrameBufferRenderAttachments>
  renderTextureToScreen: REGL.DrawCommand<REGL.DefaultContext, TextureToScreenRendererProps>
  blend: REGL.DrawCommand
  overlayBlendFunc: REGL.DrawCommand
  contrastBlendFunc: REGL.DrawCommand
  opaqueBlendFunc: REGL.DrawCommand
  overlay: REGL.DrawCommand
  renderGrid: REGL.DrawCommand<REGL.DefaultContext & WorldContext, GridSettings>
  renderOrigin: REGL.DrawCommand<REGL.DefaultContext & WorldContext, OriginRenderProps>
}

export interface TReglRenderers {
  drawPads: REGL.DrawCommand<REGL.DefaultContext & WorldContext, PadAttachments> | undefined
  drawArcs: REGL.DrawCommand<REGL.DefaultContext & WorldContext, ArcAttachments> | undefined
  drawLines: REGL.DrawCommand<REGL.DefaultContext & WorldContext, LineAttachments> | undefined
  drawSurfaces: REGL.DrawCommand<REGL.DefaultContext & WorldContext, SurfaceAttachments> | undefined
  drawDatums: REGL.DrawCommand<REGL.DefaultContext & WorldContext, DatumAttachments> | undefined
  drawDatumText: REGL.DrawCommand<REGL.DefaultContext & WorldContext, DatumTextAttachments> | undefined
  drawGroupedShapes: REGL.DrawCommand<REGL.DefaultContext & WorldContext, FrameBufferRenderAttachments> | undefined
  renderTextureToScreen: REGL.DrawCommand<REGL.DefaultContext, TextureToScreenRendererProps> | undefined
  blend: REGL.DrawCommand | undefined
  overlayBlendFunc: REGL.DrawCommand | undefined
  contrastBlendFunc: REGL.DrawCommand | undefined
  opaqueBlendFunc: REGL.DrawCommand | undefined
  overlay: REGL.DrawCommand | undefined
  renderGrid: REGL.DrawCommand<REGL.DefaultContext & WorldContext, GridSettings> | undefined
  renderOrigin: REGL.DrawCommand<REGL.DefaultContext & WorldContext, OriginRenderProps> | undefined
}

export const ReglRenderers: TReglRenderers = {
  drawPads: undefined,
  drawArcs: undefined,
  drawLines: undefined,
  drawSurfaces: undefined,
  drawDatums: undefined,
  drawDatumText: undefined,
  drawGroupedShapes: undefined,
  renderTextureToScreen: undefined,
  blend: undefined,
  overlayBlendFunc: undefined,
  contrastBlendFunc: undefined,
  opaqueBlendFunc: undefined,
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
    REGL.DefaultContext & WorldContext
  >({
    frag: GlyphtextFrag,
    vert: GlyphtextVert,

    attributes: {
      a_Position: {
        buffer: regl.prop<DatumTextAttachments, "positions">("positions"),
        offset: 0,
        stride: 2 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },
      a_Texcoord: {
        buffer: regl.prop<DatumTextAttachments, "texcoords">("texcoords"),
        offset: 0,
        stride: 2 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },
      a_CharPosition: {
        buffer: regl.prop<DatumTextAttachments, "charPosition">("charPosition"),
        offset: 0,
        stride: 2 * Float32Array.BYTES_PER_ELEMENT,
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
  ReglRenderers.drawPads = regl<PadUniforms, PadAttributes, PadAttachments, Record<string, never>, REGL.DefaultContext & WorldContext>({
    frag: PadFrag,
    vert: PadVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.index * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Location: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.x * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.sym_num * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_ResizeFactor: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.resize_factor * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.polarity * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Rotation: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.rotation * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Mirror_X: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_x * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Mirror_Y: {
        buffer: regl.prop<PadAttachments, "buffer">("buffer"),
        stride: PAD_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: PAD_RECORD_PARAMETERS_MAP.mirror_y * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },
    },

    instances: regl.prop<PadAttachments, "length">("length"),
  })

  ReglRenderers.drawArcs = regl<ArcUniforms, ArcAttributes, ArcAttachments, Record<string, never>, REGL.DefaultContext & WorldContext>({
    frag: ArcFrag,

    vert: ArcVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.index * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Start_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.xs * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_End_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.xe * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Center_Location: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.xc * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.sym_num * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.polarity * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Clockwise: {
        buffer: regl.prop<ArcAttachments, "buffer">("buffer"),
        stride: ARC_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: ARC_RECORD_PARAMETERS_MAP.clockwise * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },
    },

    instances: regl.prop<ArcAttachments, "length">("length"),
  })

  ReglRenderers.drawLines = regl<LineUniforms, LineAttributes, LineAttachments, Record<string, never>, REGL.DefaultContext & WorldContext>({
    frag: LineFrag,

    vert: LineVert,

    uniforms: {},

    attributes: {
      a_Index: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: LINE_RECORD_PARAMETERS_MAP.index * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Start_Location: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: LINE_RECORD_PARAMETERS_MAP.xs * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_End_Location: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: LINE_RECORD_PARAMETERS_MAP.xe * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SymNum: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: LINE_RECORD_PARAMETERS_MAP.sym_num * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Polarity: {
        buffer: regl.prop<LineAttachments, "buffer">("buffer"),
        stride: LINE_RECORD_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT,
        offset: LINE_RECORD_PARAMETERS_MAP.polarity * Float32Array.BYTES_PER_ELEMENT,
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
    REGL.DefaultContext & WorldContext
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
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_ContourPolarity: {
        buffer: regl.prop<SurfaceAttachments, "contourPolarityBuffer">("contourPolarityBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_ContourOffset: {
        buffer: regl.prop<SurfaceAttachments, "contourOffsetBuffer">("contourOffsetBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_Indicies: {
        buffer: regl.prop<SurfaceAttachments, "indiciesBuffer">("indiciesBuffer"),
        stride: 3 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_QtyVerts: {
        buffer: regl.prop<SurfaceAttachments, "contourVertexQtyBuffer">("contourVertexQtyBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_QtyContours: {
        buffer: regl.prop<SurfaceAttachments, "qtyContours">("qtyContours"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SurfaceIndex: {
        buffer: regl.prop<SurfaceAttachments, "surfaceIndexBuffer">("surfaceIndexBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SurfacePolarity: {
        buffer: regl.prop<SurfaceAttachments, "surfacePolarityBuffer">("surfacePolarityBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
        divisor: 1,
      },

      a_SurfaceOffset: {
        buffer: regl.prop<SurfaceAttachments, "surfaceOffsetBuffer">("surfaceOffsetBuffer"),
        stride: 1 * Float32Array.BYTES_PER_ELEMENT,
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

  ReglRenderers.drawGroupedShapes = regl<
    FrameBufferRenderUniforms,
    FrameBufferRendeAttributes,
    FrameBufferRenderAttachments,
    Record<string, never>,
    REGL.DefaultContext & WorldContext
  >({
    vert: /* glsl */ `
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
    frag: /* glsl */ `
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

  ReglRenderers.renderTextureToScreen = regl<TextureToScreenRendererUniforms, TextureToScreenRendererAttributes, TextureToScreenRendererProps>({
    vert: /* glsl */ `
      precision highp float;
      attribute vec2 a_Vertex_Position;
      varying vec2 v_UV;
      void main () {
        v_UV = a_Vertex_Position;
        gl_Position = vec4(a_Vertex_Position, 1, 1);
      }
    `,
    frag: /* glsl */ `
      precision highp float;
      uniform sampler2D u_RenderTexture;
      varying vec2 v_UV;
      void main () {

        gl_FragColor = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        // vec4 color = texture2D(u_RenderTexture, (v_UV * 0.5) + 0.5);
        // if (color.a == 0.0) {
        //   discard;
        // }
        // gl_FragColor = color;
      }
    `,

    depth: {
      enable: false,
      mask: false,
      func: "greater",
      range: [0, 1],
    },

    uniforms: {
      u_RenderTexture: regl.prop<TextureToScreenRendererProps, "renderTexture">("renderTexture"),
    },

    attributes: {
      a_Vertex_Position: [
        [-1, -1],
        [+1, -1],
        [-1, +1],
        [+1, +1],
        [-1, +1],
        [+1, -1],
      ],
    },
  })

  ReglRenderers.drawDatums = regl<DatumUniforms, DatumAttributes, DatumAttachments, Record<string, never>, REGL.DefaultContext & WorldContext>({
    frag: DatumFrag,

    vert: DatumVert,

    uniforms: {},

    attributes: {
      a_Location: {
        buffer: regl.prop<DatumAttachments, "positions">("positions"),
        stride: 2 * Float32Array.BYTES_PER_ELEMENT,
        offset: 0,
        divisor: 1,
      },
    },

    instances: regl.prop<DatumAttachments, "length">("length"),
  })

  ReglRenderers.renderGrid = regl<GridRenderUniforms, Record<string, never>, GridSettings, WorldContext>({
    vert: FullScreenQuad,
    frag: GridFrag,
    uniforms: {
      u_Color: (_context: REGL.DefaultContext, props: GridSettings) => props.color,
      u_Spacing: (_context: REGL.DefaultContext, props: GridSettings) => [props.spacing_x, props.spacing_y],
      u_Offset: (_context: REGL.DefaultContext, props: GridSettings) => [props.offset_x, props.offset_y],
      u_Type: (_context: REGL.DefaultContext, props: GridSettings) => props._type,
    },
  })

  ReglRenderers.renderOrigin = regl<OriginRenderUniforms, Record<string, never>, OriginRenderProps, WorldContext>({
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

  // this is a good blend mode
  //   func: {
  //   srcRGB: "one",
  //   srcAlpha: "one",
  //   dstRGB: "one",
  //   dstAlpha: "one",
  // },

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

  ReglRenderers.opaqueBlendFunc = regl({
    blend: {
      enable: true,
      equation: {
        rgb: "add",
        alpha: "add",
      },
      func: {
        srcRGB: "one",
        srcAlpha: "one",
        dstRGB: "one minus src alpha",
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
