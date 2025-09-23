import REGL from "regl"
import * as Symbols from "@src/renderer/data/shape/symbol/symbol"
import { Binary, FeatureTypeIdentifier } from "../types"
import { MacroRenderer, StepAndRepeatRenderer } from "./shape-renderer"
import { vec2 } from "gl-matrix"
import { ArtworkBufferCollection, SymbolBufferCollection, MacroArtworkCollection } from "@src/renderer/data/artwork-collections"
import {
  ArcAttachments,
  DatumAttachments,
  DatumTextAttachments,
  LineAttachments,
  PadAttachments,
  SurfaceAttachments,
  SurfaceWithHolesAttachments,
} from "./gl-commands"

import {settings} from "../settings"

interface TShaderAttachment {
  pads: PadAttachments
  lines: LineAttachments
  arcs: ArcAttachments
  surfaces: SurfaceAttachments
  surfacesWithHoles: SurfaceWithHolesAttachments[]
  surfaceEdgeLines: LineAttachments
  surfaceEdgeArcs: ArcAttachments
  // datumPoints: PadAttachments
  datumPoints: DatumAttachments
  datumLines: LineAttachments
  datumArcs: ArcAttachments
  datumTexts: DatumTextAttachments
}

const { SYMBOL_PARAMETERS } = Symbols

export class ShapesShaderCollection {
  private regl: REGL.Regl

  public artworkBufferCollection: ArtworkBufferCollection

  public shaderAttachment: TShaderAttachment
  public stepAndRepeats: StepAndRepeatRenderer[] = []

  private refreshTimer: NodeJS.Timeout | null = null
  private refreshDelay = settings.MSPFRAME // milliseconds

  constructor(props: { regl: REGL.Regl; artwork: ArtworkBufferCollection }) {
    const { regl, artwork } = props
    this.regl = regl
    this.artworkBufferCollection = artwork

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
        positions: regl.buffer(0),
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
      datumTexts: {
        positions: regl.buffer(0),
        texcoords: regl.buffer(0),
        charPosition: regl.buffer(0),
        length: 0,
      },
      surfaces: {
        vertices: regl.texture(),
        verticiesDimensions: vec2.fromValues(0, 0),
        length: 0,
        qtyContours: regl.buffer(0),
        contourVertexQtyBuffer: regl.buffer(0),
        contourIndexBuffer: regl.buffer(0),
        contourOffsetBuffer: regl.buffer(0),
        contourPolarityBuffer: regl.buffer(0),
        indiciesBuffer: regl.buffer(0),
        surfacePolarityBuffer: regl.buffer(0),
        surfaceIndexBuffer: regl.buffer(0),
        surfaceOffsetBuffer: regl.buffer(0),
      },
      surfacesWithHoles: [],
      surfaceEdgeLines: {
        buffer: regl.buffer(0),
        length: 0,
      },
      surfaceEdgeArcs: {
        buffer: regl.buffer(0),
        length: 0,
      },
    }

    this.refresh()
    this.artworkBufferCollection.events.addEventListener("update", () => {
      this.refresh()
    })
  }

  public refresh(): this {
    if (this.refreshTimer) return this
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null
      this._refresh()
    }, this.refreshDelay)

    return this
  }

  private _refresh(): this {
    this.shaderAttachment.pads.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.PAD].view)
    this.shaderAttachment.pads.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.PAD].length
    this.shaderAttachment.lines.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.LINE].view)
    this.shaderAttachment.lines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.LINE].length
    this.shaderAttachment.arcs.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.ARC].view)
    this.shaderAttachment.arcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.ARC].length
    this.shaderAttachment.datumPoints.positions(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_POINT].positionView)
    this.shaderAttachment.datumPoints.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_POINT].length
    this.shaderAttachment.datumLines.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_LINE].view)
    this.shaderAttachment.datumLines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_LINE].length
    this.shaderAttachment.datumArcs.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_ARC].view)
    this.shaderAttachment.datumArcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_ARC].length
    this.shaderAttachment.datumTexts.positions(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_TEXT].positionView)
    this.shaderAttachment.datumTexts.texcoords(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_TEXT].texcoordView)
    this.shaderAttachment.datumTexts.charPosition(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_TEXT].charPositionView)
    this.shaderAttachment.datumTexts.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.DATUM_TEXT].length
    const surfaceCollection = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].surfacesWithoutHoles
    const [width, height] = surfaceCollection.verticesDimensions
    if (width * height != 0) {
      this.shaderAttachment.surfaces.vertices({
        width,
        height,
        type: "float32",
        channels: 1,
        wrap: "clamp",
        mag: "nearest",
        min: "nearest",
        data: new Float32Array(surfaceCollection.verticesView.buffer).slice(0, width * height),
      })
      this.shaderAttachment.surfaces.verticiesDimensions = vec2.fromValues(width, height)
      this.shaderAttachment.surfaces.length = surfaceCollection.length
      this.shaderAttachment.surfaces.qtyContours(surfaceCollection.qtyContoursView)
      this.shaderAttachment.surfaces.contourVertexQtyBuffer(surfaceCollection.contourVertexQtyView)
      this.shaderAttachment.surfaces.contourIndexBuffer(surfaceCollection.contourIndexView)
      this.shaderAttachment.surfaces.contourOffsetBuffer(surfaceCollection.contourOffsetView)
      this.shaderAttachment.surfaces.contourPolarityBuffer(surfaceCollection.contourPolarityView)
      this.shaderAttachment.surfaces.indiciesBuffer(surfaceCollection.indiciesView)
      this.shaderAttachment.surfaces.surfacePolarityBuffer(surfaceCollection.surfacePolarityView)
      this.shaderAttachment.surfaces.surfaceIndexBuffer(surfaceCollection.surfaceIndexView)
      this.shaderAttachment.surfaces.surfaceOffsetBuffer(surfaceCollection.surfaceOffsetView)
    }
    const surfaceWithHolesCollection = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].surfacesWithHoles
    this.shaderAttachment.surfacesWithHoles.map((surface) => {
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
    this.shaderAttachment.surfacesWithHoles = []
    surfaceWithHolesCollection.forEach((surface) => {
      const [width, height] = surface.verticesDimensions
      if (width * height == 0) return
      this.shaderAttachment.surfacesWithHoles.push({
        vertices: this.regl.texture({
          width,
          height,
          type: "float32",
          channels: 1,
          wrap: "clamp",
          mag: "nearest",
          min: "nearest",
          data: new Float32Array(surface.verticesView.buffer).slice(0, width * height),
        }),
        verticiesDimensions: vec2.fromValues(width, height),
        length: surface.length,
        qtyContours: this.regl.buffer(surface.qtyContoursView),
        contourVertexQtyBuffer: this.regl.buffer(surface.contourVertexQtyView),
        contourIndexBuffer: this.regl.buffer(surface.contourIndexView),
        contourOffsetBuffer: this.regl.buffer(surface.contourOffsetView),
        contourPolarityBuffer: this.regl.buffer(surface.contourPolarityView),
        indiciesBuffer: this.regl.buffer(surface.indiciesView),
        surfacePolarityBuffer: this.regl.buffer(surface.surfacePolarityView),
        surfaceIndexBuffer: this.regl.buffer(surface.surfaceIndexView),
        surfaceOffsetBuffer: this.regl.buffer(surface.surfaceOffsetView),
        surfaceIndex: surface.surfaceIndexView.at(0) || 0,
        surfacePolarity: surface.surfacePolarityView.at(0) as Binary || 0,
      })
    })

    this.shaderAttachment.surfaceEdgeLines.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeLineBufferCollection.view)
    this.shaderAttachment.surfaceEdgeLines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeLineBufferCollection.length
    this.shaderAttachment.surfaceEdgeArcs.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeArcBufferCollection.view)
    this.shaderAttachment.surfaceEdgeArcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeArcBufferCollection.length

    this.stepAndRepeats = []
    this.artworkBufferCollection.shapes[FeatureTypeIdentifier.STEP_AND_REPEAT].stepAndRepeats.forEach((sr) => {
      if (sr === null) return
      this.stepAndRepeats.push(
        new StepAndRepeatRenderer({
          regl: this.regl,
          image: sr.artwork,
          repeats: sr.repeats,
          index: sr.index,
        }),
      )
    })
    return this
  }

  public destroy(): this {

    this.shaderAttachment.pads.buffer.destroy()
    this.shaderAttachment.pads.length = 0
    this.shaderAttachment.lines.buffer.destroy()
    this.shaderAttachment.lines.length = 0
    this.shaderAttachment.arcs.buffer.destroy()
    this.shaderAttachment.arcs.length = 0
    this.shaderAttachment.datumPoints.positions.destroy()
    this.shaderAttachment.datumPoints.length = 0
    this.shaderAttachment.datumLines.buffer.destroy()
    this.shaderAttachment.datumLines.length = 0
    this.shaderAttachment.datumArcs.buffer.destroy()
    this.shaderAttachment.datumArcs.length = 0
    this.shaderAttachment.surfacesWithHoles.map((surface) => {
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
    this.shaderAttachment.surfacesWithHoles.length = 0

    this.shaderAttachment.surfaces.vertices.destroy()
    this.shaderAttachment.surfaces.qtyContours.destroy()
    this.shaderAttachment.surfaces.contourVertexQtyBuffer.destroy()
    this.shaderAttachment.surfaces.contourIndexBuffer.destroy()
    this.shaderAttachment.surfaces.contourOffsetBuffer.destroy()
    this.shaderAttachment.surfaces.contourPolarityBuffer.destroy()
    this.shaderAttachment.surfaces.indiciesBuffer.destroy()
    this.shaderAttachment.surfaces.surfacePolarityBuffer.destroy()
    this.shaderAttachment.surfaces.surfaceIndexBuffer.destroy()
    this.shaderAttachment.surfaces.surfaceOffsetBuffer.destroy()
    this.shaderAttachment.surfaces.length = 0

    this.shaderAttachment.datumTexts.positions.destroy()
    this.shaderAttachment.datumTexts.texcoords.destroy()
    this.shaderAttachment.datumTexts.charPosition.destroy()
    this.shaderAttachment.datumTexts.length = 0

    this.stepAndRepeats.forEach((sr) => {
      sr.destroy()
    })
    this.stepAndRepeats = []
    return this
  }
}

export class SymbolShaderCollection {
  public static texture: REGL.Texture2D
  public static regl: REGL.Regl
  private static refreshTimer: NodeJS.Timeout | null = null
  private static refreshDelay = settings.MSPFRAME // milliseconds

  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    SymbolShaderCollection.regl = regl
    SymbolShaderCollection.texture = regl.texture()
    this.refresh()
    SymbolBufferCollection.events.addEventListener("update", () => {
      this.refresh()
    })
  }

  public refresh(): this {
    if (SymbolShaderCollection.refreshTimer) return this
    SymbolShaderCollection.refreshTimer = setTimeout(() => {
      SymbolShaderCollection.refreshTimer = null
      this._refresh()
    }, SymbolShaderCollection.refreshDelay)
    return this
  }

  private _refresh(): this {
    if (SymbolBufferCollection.length == 0) return this
    const data = new Float32Array(SymbolBufferCollection.buffer).slice(0, SYMBOL_PARAMETERS.length * SymbolBufferCollection.length)
    SymbolShaderCollection.texture({
      width: SYMBOL_PARAMETERS.length,
      height: SymbolBufferCollection.length,
      type: "float",
      format: "luminance",
      data,
    })
    return this
  }

  public destroy(): this {
    SymbolShaderCollection.texture.destroy()
    return this
  }
}

export class MacroShaderCollection {
  public static regl: REGL.Regl
  public static macros: Map<string, MacroRenderer> = new Map<string, MacroRenderer>()
  private static refreshTimer: NodeJS.Timeout | null = null
  private static refreshDelay = settings.MSPFRAME // milliseconds
  constructor(props: { regl: REGL.Regl }) {
    const { regl } = props
    MacroShaderCollection.regl = regl
    this.refresh()
    MacroArtworkCollection.events.addEventListener("update", () => {
      this.refresh()
    })
  }

  public refresh(): this {
    if (MacroShaderCollection.refreshTimer) return this
    MacroShaderCollection.refreshTimer = setTimeout(() => {
      MacroShaderCollection.refreshTimer = null
      this._refresh()
    }, MacroShaderCollection.refreshDelay)
    return this
  }

  private _refresh(): this {
    if (MacroShaderCollection.macros.size != 0) return this
    MacroShaderCollection.macros.forEach((macro) => {
      macro.destroy()
    })
    MacroShaderCollection.macros.clear()
    MacroArtworkCollection.macros.forEach((artwork, id) => {
      const macroRenderer = new MacroRenderer({
        regl: MacroShaderCollection.regl,
        image: artwork,
      })
      MacroShaderCollection.macros.set(id, macroRenderer)
    })
    return this
  }
}

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
