import REGL from "regl"
import * as Shapes from "./shape/shape"
import * as Symbols from "./shape/symbol/symbol"
import { FeatureTypeIdentifier, Binary } from "../../types"
import { MacroRenderer, StepAndRepeatRenderer } from "./shape-renderer"

import { vec2, vec4 } from "gl-matrix"

import { ArtworkBufferCollection, SymbolBufferCollection, MacroArtworkCollection } from "../../../data/artwork-collection"

import { fontInfo as cozetteFontInfo } from "./shape/text/cozette/font"

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

  public artworkBufferCollection: ArtworkBufferCollection

  public shaderAttachment: TShaderAttachment
  // public symbolsCollection: {
  //   texture: REGL.Texture2D
  // }
  // public macroCollection: {
  //     artwork: ShapesShaderCollection
  //     shape: Shapes.Pad
  //   }[]

  constructor(props: { regl: REGL.Regl, artwork: ArtworkBufferCollection }) {
    const { regl, artwork } = props
    this.regl = regl
    this.artworkBufferCollection = artwork
    // this.symbolsCollection = {
    //   texture: regl.texture(),
    // }

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

    // this.macroCollection = []

    this.refresh()
  }

  public refresh(): this {
    // console.log("Refreshing ShapesShaderCollection with image:", image.length, "records")
    // image.map((record) => {
    //   try {
    //     this.artworkBufferCollection.create(record)
    //   } catch (e) {
    //     console.error("Error creating artwork buffer collection for record:", record, e)
    //     // console.error("error")
    //   }
    // })
    // this.artworkBufferCollection = new ArtworkBufferCollection(image)
    // this.macroCollection = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.PAD].macros.map(record => {
    //   return {
    //     artwork: new ShapesShaderCollection({ regl: this.regl, artwork: record.artwork }),
    //     shape: record.shape
    //   }
    // })
    this.shaderAttachment.pads.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.PAD].view)
    this.shaderAttachment.pads.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.PAD].length
    this.shaderAttachment.lines.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.LINE].view)
    this.shaderAttachment.lines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.LINE].length
    this.shaderAttachment.arcs.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.ARC].view)
    this.shaderAttachment.arcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.ARC].length
    this.shaderAttachment.datumPoints.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_POINT].view)
    this.shaderAttachment.datumPoints.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_POINT].length
    this.shaderAttachment.datumLines.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_LINE].view)
    this.shaderAttachment.datumLines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_LINE].length
    this.shaderAttachment.datumArcs.buffer = this.regl.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_ARC].view)
    this.shaderAttachment.datumArcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_ARC].length
    const surfaceCollection = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE]
    const [width, height] = surfaceCollection.verticesDimensions
    if (width * height != 0) {
      // console.log("Surface Collection Dimensions:", [width, height], width * height, surfaceCollection.verticesView.length)
      // console.log(new Float32Array(surfaceCollection.verticesView.buffer).slice(0, width * height))
      this.shaderAttachment.surfaces = [
        {
          vertices: this.regl.texture({
            width,
            height,
            type: "float32",
            channels: 1,
            wrap: "clamp",
            mag: "nearest",
            min: "nearest",
            data: new Float32Array(surfaceCollection.verticesView.buffer).slice(0, width * height),
          }),
          verticiesDimensions: vec2.fromValues(width, height),
          length: surfaceCollection.length,
          qtyContours: this.regl.buffer(surfaceCollection.qtyContoursView),
          contourVertexQtyBuffer: this.regl.buffer(surfaceCollection.contourVertexQtyView),
          contourIndexBuffer: this.regl.buffer(surfaceCollection.contourIndexView),
          contourOffsetBuffer: this.regl.buffer(surfaceCollection.contourOffsetView),
          contourPolarityBuffer: this.regl.buffer(surfaceCollection.contourPolarityView),
          indiciesBuffer: this.regl.buffer(surfaceCollection.indiciesView),
          surfacePolarityBuffer: this.regl.buffer(surfaceCollection.surfacePolarityView),
          surfaceIndexBuffer: this.regl.buffer(surfaceCollection.surfaceIndexView),
          surfaceOffsetBuffer: this.regl.buffer(surfaceCollection.surfaceOffsetView),
        },
      ]
    }



    return this
  }

  public destroy(): this {
    this.shaderAttachment.pads.buffer.destroy()
    this.shaderAttachment.lines.buffer.destroy()
    this.shaderAttachment.arcs.buffer.destroy()
    this.shaderAttachment.datumPoints.buffer.destroy()
    this.shaderAttachment.datumLines.buffer.destroy()
    this.shaderAttachment.datumArcs.buffer.destroy()
    this.shaderAttachment.surfaces.map((surface) => {
      surface.vertices.destroy()
      surface.qtyContours.destroy()
      surface.contourVertexQtyBuffer.destroy()
      surface.contourIndexBuffer.destroy()
      surface.contourOffsetBuffer.destroy()
      surface.contourPolarityBuffer.destroy()
      surface.indiciesBuffer.destroy()
      surface.surfacePolarityBuffer.destroy()
      surface.surfaceIndexBuffer.destroy()
      surface.surfaceOffsetBuffer.destroy()
    })
    this.artworkBufferCollection = new ArtworkBufferCollection([])
    // this.macroCollection.map((macro) => {
    //   macro.artwork.destroy()
    // })
    // this.macroCollection = []
    return this
  }
}

export class SymbolShaderCollection {
  public static texture: REGL.Texture2D
  public static regl: REGL.Regl


  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    SymbolShaderCollection.regl = regl
    SymbolShaderCollection.texture = regl.texture()
    this.refresh()
  }

  public refresh(): this {
    console.log("Inefficient Symbols Refresh - TODO Optimize")
    const data = new Float32Array(SymbolBufferCollection.buffer).slice(0, SYMBOL_PARAMETERS.length * SymbolBufferCollection.length)
    // console.log("Symbols", SYMBOL_PARAMETERS.length, SymbolBufferCollection.length, data)
    SymbolShaderCollection.texture({
      width: SYMBOL_PARAMETERS.length,
      height: SymbolBufferCollection.length,
      type: "float",
      format: "luminance",
      data,
    })
    return this
  }
}

// export class MacroShaderCollection {
//   public static regl: REGL.Regl
//   public static macros: Map<string, ShapesShaderCollection> = new Map<string, ShapesShaderCollection>()
//   constructor(props: { regl: REGL.Regl }) {
//     const { regl } = props
//     MacroShaderCollection.regl = regl
//     this.refresh()
//   }
//   public refresh(): this {
//     console.log("Inefficient Macro Refresh - TODO Optimize")
//     MacroShaderCollection.macros.forEach((macro) => {
//       macro.destroy()
//     })
//     MacroShaderCollection.macros.clear()
//     MacroArtworkCollection.macros.forEach((artwork, id) => {
//       MacroShaderCollection.macros.set(id, new ShapesShaderCollection({ regl: MacroShaderCollection.regl, artwork }))
//     })
//     return this
//   }
// }

export class MacroShaderCollection {
  public static regl: REGL.Regl
  public static macros: Map<string, MacroRenderer> = new Map<string, MacroRenderer>()
  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    MacroShaderCollection.regl = regl
    // this.refresh()
  }
  public refresh(): this {
    // console.log(MacroShaderCollection.macros.size)
    if (MacroShaderCollection.macros.size != 0) return this
    console.log("Inefficient Macro Refresh - TODO Optimize")
    MacroShaderCollection.macros.forEach((macro) => {
      macro.destroy()
    })
    MacroShaderCollection.macros.clear()
    MacroArtworkCollection.macros.forEach((artwork, id) => {
      console.log('artwork', id, artwork)
      const macroRenderer = new MacroRenderer({
        regl: MacroShaderCollection.regl,
        image: artwork,
      })
      MacroShaderCollection.macros.set(id, macroRenderer)
      console.log('done', id)
      console.log(MacroShaderCollection.macros.size)
    })
    console.log(MacroShaderCollection.macros.size)
    return this
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

// export class DatumShaderCollection {
//   private regl: REGL.Regl

//   public attachment: DatumAttachments

//   constructor(props: { regl: REGL.Regl }) {
//     const { regl } = props
//     this.regl = regl
//     this.attachment = {
//       positions: this.regl.buffer(0),
//       length: 0,
//     }
//   }

//   public refresh(image: Shapes.Shape[]): this {
//     const positions: number[] = []
//     positions.push(0, 0)
//     image.map((record) => {
//       if (record.type !== FeatureTypeIdentifier.DATUM_POINT) return
//       positions.push(record.x, record.y)
//     })
//     this.attachment.positions(positions)
//     this.attachment.length = positions.length / 2
//     return this
//   }
// }

// export class SymbolShaderCollection {
//   public texture: REGL.Texture2D
//   public symbols: Map<string, Symbols.StandardSymbol> = new Map<string, Symbols.StandardSymbol>()
//   public get length(): number {
//     return this.symbols.size
//   }

//   constructor(props: { regl: REGL.Regl }) {
//     const { regl } = props
//     this.texture = regl.texture()
//     this.refresh()
//   }

//   protected makeUnique(symbol: Symbols.StandardSymbol): string {
//     if (this.symbols.has(symbol.id)) {
//       if (this.getSymbolParameters(symbol).toString() == this.getSymbolParameters(this.symbols.get(symbol.id)!).toString()) {
//         // console.log(`Identical Symbol with id ${symbol.id} already exists`)
//         symbol.sym_num = this.symbols.get(symbol.id)!.sym_num
//         return symbol.id
//       }
//       // console.log(`Unsimilar Symbol with id ${symbol.id} already exists`)
//       if (symbol.id.match(/\+\d+$/)) {
//         const [base, count] = symbol.id.split("+")
//         symbol.id = `${base}+${Number(count) + 1}`
//         return this.makeUnique(symbol)
//       }
//       symbol.id = `${symbol.id}+${1}`
//       return this.makeUnique(symbol)
//     }
//     return symbol.id
//   }

//   protected getSymbolParameters(symbol: Symbols.StandardSymbol): number[] {
//     return SYMBOL_PARAMETERS.map((key) => symbol[key])
//   }

//   public add(symbol: Symbols.StandardSymbol): this {
//     this.makeUnique(symbol)
//     this.symbols.set(symbol.id, symbol)
//     return this
//   }

//   public remove(symbol: Symbols.StandardSymbol): this {
//     this.symbols.delete(symbol.id)
//     return this
//   }

//   public refresh(): this {
//     if (this.symbols.size === 0) {
//       this.texture({
//         width: 1,
//         height: 1,
//         type: "float",
//         format: "luminance",
//         data: [0],
//       })
//       return this
//     }
//     const symbols = Array.from(this.symbols.values()).map((symbol, i) => {
//       symbol.sym_num.value = i
//       return this.getSymbolParameters(symbol)
//     })
//     // TODO: make symbols texture fit to max texture size
//     this.texture({
//       width: SYMBOL_PARAMETERS.length,
//       height: symbols.length,
//       type: "float",
//       format: "luminance",
//       data: symbols,
//     })
//     return this
//   }
// }

// export class MacroShaderCollection {
//   public macros: Map<
//     string,
//     {
//       renderer: MacroRenderer
//       records: Shapes.Pad[]
//       macro: Symbols.MacroSymbol
//     }
//   > = new Map<
//     string,
//     {
//       renderer: MacroRenderer
//       records: Shapes.Pad[]
//       macro: Symbols.MacroSymbol
//     }
//   >()
//   private regl: REGL.Regl
//   constructor(props: { regl: REGL.Regl }) {
//     const { regl } = props
//     this.regl = regl
//   }

//   protected makeUnique(symbol: Symbols.MacroSymbol): string {
//     if (this.macros.has(symbol.id)) {
//       // ** Always make macros unique
//       // if (this.macros.get(symbol.id)!.macro.shapes.toString() == symbol.shapes.toString()) {
//       //   // console.log(`Identical Macro with id ${symbol.id} already exists`)
//       //   const sym = this.macros.get(symbol.id)
//       //   symbol = sym!.macro
//       //   return symbol.id
//       // }
//       // console.log(`Unsimilar Macro with id ${symbol.id} already exists`)
//       if (symbol.id.match(/\+\d+$/)) {
//         const [base, count] = symbol.id.split("+")
//         symbol.id = `${base}+${Number(count) + 1}`
//         return this.makeUnique(symbol)
//       }
//       symbol.id = `${symbol.id}+${1}`
//       return this.makeUnique(symbol)
//     }
//     return symbol.id
//   }

//   public refresh(image: Shapes.Shape[]): this {
//     this.macros.clear()
//     image.forEach((record) => {
//       if (record.type != FeatureTypeIdentifier.PAD) {
//         return
//       }
//       if (record.symbol.type == FeatureTypeIdentifier.MACRO_DEFINITION) {
//         // this.makeUnique(record.symbol)
//         if (!this.macros.has(record.symbol.id)) {
//           this.macros.set(record.symbol.id, {
//             renderer: new MacroRenderer({
//               regl: this.regl,
//               image: record.symbol.shapes,
//               flatten: record.symbol.flatten,
//             }),
//             records: [],
//             macro: record.symbol,
//           })
//         }
//         this.macros.get(record.symbol.id)!.records.push(record as Shapes.Pad)
//       }
//     })
//     this.macros.forEach((macro) => {
//       macro.records.sort((a, b) => {
//         return b.index - a.index
//       })
//     })
//     // console.log('refreshed macros', this.macros.size)
//     return this
//   }
// }

// export class StepAndRepeatCollection {
//   public steps: StepAndRepeatRenderer[] = []
//   private regl: REGL.Regl

//   constructor(props: { regl: REGL.Regl }) {
//     const { regl } = props
//     this.regl = regl
//   }

//   public refresh(image: Shapes.Shape[]): this {
//     this.steps.length = 0
//     image.forEach((record) => {
//       if (record.type != FeatureTypeIdentifier.STEP_AND_REPEAT) {
//         return
//       }
//       this.steps.push(
//         new StepAndRepeatRenderer({
//           regl: this.regl,
//           record: record,
//         }),
//       )
//     })
//     return this
//   }
// }

// function drawPolyline(record: Shapes.PolyLine, shapes: ShapesList): void {
//   let endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Null
//   if (record.pathtype == "round") {
//     endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Round
//   } else if (record.pathtype == "square") {
//     endSymbolType = Symbols.STANDARD_SYMBOLS_MAP.Square
//   }

//   const endSymbol = new Symbols.StandardSymbol({
//     id: "polyline-cap",
//     symbol: endSymbolType,
//     width: record.width,
//     height: record.width,
//     outer_dia: record.width,
//   })

//   const lineSymbol = new Symbols.StandardSymbol({
//     id: "polyline-line",
//     symbol: Symbols.STANDARD_SYMBOLS_MAP.Null,
//     width: record.width,
//     height: record.width,
//     outer_dia: record.width,
//   })

//   let prevx = record.xs
//   let prevy = record.ys
//   for (let i = 0; i < record.lines.length; i++) {
//     const { x, y } = record.lines[i]
//     const prevAngle = Math.atan2(y - prevy, x - prevx)
//     const prevAngleDeg = (prevAngle * 180) / Math.PI

//     if (i == 0) {
//       shapes.pads.push(
//         new Shapes.Pad({
//           x: prevx,
//           y: prevy,
//           rotation: prevAngleDeg,
//           symbol: endSymbol,
//           polarity: record.polarity,
//           index: record.index,
//         }),
//       )
//     }

//     const line = new Shapes.Line({
//       xs: prevx,
//       ys: prevy,
//       xe: x,
//       ye: y,
//       symbol: lineSymbol,
//       polarity: record.polarity,
//       index: record.index,
//     })
//     shapes.lines.push(line)

//     if (i == record.lines.length - 1) {
//       shapes.pads.push(
//         new Shapes.Pad({
//           x: x,
//           y: y,
//           rotation: prevAngleDeg,
//           symbol: endSymbol,
//           polarity: record.polarity,
//           index: record.index,
//         }),
//       )
//     } else {
//       const nextAngle = Math.atan2(record.lines[i + 1].y - y, record.lines[i + 1].x - x)
//       if (record.cornertype == "round") {
//         shapes.pads.push(
//           new Shapes.Pad({
//             x: x,
//             y: y,
//             symbol: endSymbol,
//             polarity: record.polarity,
//             index: record.index,
//           }),
//         )
//       } else if (record.cornertype == "chamfer") {
//         const deltaAngle = Math.abs(nextAngle - prevAngle)
//         const base = Math.abs(record.width * Math.sin(deltaAngle / 2))
//         const height = Math.abs(record.width * Math.cos(deltaAngle / 2)) / 2
//         let angle = (prevAngle + nextAngle) / 2
//         if (nextAngle - prevAngle < 0) {
//           angle += Math.PI
//         }
//         const angle2 = angle + Math.PI / 2
//         const offsetx = Math.cos(angle2) * -(height / 2)
//         const offsety = Math.sin(angle2) * -(height / 2)
//         const tringle = new Symbols.TriangleSymbol({
//           id: "polyline-chamfer",
//           width: base,
//           height: height,
//         })
//         const pad = new Shapes.Pad({
//           x: x + offsetx,
//           y: y + offsety,
//           rotation: (angle * 180) / Math.PI,
//           symbol: tringle,
//           polarity: record.polarity,
//           index: record.index,
//         })
//         shapes.pads.push(pad)
//       } else if (record.cornertype == "miter") {
//         const deltaAngle = Math.abs(nextAngle - prevAngle)
//         const base = Math.abs(record.width * Math.sin(deltaAngle / 2))
//         const height = Math.abs(record.width * Math.cos(deltaAngle / 2)) / 2
//         let angle = (prevAngle + nextAngle) / 2
//         if (nextAngle - prevAngle < 0) {
//           angle += Math.PI
//         }
//         const angle2 = angle + Math.PI / 2
//         const offsetx = Math.cos(angle2) * -(height / 2)
//         const offsety = Math.sin(angle2) * -(height / 2)
//         const tringle = new Symbols.TriangleSymbol({
//           id: "polyline-chamfer",
//           width: base,
//           height: height,
//         })
//         const pad = new Shapes.Pad({
//           x: x + offsetx,
//           y: y + offsety,
//           rotation: (angle * 180) / Math.PI,
//           symbol: tringle,
//           polarity: record.polarity,
//           index: record.index,
//         })
//         shapes.pads.push(pad)
//         const height2 = Math.abs((base / 2) * Math.tan(deltaAngle / 2))
//         const offsetx2 = Math.cos(angle2) * -(height + height2 / 2)
//         const offsety2 = Math.sin(angle2) * -(height + height2 / 2)
//         const tringle2 = new Symbols.TriangleSymbol({
//           id: "polyline-chamfer",
//           width: base,
//           height: height2,
//         })
//         const pad2 = new Shapes.Pad({
//           x: x + offsetx2,
//           y: y + offsety2,
//           rotation: ((angle + Math.PI) * 180) / Math.PI,
//           symbol: tringle2,
//           polarity: record.polarity,
//           index: record.index,
//         })
//         shapes.pads.push(pad2)
//       }
//     }
//     prevx = x
//     prevy = y
//   }
// }

// export function fixedTextureData(
//   maxTextureSize: number,
//   inputData: number[],
// ): {
//   width: number
//   height: number
//   data: number[]
// } {
//   if (inputData.length > Math.pow(maxTextureSize, 2)) {
//     throw new Error("Cannot fit data into size")
//   }
//   const width = inputData.length < maxTextureSize ? inputData.length % maxTextureSize : maxTextureSize
//   const height = Math.ceil(inputData.length / maxTextureSize)

//   const data = new Array(width * height).fill(0).map((_, index) => {
//     return inputData[index] ?? 0
//   })
//   return { width, height, data }
// }
