import * as Shapes from "./shape/shape"
import * as Symbols from "./shape/symbol/symbol"
import { FeatureTypeIdentifiers, FeatureTypeIdentifier, AttributesType } from "../engine/types"
import earcut from "earcut"
import { fontInfo as cozetteFontInfo } from "./shape/text/cozette/font"
import { Transform } from "../engine/transform"
import { TypedEventTarget } from "typescript-event-target"
import { cyrb64 } from '../engine/utils'

export interface BufferEvents {
  update: Event
}

interface BufferCollection<T extends Shapes.Shape> extends TypedEventTarget<BufferEvents> {
  create(shape: T): number
  read(index: number): T
  update(index: number, shape: T): void
  delete(index: number): void
  clear(): void
  length: number
}

const STARTING_BUFFER_BYTE_LENGTH = 64 // 1 KB

export abstract class SymbolBufferCollection {
  public static buffer: ArrayBuffer = new ArrayBuffer(Symbols.SYMBOL_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT * 1) // 1 symbol
  public static length: number = 1
  public static events: TypedEventTarget<BufferEvents> = new TypedEventTarget<BufferEvents>()

  /**
   * Create a new symbol in the collection, returns the symbol number "sym_num" of the symbol
   * @param symbol
   * @returns the index of the symbol in the collection
   * @throws Error if the buffer overflows
   */
  static create(symbol: Symbols.StandardSymbol): number {
    let view = new Float32Array(this.buffer)
    for (let i = 0; i < this.length; i += 1) {
      let existingSymbol = true
      const offset = i * Symbols.SYMBOL_PARAMETERS.length
      for (let j = 0; j < Symbols.SYMBOL_PARAMETERS.length; j++) {
        // Check if the symbol already exists in the collection
        const precision = Math.pow(10, 8) // 8 decimal places
        const compareValue = Math.round(view[offset + j] * precision) / precision // Round to avoid floating point precision issues
        if (compareValue !== symbol[Symbols.SYMBOL_PARAMETERS[j]]) {
          existingSymbol = false
          break
        }
      }
      if (existingSymbol) {
        // If we found an existing symbol, we return its index
        symbol.sym_num.value = i
        return i
      }
    }
    const index = this.length
    // if the buffer isn't large enough, we need to expand it
    if (view.length < (index + 1) * Symbols.SYMBOL_PARAMETERS.length) {
      // double the size of the buffer and add additional room for the parameters
      const newBufferSize = (view.length * 2 + Symbols.SYMBOL_PARAMETERS.length) * Float32Array.BYTES_PER_ELEMENT
      this.buffer = this.buffer.transfer(newBufferSize)
      view = new Float32Array(this.buffer)
    }
    view.set(
      Symbols.SYMBOL_PARAMETERS.map((key) => symbol[key]),
      index * Symbols.SYMBOL_PARAMETERS.length,
    )
    symbol.sym_num.value = index
    this.length += 1
    this.events.dispatchTypedEvent("update", new Event("update"))
    return index
  }

  /**
   * Read a symbol from the collection by its index
   * @param index - the index of the symbol in the collection
   * @returns
   */
  static read(index: number): Symbols.StandardSymbol {
    const view = new Float32Array(this.buffer)
    if (index < 0 || index >= view.length / Symbols.SYMBOL_PARAMETERS.length) {
      throw new Error("Index out of bounds when reading symbol")
    }
    const symbol = new Symbols.StandardSymbol({})
    for (let i = 0; i < Symbols.SYMBOL_PARAMETERS.length; i++) {
      symbol[Symbols.SYMBOL_PARAMETERS[i]] = view[index * Symbols.SYMBOL_PARAMETERS.length + i]
    }
    symbol.id = `${Symbols.STANDARD_SYMBOLS[symbol.symbol]}_${index}` // Assign an ID to the symbol
    return symbol
  }

  static toJSON(): Symbols.TStandardSymbol[] {
    const view = new Float32Array(this.buffer)
    const symbols: Symbols.TStandardSymbol[] = []
    for (let i = 0; i < this.length; i++) {
      const symbol = new Symbols.StandardSymbol({})
      for (let j = 0; j < Symbols.SYMBOL_PARAMETERS.length; j++) {
        symbol[Symbols.SYMBOL_PARAMETERS[j]] = view[i * Symbols.SYMBOL_PARAMETERS.length + j]
      }
      symbol.id = `${Symbols.STANDARD_SYMBOLS[symbol.symbol]}_${i}` // Assign an ID to the symbol
      symbols.push(symbol)
    }
    return symbols
  }

  static onUpdate(callback: (event: Event) => void): void {
    this.events.addEventListener("update", callback)
  }
}

class PrimitiveBufferCollection<T extends Shapes.Primitive> extends TypedEventTarget<BufferEvents> implements BufferCollection<T> {
  public buffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  public view: Float32Array = new Float32Array(this.buffer)
  public readonly properties: string[]
  public readonly typeIdentifier: FeatureTypeIdentifiers
  public macros: (T | undefined)[] = []
  public length = 0
  // public events = new TypedEventTarget<BufferEvents>()

  constructor(properties: string[], typeIdentifier: FeatureTypeIdentifiers) {
    super()
    this.properties = properties
    this.typeIdentifier = typeIdentifier
  }

  create(shape: T): number {
    // Implementation for creating a shape in the buffer
    // Check if the buffer is large enough to hold the new shape
    if (this.view.length < (this.length + 1) * this.properties.length) {
      // double the size of the buffer and add additional room for the properties
      this.buffer = this.buffer.transfer((this.view.length * 2 + this.properties.length) * Float32Array.BYTES_PER_ELEMENT)
      this.view = new Float32Array(this.buffer)
    }

    // Check if the shape has a symbol and create it if it does
    const index = this.length
    this.fixSymbolGetter(shape)
    if (shape.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
      SymbolBufferCollection.create(shape.symbol)
    } else {
      MacroArtworkCollection.create(shape.symbol)
      this.macros[index] = shape
    }
    const shapeData = this.properties.map((key) => shape[key])
    this.view.set(shapeData, index * this.properties.length)
    this.length += 1
    this.dispatchTypedEvent("update", new Event("update"))
    return index // Return the index of the newly created shape
  }

  read(index: number): T {
    // Implementation for reading a shape from the buffer
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    const shape: T = {
      type: this.typeIdentifier,
    } as T
    for (let i = 0; i < this.properties.length; i++) {
      shape[this.properties[i]] = this.view[index * this.properties.length + i]
    }
    // Add symbol if it exists
    shape.symbol = SymbolBufferCollection.read(shape.sym_num)
    if (this.macros[index]) {
      shape.symbol = this.macros[index].symbol
    }
    return shape
  }

  update(index: number, shape: T): void {
    // Implementation for updating a shape in the buffer
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    // Update symbol if it changes
    this.fixSymbolGetter(shape)
    if (shape.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
      SymbolBufferCollection.create(shape.symbol)
      this.macros[index] = undefined
    } else {
      MacroArtworkCollection.create(shape.symbol)
      this.macros[index] = shape
    }
    const shapeData = this.properties.map((key) => shape[key])
    for (let i = 0; i < this.properties.length; i++) {
      this.view[index * this.properties.length + i] = shapeData[i]
    }
    this.dispatchTypedEvent("update", new Event("update"))
  }

  delete(index: number): void {
    // Implementation for deleting a shape from the buffer
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    // set all values to NaN to mark as deleted
    for (let i = 0; i < this.properties.length; i++) {
      this.view[index * this.properties.length + i] = NaN
    }
    this.macros[index] = undefined
    this.dispatchTypedEvent("update", new Event("update"))
  }

  clear(): void {
    this.view.fill(0)
    this.length = 0
    this.macros = []
    this.dispatchTypedEvent("update", new Event("update"))
  }

  private isGetter(obj: Shapes.Primitive, prop: string): boolean {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
    if (descriptor === undefined) {
      return false
    }
    return !!Object.getOwnPropertyDescriptor(obj, prop)!["get"]
  }

  private fixSymbolGetter(record: Shapes.Primitive): void {
    if (!this.isGetter(record, "sym_num")) {
      Object.defineProperty(record, "sym_num", {
        get: function (): number {
          return this.symbol.sym_num.value
        },
      })
    }
  }
}

export class SurfaceBufferCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.Surface> {
  public surfaces: (Shapes.Surface | null)[] = []

  verticesBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  contourPolarityBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  contourOffsetBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  contourIndexBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  contourVertexQtyBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  indiciesBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  qtyContours: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  surfaceIndexBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  surfacePolarityBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  surfaceOffsetBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  verticesView: Float32Array = new Float32Array(this.verticesBuffer)
  contourPolarityView: Float32Array = new Float32Array(this.contourPolarityBuffer)
  contourOffsetView: Float32Array = new Float32Array(this.contourOffsetBuffer)
  contourIndexView: Float32Array = new Float32Array(this.contourIndexBuffer)
  contourVertexQtyView: Float32Array = new Float32Array(this.contourVertexQtyBuffer)
  indiciesView: Float32Array = new Float32Array(this.indiciesBuffer)
  qtyContoursView: Float32Array = new Float32Array(this.qtyContours)
  surfaceIndexView: Float32Array = new Float32Array(this.surfaceIndexBuffer)
  surfacePolarityView: Float32Array = new Float32Array(this.surfacePolarityBuffer)
  surfaceOffsetView: Float32Array = new Float32Array(this.surfaceOffsetBuffer)

  verticesDimensions: [number, number] = [0, 0]
  length: number = 0

  bufferMap: ({
    bufferOffset: number
    bufferLength: number
    textureOffset: number
    textureLength: number
  } | null)[] = []

  bufferOffset: number = 0
  textureOffset: number = 0

  public updateBuffers(index: number): void {
    const surface = this.surfaces[index]

    if (!surface) {
      // If the record is null, empty the buffers for this index
      const locations = this.bufferMap[index]
      if (locations) {
        this.verticesView.fill(0, locations.textureOffset, locations.textureOffset + locations.textureLength)
        this.indiciesView.fill(0, locations.bufferOffset * 3, locations.bufferOffset * 3 + locations.bufferLength * 3)
        this.contourPolarityView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.contourOffsetView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.contourIndexView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.contourVertexQtyView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.qtyContoursView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.surfaceIndexView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.surfacePolarityView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.surfaceOffsetView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
      }
      return
    }
    let contourOffset = 0
    let contourIndex = 0

    const bufferOffset = this.bufferOffset
    const textureOffset = this.textureOffset

    let totalTrianglesCount = bufferOffset
    let indiciesOffset = bufferOffset * 3
    let verticesOffset = textureOffset
    let surfaceOffset = textureOffset

    const surfaceBufferStart = totalTrianglesCount
    surface.contours.map((contour) => {
      const contourBufferStart = totalTrianglesCount

      const vertices = this.getVertices(contour)

      // Check if the vertices buffer is large enough to hold the new vertices
      if (this.verticesView.length < verticesOffset + vertices.length) {
        // Double the size of the buffer and add additional room for the new vertices
        // const newBufferSize = (this.verticesView.length * 2 + vertices.length) * Float32Array.BYTES_PER_ELEMENT
        const { width, height } = this.fixedTextureData(1024, this.verticesView.length * 2 + vertices.length)
        const newBufferSize = width * height * Float32Array.BYTES_PER_ELEMENT
        this.verticesBuffer = this.verticesBuffer.transfer(newBufferSize)
        this.verticesView = new Float32Array(this.verticesBuffer)
      }

      // texture
      this.verticesView.set(vertices, verticesOffset)
      verticesOffset += vertices.length

      const ears = earcut(vertices)
      const numTriangles = ears.length / 3
      totalTrianglesCount += numTriangles

      // Check if the buffers are large enough to hold the new triangles
      if (this.surfaceIndexView.length < totalTrianglesCount) {
        // Double the size of the buffer and add additional room for the new triangles
        const newBufferSize = (this.surfaceIndexView.length * 2 + numTriangles) * Float32Array.BYTES_PER_ELEMENT
        this.indiciesBuffer = this.indiciesBuffer.transfer(newBufferSize * 3)
        this.contourPolarityBuffer = this.contourPolarityBuffer.transfer(newBufferSize)
        this.contourOffsetBuffer = this.contourOffsetBuffer.transfer(newBufferSize)
        this.contourIndexBuffer = this.contourIndexBuffer.transfer(newBufferSize)
        this.contourVertexQtyBuffer = this.contourVertexQtyBuffer.transfer(newBufferSize)
        this.qtyContours = this.qtyContours.transfer(newBufferSize)
        this.surfaceIndexBuffer = this.surfaceIndexBuffer.transfer(newBufferSize)
        this.surfacePolarityBuffer = this.surfacePolarityBuffer.transfer(newBufferSize)
        this.surfaceOffsetBuffer = this.surfaceOffsetBuffer.transfer(newBufferSize)

        this.indiciesView = new Float32Array(this.indiciesBuffer)
        this.contourPolarityView = new Float32Array(this.contourPolarityBuffer)
        this.contourOffsetView = new Float32Array(this.contourOffsetBuffer)
        this.contourIndexView = new Float32Array(this.contourIndexBuffer)
        this.contourVertexQtyView = new Float32Array(this.contourVertexQtyBuffer)
        this.qtyContoursView = new Float32Array(this.qtyContours)
        this.surfaceIndexView = new Float32Array(this.surfaceIndexBuffer)
        this.surfacePolarityView = new Float32Array(this.surfacePolarityBuffer)
        this.surfaceOffsetView = new Float32Array(this.surfaceOffsetBuffer)
      }

      // vec3
      this.indiciesView.set(ears, indiciesOffset)
      indiciesOffset += ears.length

      // float
      this.contourPolarityView.fill(contour.poly_type, contourBufferStart, totalTrianglesCount)

      // float
      this.contourOffsetView.fill(contourOffset, contourBufferStart, totalTrianglesCount)

      // float
      this.contourIndexView.fill(contourIndex, contourBufferStart, totalTrianglesCount)

      // float
      this.contourVertexQtyView.fill(vertices.length / 2, contourBufferStart, totalTrianglesCount)

      contourOffset += vertices.length
      contourIndex++
    })

    // float
    this.surfaceIndexView.fill(surface.index, surfaceBufferStart, totalTrianglesCount)

    // float
    this.surfacePolarityView.fill(surface.polarity, surfaceBufferStart, totalTrianglesCount)

    // float
    this.surfaceOffsetView.fill(surfaceOffset, surfaceBufferStart, totalTrianglesCount)

    // float
    this.qtyContoursView.fill(surface.contours.length, surfaceBufferStart, totalTrianglesCount)

    surfaceOffset = verticesOffset

    const { width, height } = this.fixedTextureData(1024, verticesOffset)
    this.verticesDimensions = [width, height]
    this.length = totalTrianglesCount

    this.bufferMap[index] = {
      bufferOffset: bufferOffset,
      bufferLength: totalTrianglesCount,
      textureOffset: textureOffset,
      textureLength: verticesOffset,
    }
    this.bufferOffset = totalTrianglesCount
    this.textureOffset = verticesOffset

    this.dispatchTypedEvent("update", new Event("update"))
  }

  clear(): void {
    this.verticesView.fill(0)
    this.contourPolarityView.fill(0)
    this.contourOffsetView.fill(0)
    this.contourIndexView.fill(0)
    this.contourVertexQtyView.fill(0)
    this.indiciesView.fill(0)
    this.qtyContoursView.fill(0)
    this.surfaceIndexView.fill(0)
    this.surfacePolarityView.fill(0)
    this.surfaceOffsetView.fill(0)

    // Reset dimensions
    this.verticesDimensions = [0, 0]

    this.length = 0
    this.bufferOffset = 0
    this.textureOffset = 0
    this.bufferMap = []
    this.surfaces = []
    this.dispatchTypedEvent("update", new Event("update"))
  }

  create(shape: Shapes.Surface): number {
    // Implementation for creating a shape in the buffer
    const index = this.surfaces.push(shape)
    this.updateBuffers(index - 1) // Update the buffers for the newly created shape
    return index - 1 // Return the index of the newly created shape
  }

  read(index: number): Shapes.Surface {
    // Implementation for reading a shape from the buffer
    if (index < 0 || index >= this.surfaces.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    const shape = this.surfaces[index]
    if (!shape) {
      throw new Error(`No shape found at index: ${index} when reading shape`)
    }
    return shape
  }

  update(index: number, shape: Shapes.Surface): void {
    // Implementation for updating a shape in the buffer
    if (index < 0 || index >= this.surfaces.length) {
      throw new Error("Index out of bounds when updating shape")
    }
    const existingShape = this.surfaces[index]
    if (!existingShape) {
      throw new Error(`No shape found at index: ${index} when updating shape`)
    }
    // Update the shape in the collection
    this.surfaces[index] = shape
    // Reinitialize buffers to reflect the updated shape
    this.updateBuffers(index) // Update the buffers for the updated shape
  }

  delete(index: number): void {
    // Implementation for deleting a shape from the buffer
    if (index < 0 || index >= this.surfaces.length) {
      throw new Error("Index out of bounds when deleting shape")
    }
    const shape = this.surfaces[index]
    if (!shape) {
      throw new Error(`No shape found at index: ${index} when deleting shape`)
    }
    // Remove the shape from the collection
    // this.surfaces.splice(index, 1)
    this.surfaces[index] = null // Mark as deleted
    // Reinitialize buffers to reflect the deletion
    this.updateBuffers(index) // Update the buffers for the deleted shape
  }

  private getVertices(contour: Shapes.Contour): number[] {
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

  private fixedTextureData(
    maxTextureSize: number,
    // inputBuffer: ArrayBuffer,
    length: number = 0,
  ): {
    width: number
    height: number
  } {
    // const view = new Float32Array(inputBuffer)
    if (length > Math.pow(maxTextureSize, 2)) {
      throw new Error("Cannot fit data into size")
    }
    if (length === 0) {
      return { width: 1, height: 1 } // Return a default size to avoid division by zero
    }
    const width = length < maxTextureSize ? length : maxTextureSize
    const height = Math.ceil(length / width)
    return { width, height }
  }
}

export class SurfacesBufferCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.Surface> {
  public surfacesWithoutHoles: SurfaceBufferCollection = new SurfaceBufferCollection()
  public surfacesWithHoles: SurfaceBufferCollection[] = []
  public surfacesMap: ({ index: number; collection: SurfaceBufferCollection } | undefined)[] = []
  public length: number = 0

  edgeLineBufferCollection: PrimitiveBufferCollection<Shapes.Line> = new PrimitiveBufferCollection<Shapes.Line>(
    [...Shapes.LINE_RECORD_PARAMETERS],
    FeatureTypeIdentifier.LINE,
  )
  edgeArcBufferCollection: PrimitiveBufferCollection<Shapes.Arc> = new PrimitiveBufferCollection<Shapes.Arc>(
    [...Shapes.ARC_RECORD_PARAMETERS],
    FeatureTypeIdentifier.ARC,
  )

  updateEdges(): void {
    this.edgeLineBufferCollection.clear()
    this.edgeArcBufferCollection.clear()
    const surfaceOutlineSymbol = new Symbols.NullSymbol({
      id: "surface-outline-symbol",
    })

    this.surfacesMap.forEach((map) => {
      if (!map) {
        return
      }
      const { index, collection } = map
      const surface = collection.read(index)
      surface.contours.forEach((contour) => {
        let xs = contour.xs
        let ys = contour.ys
        contour.segments.forEach((segment) => {
          if (segment.type === FeatureTypeIdentifier.LINESEGMENT) {
            this.edgeLineBufferCollection.create(
              new Shapes.Line({
                xs: xs,
                ys: ys,
                xe: segment.x,
                ye: segment.y,
                // index: -1,
                index: surface.index,
                symbol: surfaceOutlineSymbol,
              }),
            )
          } else {
            this.edgeArcBufferCollection.create(
              new Shapes.Arc({
                xs: xs,
                ys: ys,
                xc: segment.xc,
                yc: segment.yc,
                xe: segment.x,
                ye: segment.y,
                clockwise: segment.clockwise,
                // index: -1,
                index: surface.index,
                symbol: surfaceOutlineSymbol,
              }),
            )
          }
          // surfaceDatums.push(new Shapes.DatumPoint({
          //   x: segment.x,
          //   y: segment.y,
          // }))
          // this.shapes.pads.push(new Shapes.Pad({
          //   x: segment.x,
          //   y: segment.y,
          //   symbol: surfaceOutlineSymbol,
          // }))
          xs = segment.x
          ys = segment.y
        })
      })
    })
  }

  create(shape: Shapes.Surface): number {
    const index = this.length
    if (this.hasHoles(shape)) {
      const collection = new SurfaceBufferCollection()
      const shapeIndex = collection.create(shape)
      this.surfacesWithHoles.push(collection)
      this.surfacesMap[index] = { index: shapeIndex, collection }
    } else {
      const shapeIndex = this.surfacesWithoutHoles.create(shape)
      this.surfacesMap[index] = { index: shapeIndex, collection: this.surfacesWithoutHoles }
    }
    this.length += 1
    this.updateEdges()
    this.dispatchTypedEvent("update", new Event("update"))
    return index
  }

  read(index: number): Shapes.Surface {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    const mapping = this.surfacesMap[index]
    if (!mapping) {
      throw new Error(`No shape found at index: ${index} when reading shape`)
    }
    return mapping.collection.read(mapping.index)
  }

  update(index: number, shape: Shapes.Surface): void {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when updating shape")
    }
    const mapping = this.surfacesMap[index]
    if (!mapping) {
      throw new Error(`No shape found at index: ${index} when updating shape`)
    }
    // If the hole status has changed, we need to move the shape to the correct collection
    const currentlyHasHoles = this.hasHoles(this.read(index))
    const newHasHoles = this.hasHoles(shape)
    if (currentlyHasHoles !== newHasHoles) {
      // Remove from current collection
      mapping.collection.delete(mapping.index)
      // Add to new collection
      if (newHasHoles) {
        const collection = new SurfaceBufferCollection()
        const shapeIndex = collection.create(shape)
        this.surfacesWithHoles.push(collection)
        this.surfacesMap[index] = { index: shapeIndex, collection }
      } else {
        const shapeIndex = this.surfacesWithoutHoles.create(shape)
        this.surfacesMap[index] = { index: shapeIndex, collection: this.surfacesWithoutHoles }
      }
    } else {
      // Update in the same collection
      mapping.collection.update(mapping.index, shape)
    }
    this.updateEdges()
    this.dispatchTypedEvent("update", new Event("update"))
  }

  delete(index: number): void {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when deleting shape")
    }
    const mapping = this.surfacesMap[index]
    if (!mapping) {
      throw new Error(`No shape found at index: ${index} when deleting shape`)
    }
    mapping.collection.delete(mapping.index)
    this.surfacesMap[index] = undefined
    this.updateEdges()
    this.dispatchTypedEvent("update", new Event("update"))
  }

  clear(): void {
    this.surfacesWithoutHoles.clear()
    this.surfacesWithHoles.forEach((collection) => collection.clear())
    this.surfacesWithHoles = []
    this.surfacesMap = []
    this.length = 0
    this.edgeLineBufferCollection.clear()
    this.edgeArcBufferCollection.clear()
    this.dispatchTypedEvent("update", new Event("update"))
  }

  private hasHoles(shape: Shapes.Surface): boolean {
    return shape.contours.some((contour) => contour.poly_type === 0)
  }
}

class DatumTextBufferCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.DatumText> {
  positionBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  texcoordBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  charPositionBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  positionView: Float32Array = new Float32Array(this.positionBuffer)
  texcoordView: Float32Array = new Float32Array(this.texcoordBuffer)
  charPositionView: Float32Array = new Float32Array(this.charPositionBuffer)
  length: number = 0
  datumTexts: (Shapes.DatumText | null)[] = []

  bufferOffset: number = 0
  bufferMap: ({
    bufferOffset: number
    bufferLength: number
  } | null)[] = []

  updateBuffers(index: number): void {
    // Currently, each text is independent, so we only need to ensure the buffers are large enough
    const shape = this.datumTexts[index]
    if (!shape) {
      // If the record is null, empty the buffers for this index
      const locations = this.bufferMap[index]
      if (locations) {
        this.positionView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.texcoordView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
        this.charPositionView.fill(0, locations.bufferOffset, locations.bufferOffset + locations.bufferLength)
      }
      return
    }
    const positions: number[] = []
    const texcoords: number[] = []
    const charPosition: number[] = []
    const string = shape.text
    const x = shape.x
    const y = shape.y
    let row = 0
    let col = 0
    for (let i = 0; i < string.length; ++i) {
      const letter = string[i]
      const glyphInfo = cozetteFontInfo.characterLocation[letter]
      if (glyphInfo !== undefined) {
        positions.push(x, y)
        texcoords.push(glyphInfo.x, glyphInfo.y)
        charPosition.push(col, row)
      }
      col++
      if (letter === "\n") {
        row--
        col = 0
      }
    }

    // Check if the buffers are large enough to hold the updated text
    if (this.positionView.length < this.bufferOffset + positions.length) {
      // Double the size of the buffer and add additional room for the updated text
      const newBufferSize = (this.positionView.length * 2 + positions.length) * Float32Array.BYTES_PER_ELEMENT
      this.positionBuffer = this.positionBuffer.transfer(newBufferSize)
      this.positionView = new Float32Array(this.positionBuffer)
    }
    if (this.texcoordView.length < this.bufferOffset + positions.length) {
      // Double the size of the buffer and add additional room for the updated text
      const newBufferSize = (this.texcoordView.length * 2 + texcoords.length) * Float32Array.BYTES_PER_ELEMENT
      this.texcoordBuffer = this.texcoordBuffer.transfer(newBufferSize)
      this.texcoordView = new Float32Array(this.texcoordBuffer)
    }
    if (this.charPositionView.length < this.bufferOffset + positions.length) {
      // Double the size of the buffer and add additional room for the updated text
      const newBufferSize = (this.charPositionView.length * 2 + charPosition.length) * Float32Array.BYTES_PER_ELEMENT
      this.charPositionBuffer = this.charPositionBuffer.transfer(newBufferSize)
      this.charPositionView = new Float32Array(this.charPositionBuffer)
    }
    this.positionView.set(positions, this.bufferOffset)
    this.texcoordView.set(texcoords, this.bufferOffset) // Each text has its own texcoords starting at index * 2
    this.charPositionView.set(charPosition, this.bufferOffset)
    this.length = this.positionView.length / 2 // Each position has 2 components (x, y)
    this.bufferMap[index] = {
      bufferOffset: this.bufferOffset,
      bufferLength: positions.length,
    }
    this.bufferOffset += positions.length

    this.dispatchTypedEvent("update", new Event("update"))
  }

  create(shape: Shapes.DatumText): number {
    const index = this.datumTexts.push(shape)
    this.updateBuffers(index - 1) // Update the buffers for the newly created text
    return index // Return the index of the newly created text
  }

  read(index: number): Shapes.DatumText {
    if (index < 0 || index >= this.datumTexts.length) {
      throw new Error("Index out of bounds when reading text")
    }
    const shape = this.datumTexts[index]
    if (!shape) {
      throw new Error(`No text found at index: ${index} when reading text`)
    }
    return shape
  }

  update(index: number, shape: Shapes.DatumText): void {
    if (index < 0 || index >= this.datumTexts.length) {
      throw new Error("Index out of bounds when updating text")
    }
    const existingShape = this.datumTexts[index]
    if (!existingShape) {
      throw new Error(`No text found at index: ${index} when updating text`)
    }
    this.datumTexts[index] = shape
    this.updateBuffers(index) // Update the buffers for the updated text
  }

  delete(index: number): void {
    if (index < 0 || index >= this.datumTexts.length) {
      throw new Error("Index out of bounds when deleting text")
    }
    const shape = this.datumTexts[index]
    if (!shape) {
      throw new Error(`No text found at index: ${index} when deleting text`)
    }
    this.datumTexts[index] = null // Mark as deleted
    this.updateBuffers(index) // Update the buffers for the deleted text
  }

  clear(): void {
    this.positionView.fill(0)
    this.texcoordView.fill(0)
    this.charPositionView.fill(0)
    this.length = 0
    this.bufferOffset = 0
    this.bufferMap = []
    this.datumTexts = []
    this.dispatchTypedEvent("update", new Event("update"))
  }
}

class DatumPointBufferCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.DatumPoint> {
  positionBuffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  positionView: Float32Array = new Float32Array(this.positionBuffer)
  length: number = 0

  create(shape: Shapes.DatumPoint): number {
    const index = this.length
    // Check if the position buffer is large enough to hold the new point
    if (this.positionView.length < (index + 1) * 2) {
      // Double the size of the buffer and add additional room for the new point
      const newBufferSize = (this.positionView.length * 2 + 2) * Float32Array.BYTES_PER_ELEMENT
      this.positionBuffer = this.positionBuffer.transfer(newBufferSize)
      this.positionView = new Float32Array(this.positionBuffer)
    }
    this.positionView[index * 2] = shape.x
    this.positionView[index * 2 + 1] = shape.y
    this.length += 1
    this.dispatchTypedEvent("update", new Event("update"))
    return index // Return the index of the newly created point
  }

  read(index: number): Shapes.DatumPoint {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading point")
    }
    return new Shapes.DatumPoint({
      x: this.positionView[index * 2],
      y: this.positionView[index * 2 + 1],
    })
  }

  update(index: number, shape: Shapes.DatumPoint): void {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when updating point")
    }
    this.positionView[index * 2] = shape.x
    this.positionView[index * 2 + 1] = shape.y
    this.dispatchTypedEvent("update", new Event("update"))
  }

  delete(index: number): void {
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when deleting point")
    }
    // Set the position to NaN to mark as deleted
    this.positionView[index * 2] = NaN
    this.positionView[index * 2 + 1] = NaN
    this.dispatchTypedEvent("update", new Event("update"))
  }

  clear(): void {
    this.positionView.fill(0)
    this.length = 0
    this.dispatchTypedEvent("update", new Event("update"))
  }
}

export class StepAndRepeatCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.StepAndRepeat> {
  stepAndRepeats: ({
    repeats: Transform[]
    artwork: ArtworkBufferCollection
    index: number
  } | null)[] = []
  length: number = 0

  create(shape: Shapes.StepAndRepeat): number {
    const index = this.stepAndRepeats.push({
      repeats: shape.repeats,
      artwork: new ArtworkBufferCollection(shape.shapes),
      index: shape.index,
    })
    this.length = this.stepAndRepeats.length
    this.dispatchTypedEvent("update", new Event("update"))
    return index - 1 // Return the index of the newly created step and repeat
  }
  read(index: number): Shapes.StepAndRepeat {
    if (index < 0 || index >= this.stepAndRepeats.length) {
      throw new Error("Index out of bounds when reading step and repeat")
    }
    const shape = this.stepAndRepeats[index]
    if (!shape) {
      throw new Error(`No step and repeat found at index: ${index} when reading step and repeat`)
    }
    return new Shapes.StepAndRepeat({
      repeats: shape.repeats,
      shapes: shape.artwork.toJSON(),
      index: shape.index,
    })
  }
  update(index: number, shape: Shapes.StepAndRepeat): void {
    if (index < 0 || index >= this.stepAndRepeats.length) {
      throw new Error("Index out of bounds when updating step and repeat")
    }
    const existingShape = this.stepAndRepeats[index]
    if (!existingShape) {
      throw new Error(`No step and repeat found at index: ${index} when updating step and repeat`)
    }
    this.stepAndRepeats[index] = {
      repeats: shape.repeats,
      artwork: new ArtworkBufferCollection(shape.shapes),
      index: shape.index,
    }
    this.dispatchTypedEvent("update", new Event("update"))
  }
  delete(index: number): void {
    if (index < 0 || index >= this.stepAndRepeats.length) {
      throw new Error("Index out of bounds when deleting step and repeat")
    }
    const shape = this.stepAndRepeats[index]
    if (!shape) {
      throw new Error(`No step and repeat found at index: ${index} when deleting step and repeat`)
    }
    this.stepAndRepeats[index] = null // Mark as deleted
    this.dispatchTypedEvent("update", new Event("update"))
  }
  clear(): void {
    this.stepAndRepeats = []
    this.length = 0
    this.dispatchTypedEvent("update", new Event("update"))
  }
}

// interface ShapesCollections {
//   [key: string]: BufferCollection<Shapes.Shape>
// }

export class ArtworkBufferCollection extends TypedEventTarget<BufferEvents> implements BufferCollection<Shapes.Shape> {
  public shapes = {
    [FeatureTypeIdentifier.PAD]: new PrimitiveBufferCollection<Shapes.Pad>([...Shapes.PAD_RECORD_PARAMETERS], FeatureTypeIdentifier.PAD),
    [FeatureTypeIdentifier.LINE]: new PrimitiveBufferCollection<Shapes.Line>([...Shapes.LINE_RECORD_PARAMETERS], FeatureTypeIdentifier.LINE),
    [FeatureTypeIdentifier.ARC]: new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.ARC),
    [FeatureTypeIdentifier.SURFACE]: new SurfacesBufferCollection(),
    [FeatureTypeIdentifier.DATUM_POINT]: new DatumPointBufferCollection(),
    [FeatureTypeIdentifier.DATUM_LINE]: new PrimitiveBufferCollection<Shapes.Line>(
      [...Shapes.LINE_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_LINE,
    ),
    [FeatureTypeIdentifier.DATUM_ARC]: new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.DATUM_ARC),
    [FeatureTypeIdentifier.DATUM_TEXT]: new DatumTextBufferCollection(),
    [FeatureTypeIdentifier.STEP_AND_REPEAT]: new StepAndRepeatCollection(),
    // Add other collections as needed
  }
  public artworkMap: ({
    shape: FeatureTypeIdentifiers
    collectionIndex: number
  } | null)[] = []
  public attributeMap: AttributesType[] = []
  public get length(): number {
    return this.artworkMap.length
  }

  constructor(artwork: Shapes.Shape[] = []) {
    super()
    // Initialize the artwork with the provided shapes
    // artwork.unshift(new Shapes.DatumPoint({ x: 0, y: 0 })) // Ensure there is always a datum point at index 0
    artwork.forEach((shape) => {
      this.create(shape)
    })
  }

  create(shape: Shapes.Shape): number {
    const collection = this.shapes[shape.type]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${shape.type} when creating shape`)
    }
    shape.index = this.artworkMap.length // Assign an index to the shape
    const collectionIndex = collection.create(shape)
    this.artworkMap.push({
      shape: shape.type,
      collectionIndex,
    })
    this.attributeMap.push(shape.attributes || {}) // Store attributes
    this.dispatchTypedEvent("update", new Event("update"))
    return shape.index // return the index of the artwork
  }

  read(index: number): Shapes.Shape {
    // Implementation for reading a shape from the buffer
    const feature = this.artworkMap[index]
    if (!feature) {
      throw new Error(`No shape found at index: ${index} when reading shape`)
    }
    const collection = this.shapes[feature.shape]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${feature.shape} when reading shape`)
    }
    const shape = collection.read(feature.collectionIndex)
    shape.attributes = this.attributeMap[index] || {} // Attach attributes
    shape.index = index // Ensure the index is correct
    return shape
  }

  update(index: number, shape: Shapes.Shape): void {
    const collection = this.shapes[shape.type]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${shape.type} when updating shape`)
    }
    const feature = this.artworkMap[index]
    if (!feature) {
      throw new Error(`No shape found at index: ${index} when updating shape`)
    }
    shape.index = index // Update the index of the shape
    this.attributeMap[index] = shape.attributes || {} // Update attributes
    if (feature.shape !== shape.type) {
      // If the shape type has changed, we need to delete the old shape and create a new one
      this.delete(index)
      this.artworkMap[index] = { shape: shape.type, collectionIndex: -1 } // placeholder, will be updated below
      const newCollectionIndex = collection.create(shape)
      this.artworkMap[index].collectionIndex = newCollectionIndex
      return
    }
    collection.update(index, shape)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  delete(index: number): void {
    const feature = this.artworkMap[index]
    if (!feature) {
      throw new Error(`No shape found at index: ${index} when deleting shape`)
    }
    const collection = this.shapes[feature.shape]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${feature.shape} when deleting shape`)
    }
    this.artworkMap[index] = null // mark as deleted
    this.attributeMap[index] = {} // Remove attributes
    collection.delete(feature.collectionIndex)
    this.dispatchTypedEvent("update", new Event("update"))
  }

  toJSON(): Shapes.Shape[] {
    const artworkData: Shapes.Shape[] = []
    for (let i = 0; i < this.artworkMap.length; i++) {
      const feature = this.artworkMap[i]
      if (feature !== null) {
        artworkData.push(this.read(i))
      }
    }
    return artworkData
  }

  fromJSON(artwork: Shapes.Shape[]): void {
    artwork.forEach((shape) => {
      this.create(shape)
    })
  }

  clear(): void {
    this.artworkMap = []
    this.shapes[FeatureTypeIdentifier.PAD] = new PrimitiveBufferCollection<Shapes.Pad>([...Shapes.PAD_RECORD_PARAMETERS], FeatureTypeIdentifier.PAD)
    this.shapes[FeatureTypeIdentifier.LINE] = new PrimitiveBufferCollection<Shapes.Line>(
      [...Shapes.LINE_RECORD_PARAMETERS],
      FeatureTypeIdentifier.LINE,
    )
    this.shapes[FeatureTypeIdentifier.ARC] = new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.ARC)
    this.shapes[FeatureTypeIdentifier.SURFACE] = new SurfacesBufferCollection()
    this.shapes[FeatureTypeIdentifier.DATUM_POINT] = new DatumPointBufferCollection()
    this.shapes[FeatureTypeIdentifier.DATUM_LINE] = new PrimitiveBufferCollection<Shapes.Line>(
      [...Shapes.LINE_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_LINE,
    )
    this.shapes[FeatureTypeIdentifier.DATUM_ARC] = new PrimitiveBufferCollection<Shapes.Arc>(
      [...Shapes.ARC_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_ARC,
    )
    this.shapes[FeatureTypeIdentifier.DATUM_TEXT] = new DatumTextBufferCollection()
    this.shapes[FeatureTypeIdentifier.STEP_AND_REPEAT] = new StepAndRepeatCollection()
    // Add other collections as needed
    this.attributeMap = []
    this.dispatchTypedEvent("update", new Event("update"))
  }
}



export abstract class MacroArtworkCollection {
  public static macros: Map<string, MacroArtworkBufferCollection> = new Map<string, MacroArtworkBufferCollection>()
  public static events: TypedEventTarget<BufferEvents> = new TypedEventTarget<BufferEvents>()

  static create(symbol: Symbols.MacroSymbol): MacroArtworkBufferCollection {
    const { shapes, flatten } = symbol
    symbol.sym_num.value = 0
    const id = cyrb64(JSON.stringify([shapes, flatten])).toString() // generate a new unique ID
    const existing = this.macros.get(id)
    if (existing) {
      return existing // If a macro with the same ID already exists, return it
    }
    symbol.id = id
    const macro = new MacroArtworkBufferCollection(shapes, flatten)
    this.macros.set(symbol.id, macro)
    this.events.dispatchTypedEvent("update", new Event("update"))
    return macro
  }

  static read(id: string): MacroArtworkBufferCollection | undefined {
    return this.macros.get(id)
  }

  static update(symbol: Symbols.MacroSymbol): void {
    const { id, shapes, flatten } = symbol
    if (!this.macros.has(id)) {
      throw new Error(`No macro found with key: ${id} when updating macro`)
    }
    const macro = new MacroArtworkBufferCollection(shapes, flatten)
    this.macros.set(id, macro)
    this.events.dispatchTypedEvent("update", new Event("update"))
  }

  static delete(id: string): void {
    if (!this.macros.has(id)) {
      throw new Error(`No macro found with key: ${id} when deleting macro`)
    }
    this.macros.delete(id)
    this.events.dispatchTypedEvent("update", new Event("update"))
  }

  static onUpdate(listener: (event: Event) => void): void {
    this.events.addEventListener("update", listener)
  }
}

export class MacroArtworkBufferCollection extends ArtworkBufferCollection {
  // This class can extend the ArtworkBufferCollection to add macro-specific functionality
  // For example, you could add methods to handle macro-specific shapes or attributes
  // Currently, it inherits all functionality from ArtworkBufferCollection
  public flatten: boolean = false
  constructor(artwork: Shapes.Shape[] = [], flatten: boolean) {
    super(artwork)
    this.flatten = flatten
  }
}

export const test = (): void => {
  console.log("Test function in artwork-collection.ts")
}
