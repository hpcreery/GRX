import { type ArtworkBufferCollection, MacroArtworkCollection, SymbolBufferCollection } from "@src/data/artwork-collections"
import * as Symbols from "@src/data/shape/symbol/symbol"
import { vec2 } from "gl-matrix"
import type REGL from "regl"
import { settings } from "../settings"
import { type Binary, FeatureTypeIdentifier } from "../types"
import { UpdateEventTarget } from "../utils"
import type {
  ArcAttachments,
  DatumAttachments,
  DatumTextAttachments,
  LineAttachments,
  PadAttachments,
  SurfaceAttachments,
  SurfaceWithHolesAttachments,
} from "./gl-commands"
import { MacroRenderer, StepAndRepeatRenderer } from "./shape-renderer"

interface TShaderAttachment {
  pads: PadAttachments
  lines: LineAttachments
  arcs: ArcAttachments
  surfaces: {
    withoutHoles: SurfaceAttachments
    withHoles: SurfaceWithHolesAttachments[]
    edgeLines: LineAttachments
    edgeArcs: ArcAttachments
  }
  polylines: {
    lines: LineAttachments
    pads: PadAttachments
  }
  datumPoints: DatumAttachments
  datumLines: LineAttachments
  datumArcs: ArcAttachments
  datumTexts: DatumTextAttachments
}

const { SYMBOL_PARAMETERS } = Symbols

export class ShapesShaderCollection extends UpdateEventTarget {
  private regl: REGL.Regl

  public artworkBufferCollection: ArtworkBufferCollection

  public shaderAttachment: TShaderAttachment
  public stepAndRepeats: StepAndRepeatRenderer[] = []

  private updateTimer: NodeJS.Timeout | null = null
  private updateDelay = settings.MSPFRAME // milliseconds

  constructor(props: { regl: REGL.Regl; artwork: ArtworkBufferCollection }) {
    super()
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
        withoutHoles: {
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
        withHoles: [],
        edgeLines: {
          buffer: regl.buffer(0),
          length: 0,
        },
        edgeArcs: {
          buffer: regl.buffer(0),
          length: 0,
        },
      },
      polylines: {
        lines: {
          buffer: regl.buffer(0),
          length: 0,
        },
        pads: {
          buffer: regl.buffer(0),
          length: 0,
        },
      },
    }

    this.update()
    this.artworkBufferCollection.onUpdate(() => {
      this.update()
    })
  }

  public update(): this {
    if (this.updateTimer) return this
    this.updateTimer = setTimeout(() => {
      this.updateTimer = null
      this._update()
    }, this.updateDelay)

    return this
  }

  private _update(): this {
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
      this.shaderAttachment.surfaces.withoutHoles.vertices({
        width,
        height,
        type: "float32",
        channels: 1,
        wrap: "clamp",
        mag: "nearest",
        min: "nearest",
        data: new Float32Array(surfaceCollection.verticesView.buffer).slice(0, width * height),
      })
      this.shaderAttachment.surfaces.withoutHoles.verticiesDimensions = vec2.fromValues(width, height)
      this.shaderAttachment.surfaces.withoutHoles.length = surfaceCollection.length
      this.shaderAttachment.surfaces.withoutHoles.qtyContours(surfaceCollection.qtyContoursView)
      this.shaderAttachment.surfaces.withoutHoles.contourVertexQtyBuffer(surfaceCollection.contourVertexQtyView)
      this.shaderAttachment.surfaces.withoutHoles.contourIndexBuffer(surfaceCollection.contourIndexView)
      this.shaderAttachment.surfaces.withoutHoles.contourOffsetBuffer(surfaceCollection.contourOffsetView)
      this.shaderAttachment.surfaces.withoutHoles.contourPolarityBuffer(surfaceCollection.contourPolarityView)
      this.shaderAttachment.surfaces.withoutHoles.indiciesBuffer(surfaceCollection.indiciesView)
      this.shaderAttachment.surfaces.withoutHoles.surfacePolarityBuffer(surfaceCollection.surfacePolarityView)
      this.shaderAttachment.surfaces.withoutHoles.surfaceIndexBuffer(surfaceCollection.surfaceIndexView)
      this.shaderAttachment.surfaces.withoutHoles.surfaceOffsetBuffer(surfaceCollection.surfaceOffsetView)
    }
    const surfaceWithHolesCollection = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].surfacesWithHoles
    this.shaderAttachment.surfaces.withHoles.map((surface) => {
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
    this.shaderAttachment.surfaces.withHoles = []
    surfaceWithHolesCollection.forEach((surface) => {
      const [width, height] = surface.verticesDimensions
      if (width * height == 0) return
      this.shaderAttachment.surfaces.withHoles.push({
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
        surfacePolarity: (surface.surfacePolarityView.at(0) as Binary) || 0,
      })
    })

    this.shaderAttachment.surfaces.edgeLines.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeLineBufferCollection.view)
    this.shaderAttachment.surfaces.edgeLines.length =
      this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeLineBufferCollection.length
    this.shaderAttachment.surfaces.edgeArcs.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeArcBufferCollection.view)
    this.shaderAttachment.surfaces.edgeArcs.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.SURFACE].edgeArcBufferCollection.length

    this.shaderAttachment.polylines.lines.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.POLYLINE].lineBufferCollection.view)
    this.shaderAttachment.polylines.lines.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.POLYLINE].lineBufferCollection.length
    this.shaderAttachment.polylines.pads.buffer(this.artworkBufferCollection.shapes[FeatureTypeIdentifier.POLYLINE].padBufferCollection.view)
    this.shaderAttachment.polylines.pads.length = this.artworkBufferCollection.shapes[FeatureTypeIdentifier.POLYLINE].padBufferCollection.length

    this.stepAndRepeats = []
    this.artworkBufferCollection.shapes[FeatureTypeIdentifier.STEP_AND_REPEAT].stepAndRepeats.forEach((sr) => {
      if (sr === null) return
      const stepRepeatRenerer = new StepAndRepeatRenderer({
        regl: this.regl,
        image: sr.artwork,
        repeats: sr.repeats,
        index: sr.index,
      })
      this.stepAndRepeats.push(stepRepeatRenerer)
      stepRepeatRenerer.shapeShaderAttachments.onUpdate(() => {
        this.dispatchTypedEvent("update", new Event("update"))
      })
    })
    this.dispatchTypedEvent("update", new Event("update"))
    return this
  }

  public destroy(): this {
    super.unSubscribe()
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
    this.shaderAttachment.surfaces.withHoles.map((surface) => {
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
    this.shaderAttachment.surfaces.withHoles.length = 0

    this.shaderAttachment.surfaces.withoutHoles.vertices.destroy()
    this.shaderAttachment.surfaces.withoutHoles.qtyContours.destroy()
    this.shaderAttachment.surfaces.withoutHoles.contourVertexQtyBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.contourIndexBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.contourOffsetBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.contourPolarityBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.indiciesBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.surfacePolarityBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.surfaceIndexBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.surfaceOffsetBuffer.destroy()
    this.shaderAttachment.surfaces.withoutHoles.length = 0
    this.shaderAttachment.surfaces.withoutHoles.verticiesDimensions = vec2.fromValues(0, 0)

    this.shaderAttachment.surfaces.edgeLines.buffer.destroy()
    this.shaderAttachment.surfaces.edgeLines.length = 0
    this.shaderAttachment.surfaces.edgeArcs.buffer.destroy()
    this.shaderAttachment.surfaces.edgeArcs.length = 0

    this.shaderAttachment.datumTexts.positions.destroy()
    this.shaderAttachment.datumTexts.texcoords.destroy()
    this.shaderAttachment.datumTexts.charPosition.destroy()
    this.shaderAttachment.datumTexts.length = 0

    this.shaderAttachment.polylines.lines.buffer.destroy()
    this.shaderAttachment.polylines.lines.length = 0
    this.shaderAttachment.polylines.pads.buffer.destroy()
    this.shaderAttachment.polylines.pads.length = 0

    this.stepAndRepeats.forEach((sr) => {
      sr.destroy()
    })
    this.stepAndRepeats = []
    return this
  }
}

export const initStaticShaderCollections = (regl: REGL.Regl): void => {
  console.log("Initializing static shader collections")

  // setup symbol shader collection
  SymbolShaderCollection.regl = regl
  SymbolShaderCollection.texture = regl.texture()
  SymbolShaderCollection.update()
  SymbolBufferCollection.onUpdate(() => SymbolShaderCollection.update())

  // setup macro shader collection
  MacroShaderCollection.regl = regl
  MacroShaderCollection.update()
  MacroArtworkCollection.onUpdate(() => MacroShaderCollection.update())
}

export abstract class SymbolShaderCollection {
  public static texture: REGL.Texture2D
  public static regl: REGL.Regl
  private static updateTimer: NodeJS.Timeout | null = null
  private static updateDelay = settings.MSPFRAME // milliseconds

  public static update(): void {
    if (SymbolShaderCollection.updateTimer) return
    SymbolShaderCollection.updateTimer = setTimeout(() => {
      SymbolShaderCollection.updateTimer = null
      SymbolShaderCollection._update()
    }, SymbolShaderCollection.updateDelay)
  }

  private static _update(): void {
    if (SymbolBufferCollection.length == 0) return
    const data = new Float32Array(SymbolBufferCollection.buffer).slice(0, SYMBOL_PARAMETERS.length * SymbolBufferCollection.length)
    SymbolShaderCollection.texture({
      width: SYMBOL_PARAMETERS.length,
      height: SymbolBufferCollection.length,
      type: "float",
      format: "luminance",
      data,
    })
  }

  public static destroy(): void {
    SymbolShaderCollection.texture.destroy()
  }
}

export abstract class MacroShaderCollection {
  public static regl: REGL.Regl
  public static macros: Map<string, MacroRenderer> = new Map<string, MacroRenderer>()
  private static updateTimer: NodeJS.Timeout | null = null
  private static updateDelay = settings.MSPFRAME // milliseconds

  public static update(): void {
    if (MacroShaderCollection.updateTimer) return
    MacroShaderCollection.updateTimer = setTimeout(() => {
      MacroShaderCollection.updateTimer = null
      MacroShaderCollection._update()
    }, MacroShaderCollection.updateDelay)
    return
  }

  private static _update(): void {
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
  }
}
