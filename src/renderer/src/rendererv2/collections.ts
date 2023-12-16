import REGL from 'regl'
import * as Records from './shapes'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import { ptr, malloc } from './utils'
import { FeatureTypeIdentifyer, FeatureTypeIdentifyers } from './types'
import {MacroRenderer} from './layer'

const { SURFACE_RECORD_PARAMETERS } = Records

const { SYMBOL_PARAMETERS } = Symbols

// interface ShaderCollection<T> {
//   dirty: boolean
//   length: number
//   records: T
//   // update: (data: T) => this
//   refresh: () => this
// }

export class PrimitiveShaderCollection {
  public records: ptr<Records.Shape>[] = []

  public pads: {
    buffer: REGL.Buffer
    length: number
  }
  public lines: {
    buffer: REGL.Buffer
    length: number
  }
  public arcs: {
    buffer: REGL.Buffer
    length: number
  }

  constructor(props: { regl: REGL.Regl; records: ptr<Records.Shape>[] }) {
    const { regl, records } = props
    this.pads = {
      buffer: regl.buffer(0),
      length: 0
    }
    this.lines = {
      buffer: regl.buffer(0),
      length: 0
    }
    this.arcs = {
      buffer: regl.buffer(0),
      length: 0
    }
    this.records = records
    this.refresh()
  }

  public refresh(): this {
    console.log('refreshing primitives', this.records.length)
    const padPrimatives = this.records.filter(
      (record) =>
        record.value.type == FeatureTypeIdentifyer.PAD &&
        record.value.symbol.value instanceof Symbols.StandardSymbol
    )
    this.pads.length = padPrimatives.length
    this.pads.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.pads.length * glFloatSize,
      data: padPrimatives.map((record) => {
        return record.value.array
      })
    })
    const linePrimatives = this.records.filter(
      (record) =>
        record.value.type == FeatureTypeIdentifyer.LINE &&
        record.value.symbol.value instanceof Symbols.StandardSymbol
    )
    this.lines.length = linePrimatives.length
    this.lines.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.lines.length * glFloatSize,
      data: linePrimatives.map((record) => {
        return record.value.array
      })
    })
    const arcPrimatives = this.records.filter(
      (record) =>
        record.value.type == FeatureTypeIdentifyer.ARC &&
        record.value.symbol.value instanceof Symbols.StandardSymbol
    )
    this.arcs.length = arcPrimatives.length
    this.arcs.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.arcs.length * glFloatSize,
      data: arcPrimatives.map((record) => {
        return record.value.array
      })
    })

    return this
  }
}

export class SurfaceShaderCollection {
  public records: ptr<Records.Shape>[] = []
  private regl: REGL.Regl
  public surfaces: {
    contourTexture: REGL.Texture2D
    attributeBuffer: REGL.Buffer
  }[] = []

  constructor(props: { regl: REGL.Regl; records: ptr<Records.Shape>[] }) {
    const { regl, records } = props
    this.records = records
    this.regl = regl
    this.refresh()
  }

  public refresh(): this {
    this.surfaces.map((surface) => {
      surface.contourTexture.destroy()
      surface.attributeBuffer.destroy()
    })
    this.surfaces.length = 0
    console.log('refreshing surfaces', this.records.length)
    this.records.forEach((record) => {
      if (record.value.type != FeatureTypeIdentifyer.SURFACE) {
        return
      }
      const surfaces = record.value.array
      const surfaceCountours = record.value.contoursArray
      const radius = Math.ceil(Math.sqrt(surfaceCountours.length))
      const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
        return surfaceCountours[index] ?? Records.END_SURFACE_ID
      })
      this.surfaces.push({
        contourTexture: this.regl.texture({
          width: radius,
          height: radius,
          type: 'float',
          format: 'luminance',
          wrap: 'clamp',
          data: newData
        }),
        attributeBuffer: this.regl.buffer({
          usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
          type: 'float',
          length: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
          data: surfaces
        })
      })
    })
    return this
  }
}

export class MacroCollection {
  public records: ptr<Records.Shape>[] = []
  public macros: MacroRenderer[] = []
  private regl: REGL.Regl
  constructor(props: { regl: REGL.Regl; records: ptr<Records.Shape>[] }) {
    const { records, regl } = props
    this.regl = regl
    this.records = records
    this.refresh()
  }

  public refresh(): this {
    this.macros.length = 0
    this.records.forEach((record) => {
      if (record.value.type != FeatureTypeIdentifyer.PAD) {
        return
      }
      if (record.value.symbol.value instanceof Symbols.MacroSymbol) {
        this.macros.push(new MacroRenderer({
          regl: this.regl,
          pad: record as ptr<Records.Pad>,
        }))
      }
    })
    return this
  }
}

export class SymbolCollection {
  public symbols: Map<string, ptr<Symbols.StandardSymbol>> = new Map<
    string,
    ptr<Symbols.StandardSymbol>
  >()
  get length(): number {
    return this.symbols.size
  }

  protected makeUnique(symbolPtr: ptr<Symbols.StandardSymbol>): string {
    if (this.symbols.has(symbolPtr.value.id)) {
      if (
        this.symbols.get(symbolPtr.value.id)!.value.array.toString() ==
        symbolPtr.value.array.toString()
      ) {
        console.log(`Identical Symbol with id ${symbolPtr.value.id} already exists`)
        symbolPtr.value = this.symbols.get(symbolPtr.value.id)!.value
        return symbolPtr.value.id
      }
      if (symbolPtr.value.id.match(/\+\d+$/)) {
        const [base, count] = symbolPtr.value.id.split('+')
        symbolPtr.value.id = `${base}+${Number(count) + 1}`
        return this.makeUnique(symbolPtr)
      }
      symbolPtr.value.id = `${symbolPtr.value.id}+${1}`
      return this.makeUnique(symbolPtr)
    }
    return symbolPtr.value.id
  }
}

export class SymbolShaderCollection extends SymbolCollection {
  public records: ptr<Records.Shape>[] = []
  public texture: REGL.Texture2D

  constructor(props: { regl: REGL.Regl; records: ptr<Records.Shape>[] }) {
    super()
    const { regl, records } = props
    this.records = records
    this.texture = regl.texture()
    this.refresh()
  }

  public refresh(): this {
    this.symbols.clear()
    this.records.forEach((record) => {
      if (record.value.type == FeatureTypeIdentifyer.SURFACE) {
        return
      }
      if (record.value.symbol.value instanceof Symbols.StandardSymbol) {
        this.makeUnique(record.value.symbol as ptr<Symbols.StandardSymbol>)
        this.symbols.set(
          record.value.symbol.value.id,
          record.value.symbol as ptr<Symbols.StandardSymbol>
        )
      }
    })
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
      symbol.value.sym_num = i
      return symbol.value.array
    })
    this.texture({
      width: SYMBOL_PARAMETERS.length,
      height: symbols.length,
      type: 'float',
      format: 'luminance',
      data: symbols
    })
    return this
  }
}
