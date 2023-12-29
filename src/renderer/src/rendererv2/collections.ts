import REGL from 'regl'
import * as Records from './shapes'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import { FeatureTypeIdentifyer } from './types'
import { MacroRenderer } from './layer'
import onChange from 'on-change'

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
  private records: Records.Shape[] = []

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

  constructor(props: { regl: REGL.Regl; records: Records.Shape[] }) {
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
    // this.refresh()
  }

  public refresh(): this {
    const padPrimatives = this.records.filter(
      (record) =>
        record.type == FeatureTypeIdentifyer.PAD && record.symbol instanceof Symbols.StandardSymbol
    ).reverse()
    this.pads.length = padPrimatives.length
    // console.log('padPrimatives', padPrimatives)
    this.pads.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.pads.length * glFloatSize,
      data: padPrimatives.map((record) => {
        return record.array
      })
    })
    const linePrimatives = this.records.filter(
      (record) =>
        record.type == FeatureTypeIdentifyer.LINE && record.symbol instanceof Symbols.StandardSymbol
    ).reverse()
    this.lines.length = linePrimatives.length
    this.lines.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.lines.length * glFloatSize,
      data: linePrimatives.map((record) => {
        return record.array
      })
    })
    const arcPrimatives = this.records.filter(
      (record) =>
        record.type == FeatureTypeIdentifyer.ARC && record.symbol instanceof Symbols.StandardSymbol
    ).reverse()
    this.arcs.length = arcPrimatives.length
    this.arcs.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.arcs.length * glFloatSize,
      data: arcPrimatives.map((record) => {
        return record.array
      })
    })

    // console.log('refreshing primitives', {
    //   pads: this.pads.length,
    //   lines: this.lines.length,
    //   arcs: this.arcs.length
    // })
    return this
  }
}

export class SurfaceShaderCollection {
  private records: Records.Shape[] = []
  private regl: REGL.Regl
  public surfaces: {
    contourTexture: REGL.Texture2D
    attributeBuffer: REGL.Buffer
  }[] = []

  constructor(props: { regl: REGL.Regl; records: Records.Shape[] }) {
    const { regl, records } = props
    this.records = records
    this.regl = regl
    // this.refresh()
  }

  public refresh(): this {
    this.surfaces.map((surface) => {
      surface.contourTexture.destroy()
      surface.attributeBuffer.destroy()
    })
    this.surfaces.length = 0
    this.records.forEach((record) => {
      if (record.type != FeatureTypeIdentifyer.SURFACE) {
        return
      }
      const surfaceParameters = record.array
      const surfaceCountours = record.contoursArray
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
    this.surfaces.reverse()
    // console.log('refreshing surfaces', this.surfaces.length)
    return this
  }
}

export class SymbolCollection {
  public symbols: Map<string, Symbols.StandardSymbol> = new Map<string, Symbols.StandardSymbol>()
  get length(): number {
    return this.symbols.size
  }

  protected makeUnique(symbol: Symbols.StandardSymbol): string {
    if (this.symbols.has(symbol.id)) {
      if (this.symbols.get(symbol.id)!.array.toString() == symbol.array.toString()) {
        // console.log(`Identical Symbol with id ${symbol.id} already exists`)
        const sym = this.symbols.get(symbol.id)
        symbol = sym as Symbols.StandardSymbol
        return symbol.id
      }
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
}

export class SymbolShaderCollection extends SymbolCollection {
  private records: Records.Shape[] = []
  public texture: REGL.Texture2D

  constructor(props: { regl: REGL.Regl; records: Records.Shape[] }) {
    super()
    const { regl, records } = props
    this.records = records
    this.texture = regl.texture()
    // this.refresh()
  }

  public refresh(): this {
    this.symbols.clear()
    this.records.forEach((record) => {
      if (record.type == FeatureTypeIdentifyer.SURFACE) {
        return
      }
      if (record.symbol instanceof Symbols.StandardSymbol) {
        this.makeUnique(record.symbol)
        this.symbols.set(record.symbol.id, record.symbol as Symbols.StandardSymbol)
      } else if (record.symbol instanceof Symbols.MacroSymbol) {
        record.symbol.shapes.forEach((shape) => {
          if (shape.type == FeatureTypeIdentifyer.SURFACE) {
            return
          }
          if (shape.symbol instanceof Symbols.StandardSymbol) {
            this.makeUnique(shape.symbol)
            this.symbols.set(shape.symbol.id, shape.symbol as Symbols.StandardSymbol)
          }
        })
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
      // symbol.sym_num = i
      onChange.target(symbol).sym_num = i
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

export class MacroCollection {
  private records: Records.Shape[] = []
  public macros: Map<
    string,
    {
      renderer: MacroRenderer
      records: Records.Pad[]
    }
  > = new Map<
    string,
    {
      renderer: MacroRenderer
      records: Records.Pad[]
    }
  >()
  private regl: REGL.Regl
  constructor(props: { regl: REGL.Regl; records: Records.Shape[] }) {
    const { records, regl } = props
    this.regl = regl
    this.records = records
    // this.refresh()
  }

  public refresh(): this {
    this.macros.clear()
    this.records.forEach((record) => {
      if (record.type != FeatureTypeIdentifyer.PAD) {
        return
      }
      if (record.symbol instanceof Symbols.MacroSymbol) {
        if (!this.macros.has(record.symbol.id)) {
          this.macros.set(record.symbol.id, {
            renderer: new MacroRenderer({
              regl: this.regl,
              image: record.symbol.shapes
            }),
            records: []
          })
        }
        this.macros.get(record.symbol.id)!.records.push(record as Records.Pad)
      }
    })
    // console.log('refreshed macros', this.macros.size)
    return this
  }
}
