import REGL from 'regl'
import { IPlotRecord } from './types'
import * as Records from './records'
import * as Symbols from './symbols'
import { glFloatSize } from './constants'
import { ptr, malloc } from './utils'

const { SURFACE_RECORD_PARAMETERS } = Records

const { SYMBOL_PARAMETERS } = Symbols

interface ShaderCollection<T> {
  length: number
  records: T
  update: (data: T) => this
  refresh: () => this
}

export class ShapeShaderCollection<T extends IPlotRecord> implements ShaderCollection<T[]> {
  public records: T[] = []
  get length(): number {
    return this.records.length
  }
  public buffer: REGL.Buffer

  constructor(props: { regl: REGL.Regl; records?: T[] }) {
    this.records = props.records ?? []
    this.buffer = props.regl.buffer(0)
    this.refresh()
  }

  public update(data: T[]): this {
    this.records = data
    return this.refresh()
  }

  public refresh(): this {
    const numbers: number[][] = []
    this.records.forEach((record) => {
      numbers.push(record.array)
    })
    this.buffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: this.length * glFloatSize,
      data: numbers
    })
    return this
  }
}

export class SurfaceShaderCollection implements ShaderCollection<Records.Surface_Record> {
  public records: Records.Surface_Record = new Records.Surface_Record({})
  get length(): number {
    return this.records.length
  }
  public contourTexture: REGL.Texture2D
  public attributeBuffer: REGL.Buffer

  constructor(props: { regl: REGL.Regl; record?: Records.Surface_Record }) {
    this.records = props.record ?? new Records.Surface_Record({})
    this.contourTexture = props.regl.texture()
    this.attributeBuffer = props.regl.buffer(0)
    this.refresh()
  }

  public update(record: Records.Surface_Record): this {
    this.records = record
    return this.refresh()
  }

  public refresh(): this {
    const surfaces = this.records.array
    const surfaceCountours = this.records.contoursArray
    const radius = Math.ceil(Math.sqrt(surfaceCountours.length))
    const newData = new Array(Math.round(Math.pow(radius, 2))).fill(0).map((_, index) => {
      return surfaceCountours[index] ?? Records.END_SURFACE_ID
    })
    this.attributeBuffer({
      usage: 'dynamic', // give the WebGL driver a hint that this buffer may change
      type: 'float',
      length: SURFACE_RECORD_PARAMETERS.length * glFloatSize,
      data: surfaces
    })
    this.contourTexture({
      width: radius,
      height: radius,
      type: 'float',
      format: 'luminance',
      wrap: 'clamp',
      data: newData
    })
    return this
  }
}

export class SymbolCollection<T extends Symbols.MacroSymbol | Symbols.StandardSymbol> {
  public records: Map<string, ptr<T>> = new Map<string, ptr<T>>()
  get length(): number {
    return this.records.size
  }

  protected makeUnique(symbolPtr: ptr<T>): void {
    if (this.records.has(symbolPtr.value.id)) {
      if (this.records.get(symbolPtr.value.id)!.value.array.toString() == symbolPtr.value.array.toString()) {
        console.log(`Identical Symbol with id ${symbolPtr.value.id} already exists`)
        symbolPtr.value = this.records.get(symbolPtr.value.id)!.value
        return
      }
      if (symbolPtr.value.id.match(/\+\d+$/)) {
        const [base, count] = symbolPtr.value.id.split('+')
        symbolPtr.value.id = `${base}+${Number(count) + 1}`
        this.makeUnique(symbolPtr)
        return
      }
      symbolPtr.value.id = `${symbolPtr.value.id}+${1}`
      this.makeUnique(symbolPtr)
      return
    }
    return
  }

  public update(symbols: Map<string, ptr<T>>): this {
    this.records.clear()
    for (const [id, symbol] of symbols.entries()) {
      this.makeUnique(symbol)
      this.records.set(id, symbol)
    }
    return this
  }

  public insert(symbols: ptr<T>[]): this {
    symbols.forEach((symbol) => {
      this.makeUnique(symbol)
      this.records.set(symbol.value.id, symbol)
    })
    return this
  }
}

export class StandardSymbolShaderCollection
  extends SymbolCollection<Symbols.StandardSymbol>
  implements ShaderCollection<Map<string, ptr<Symbols.StandardSymbol>>>
{
  public texture: REGL.Texture2D

  constructor(props: { regl: REGL.Regl; symbols?: ptr<Symbols.StandardSymbol>[] }) {
    super()
    // this.records = props.records ?? []
    ;(props.symbols ?? []).forEach((symbol) => {
      this.makeUnique(symbol)
      this.records.set(symbol.value.id, symbol)
    })
    this.texture = props.regl.texture()
    this.refresh()
  }

  public update(symbols: Map<string, ptr<Symbols.StandardSymbol>>): this {
    this.records.clear()
    for (const [id, symbol] of symbols.entries()) {
      this.makeUnique(symbol)
      this.records.set(id, symbol)
    }
    return this.refresh()
  }

  public insert(symbols: ptr<Symbols.StandardSymbol>[]): this {
    symbols.forEach((symbol) => {
      this.makeUnique(symbol)
      this.records.set(symbol.value.id, symbol)
    })
    return this.refresh()
  }

  public refresh(): this {
    console.log('refreshing symbols', this.records)
    if (this.length === 0) {
      return this
    }
    // const symbols = this.records.map((symbol) => symbol.array)
    // const symbols = Object.values(this.records).map((symbol) => symbol.array)
    const symbols = Array.from(this.records.values()).map((symbol, i) => {
      symbol.value.sym_num = i
      return symbol.value.array
    })
    // TODO: make symbols not only expend in width but also in height
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
