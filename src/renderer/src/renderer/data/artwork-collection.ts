import * as Shapes from "../engine/step/layer/shape/shape"
import * as Symbols from "../engine/step/layer/shape/symbol/symbol"
import { FeatureTypeIdentifiers, toMap, FeatureTypeIdentifier, AttributesType, Binary } from "../engine/types"
import earcut from "earcut"

interface BufferCollection<T extends Shapes.Shape> {
  create(shape: T): number
  read(index: number): T
  update(index: number, shape: T): void
  delete(index: number): void
  length: number
}

// interface AttributeCollection {
//   attributes: AttributesType[];
// }

// const AttributesCollection: AttributeCollection = {
//   attributes: []
// }

const STARTING_BUFFER_BYTE_LENGTH = 64 // 1 KB

interface SymbolBufferCollectionType {
  buffer: ArrayBuffer
  /**
   * create a new symbol in the collection, returns the symbol number "sym_num" of the symbol
   * @param symbol
   */
  create(symbol: Symbols.StandardSymbol): number
  read(index: number): Symbols.StandardSymbol
  toJSON(): Symbols.TStandardSymbol[]
  length: number
}

export const SymbolBufferCollection: SymbolBufferCollectionType = {
  buffer: new ArrayBuffer(Symbols.SYMBOL_PARAMETERS.length * Float32Array.BYTES_PER_ELEMENT * 1), // 1 symbol
  length: 1,
  /**
   * Create a new symbol in the collection, returns the symbol number "sym_num" of the symbol
   * @param symbol
   * @returns the index of the symbol in the collection
   * @throws Error if the buffer overflows
   */
  create(symbol: Symbols.StandardSymbol): number {
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
    // if ((this.length + 1) * Symbols.SYMBOL_PARAMETERS.length > view.length) {
    //   throw new Error("Buffer overflow when creating symbol")
    // }
    const index = this.length

    // if the buffer isnt large enough, we need to expand it
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
    return index
  },
  /**
   * Read a symbol from the collection by its index
   * @param index - the index of the symbol in the collection
   * @returns
   */
  read(index: number): Symbols.StandardSymbol {
    const view = new Float32Array(this.buffer)
    if (index < 0 || index >= view.length / Symbols.SYMBOL_PARAMETERS.length) {
      throw new Error("Index out of bounds when reading symbol")
    }
    const symbol = new Symbols.StandardSymbol({})
    for (let i = 0; i < Symbols.SYMBOL_PARAMETERS.length; i++) {
      symbol[Symbols.SYMBOL_PARAMETERS[i]] = view[index * Symbols.SYMBOL_PARAMETERS.length + i]
    }
    // TODO: Assign an ID to the symbol based on its type and properties
    symbol.id = `${Symbols.STANDARD_SYMBOLS[symbol.symbol]}_${index}` // Assign an ID to the symbol
    return symbol
  },
  toJSON(): Symbols.TStandardSymbol[] {
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
}


class PrimitiveBufferCollection<T extends Shapes.Primitive> implements BufferCollection<T> {
  public buffer: ArrayBuffer = new ArrayBuffer(STARTING_BUFFER_BYTE_LENGTH)
  public view: Float32Array = new Float32Array(this.buffer)
  public readonly properties: string[]
  public readonly typeIdentifier: FeatureTypeIdentifiers
  public attributes: AttributesType[] = []
  // public shapeType: (SymbolBufferCollectionType|MacroArtworkCollectionType)[] = []
  public macros: ({macroId: string, shape: T} | undefined)[] = []
  public length = 0

  constructor(properties: string[], typeIdentifier: FeatureTypeIdentifiers) {
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
    if (shape.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
      this.fixSymbolGetter(shape)
      SymbolBufferCollection.create(shape.symbol)
      // this.shapeType.push(SymbolBufferCollection)
    } else {
      this.fixSymbolGetter(shape)
      const artwork = MacroArtworkCollection.create(shape.symbol)
      // this.shapeType.push(MacroArtworkCollection)
      // this.macros.push({artwork, shape})
      this.macros[index] = {macroId: shape.symbol.id, shape}
    }
    const shapeData = this.properties.map((key) => shape[key])
    this.view.set(shapeData, index * this.properties.length)
    this.attributes[index] = shape.attributes || {}
    this.length += 1
    return index // Return the index of the newly created shape
  }

  read(index: number): T {
    // Implementation for reading a shape from the buffer
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    const shape: T = {
      type: this.typeIdentifier,
      attributes: this.attributes[index] || {},
    } as T
    for (let i = 0; i < this.properties.length; i++) {
      shape[this.properties[i]] = this.view[index * this.properties.length + i]
    }
    // Add symbol if it exists
    shape.symbol = SymbolBufferCollection.read(shape.sym_num)
    if (this.macros[index]) {
      shape.symbol = this.macros[index].shape.symbol
    }
    return shape
  }

  update(index: number, shape: T): void {
    // Implementation for updating a shape in the buffer
    if (index < 0 || index >= this.length) {
      throw new Error("Index out of bounds when reading shape")
    }
    // Update attributes if they exist
    this.attributes[index] = shape.attributes || {}
    // Update symbol if it changes
    if (shape.symbol.type === FeatureTypeIdentifier.SYMBOL_DEFINITION) {
      SymbolBufferCollection.create(shape.symbol)
      this.macros[index] = undefined
    } else {
      // throw new Error(`Invalid symbol type: ${shape.symbol.type} when updating shape`)
      const artwork = MacroArtworkCollection.create(shape.symbol)
      this.macros[index] = {macroId: shape.symbol.id, shape}

    }
    const shapeData = this.properties.map((key) => shape[key])
    for (let i = 0; i < this.properties.length; i++) {
      this.view[index * this.properties.length + i] = shapeData[i]
    }
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
    // Optionally, you could also remove the attributes for this index
    this.attributes[index] = {}
    this.macros[index] = undefined
  }

  private isGetter(obj, prop): boolean {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
    if (descriptor === undefined) {
      return false
    }
    return !!Object.getOwnPropertyDescriptor(obj, prop)!["get"]
  }

  private fixSymbolGetter(record: Shapes.Pad | Shapes.Line | Shapes.Arc | Shapes.DatumArc | Shapes.DatumLine | Shapes.DatumPoint): void {
    if (!this.isGetter(record, "sym_num")) {
      Object.defineProperty(record, "sym_num", {
        get: function (): number {
          return this.symbol.sym_num.value
        },
      })
    }
  }
}

class SurfaceBufferCollection implements BufferCollection<Shapes.Surface> {
  // private static readonly MAX_BYTE_LENGTH = 1024 * 1024 * 1 // 1 MB

  public surfaces: (Shapes.Surface | null)[] = []
  public surfaceWithHoles: SurfaceBufferCollection[] = []

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

  // public initializeBuffers(): void {
  //   this.emptyBuffers()

  //   let surfaceOffset = 0
  //   let verticesOffset = 0
  //   let indiciesOffset = 0
  //   let totalTrianglesCount = 0

  //   this.surfaces.sort((a, b) => b.index - a.index)

  //   this.surfaces.forEach((surface) => {
  //     if (!surface) {
  //       // If the record is null, skip it
  //       return
  //     }
  //     let contourOffset = 0
  //     let contourIndex = 0
  //     // let surfaceTrianglesCount = 0

  //     // if (this.hasHoles(record)) {
  //     //   // If there are holes, we can't use the regular buffers. It will get treated as a separate collection
  //     //   return
  //     // }

  //     const surfaceBufferStart = totalTrianglesCount
  //     surface.contours.map((contour) => {
  //       const contourBufferStart = totalTrianglesCount

  //       const vertices = this.getVertices(contour)

  //       // Check if the vertices buffer is large enough to hold the new vertices
  //       if (this.verticesView.length < verticesOffset + vertices.length) {
  //         // Double the size of the buffer and add additional room for the new vertices
  //         const newBufferSize = (this.verticesView.length * 2 + vertices.length) * Float32Array.BYTES_PER_ELEMENT
  //         this.verticesBuffer = this.verticesBuffer.transfer(newBufferSize)
  //         this.verticesView = new Float32Array(this.verticesBuffer)
  //       }

  //       // texture
  //       this.verticesView.set(vertices, verticesOffset)
  //       verticesOffset += vertices.length

  //       const ears = earcut(vertices)
  //       const numTriangles = ears.length / 3
  //       totalTrianglesCount += numTriangles

  //       // Check if the buffers are large enough to hold the new triangles
  //       if (this.surfaceIndexView.length < totalTrianglesCount) {
  //         // Double the size of the buffer and add additional room for the new triangles
  //         const newBufferSize = (this.surfaceIndexView.length * 2 + totalTrianglesCount) * Float32Array.BYTES_PER_ELEMENT
  //         this.contourPolarityBuffer = this.contourPolarityBuffer.transfer(newBufferSize)
  //         this.contourOffsetBuffer = this.contourOffsetBuffer.transfer(newBufferSize)
  //         this.contourIndexBuffer = this.contourIndexBuffer.transfer(newBufferSize)
  //         this.contourVertexQtyBuffer = this.contourVertexQtyBuffer.transfer(newBufferSize)
  //         this.qtyContours = this.qtyContours.transfer(newBufferSize)
  //         this.surfaceIndexBuffer = this.surfaceIndexBuffer.transfer(newBufferSize)
  //         this.surfacePolarityBuffer = this.surfacePolarityBuffer.transfer(newBufferSize)
  //         this.surfaceOffsetBuffer = this.surfaceOffsetBuffer.transfer(newBufferSize)
  //         this.indiciesBuffer = this.indiciesBuffer.transfer(newBufferSize * 3)

  //         this.contourPolarityView = new Float32Array(this.contourPolarityBuffer)
  //         this.contourOffsetView = new Float32Array(this.contourOffsetBuffer)
  //         this.contourIndexView = new Float32Array(this.contourIndexBuffer)
  //         this.contourVertexQtyView = new Float32Array(this.contourVertexQtyBuffer)
  //         this.qtyContoursView = new Float32Array(this.qtyContours)
  //         this.surfaceIndexView = new Float32Array(this.surfaceIndexBuffer)
  //         this.surfacePolarityView = new Float32Array(this.surfacePolarityBuffer)
  //         this.surfaceOffsetView = new Float32Array(this.surfaceOffsetBuffer)
  //         this.indiciesView = new Float32Array(this.indiciesBuffer)
  //       }

  //       // vec3
  //       this.indiciesView.set(ears, indiciesOffset)
  //       indiciesOffset += ears.length

  //       // float
  //       this.contourPolarityView.fill(contour.poly_type, contourBufferStart, totalTrianglesCount)

  //       // float
  //       this.contourOffsetView.fill(contourOffset, contourBufferStart, totalTrianglesCount)

  //       // float
  //       this.contourIndexView.fill(contourIndex, contourBufferStart, totalTrianglesCount)

  //       // float
  //       this.contourVertexQtyView.fill(vertices.length / 2, contourBufferStart, totalTrianglesCount)

  //       contourOffset += vertices.length
  //       contourIndex++
  //     })

  //     // float
  //     this.surfaceIndexView.fill(surface.index, surfaceBufferStart, totalTrianglesCount)

  //     // float
  //     this.surfacePolarityView.fill(surface.polarity, surfaceBufferStart, totalTrianglesCount)

  //     // float
  //     this.surfaceOffsetView.fill(surfaceOffset, surfaceBufferStart, totalTrianglesCount)

  //     // float
  //     this.qtyContoursView.fill(surface.contours.length, surfaceBufferStart, totalTrianglesCount)

  //     surfaceOffset = verticesOffset
  //   })

  //   const { width, height } = this.fixedTextureData(1024, verticesOffset)
  //   this.verticesDimensions = [width, height]
  //   this.length = totalTrianglesCount

  // }

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

    // if (this.hasHoles(record)) {
    //   // If there are holes, we can't use the regular buffers. It will get treated as a separate collection
    //   return
    // }

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
  }

  emptyBuffers(): void {
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

  // get length(): number {
  //   // Return the number of valid shapes in the buffer
  //   return this.surfaces.filter((shape) => shape !== null).length
  // }

  private hasHoles(shape: Shapes.Surface): boolean {
    return shape.contours.some((contour) => contour.poly_type === 0)
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

export class ArtworkBufferCollection {
  public shapes = {
    [FeatureTypeIdentifier.PAD]: new PrimitiveBufferCollection<Shapes.Pad>([...Shapes.PAD_RECORD_PARAMETERS], FeatureTypeIdentifier.PAD),
    [FeatureTypeIdentifier.LINE]: new PrimitiveBufferCollection<Shapes.Line>([...Shapes.LINE_RECORD_PARAMETERS], FeatureTypeIdentifier.LINE),
    [FeatureTypeIdentifier.ARC]: new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.ARC),
    [FeatureTypeIdentifier.DATUM_POINT]: new PrimitiveBufferCollection<Shapes.Pad>(
      [...Shapes.PAD_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_POINT,
    ),
    [FeatureTypeIdentifier.DATUM_LINE]: new PrimitiveBufferCollection<Shapes.Line>(
      [...Shapes.LINE_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_LINE,
    ),
    [FeatureTypeIdentifier.DATUM_ARC]: new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.DATUM_ARC),
    [FeatureTypeIdentifier.SURFACE]: new SurfaceBufferCollection(),
    // Add other collections as needed
  }
  public artworkMap: {
    shape: FeatureTypeIdentifiers | null
    collectionIndex: number
  }[] = []
  public get length(): number {
    return this.artworkMap.length
  }

  constructor(artwork: Shapes.Shape[] = []) {
    // Initialize the artwork with the provided shapes
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
    //! this is technically wrong since there can be null shapes in the artwork array
    return shape.index // return the index of the artwork
  }

  read(index: number): Shapes.Shape {
    // Implementation for reading a shape from the buffer
    const feature = this.artworkMap[index]
    if (!feature) {
      throw new Error(`No shape found at index: ${index} when reading shape`)
    }
    if (feature.shape === null) {
      throw new Error(`Shape at index ${index} is deleted`)
    }
    const collection = this.shapes[feature.shape]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${feature.shape} when reading shape`)
    }
    return collection.read(feature.collectionIndex)
  }

  update(index: number, shape: Shapes.Shape): void {
    const collection = this.shapes[shape.type]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${shape.type} when updating shape`)
    }
    shape.index = index // Update the index of the shape
    collection.update(index, shape)
  }

  delete(index: number): void {
    const feature = this.artworkMap[index]
    if (!feature) {
      throw new Error(`No shape found at index: ${index} when deleting shape`)
    }
    if (feature.shape === null) {
      throw new Error(`Shape at index ${index} is already deleted when deleting shape`)
    }
    const collection = this.shapes[feature.shape]
    if (!collection) {
      throw new Error(`No collection found for shape type: ${feature.shape} when deleting shape`)
    }
    // Optionally, remove the feature from the artwork array
    this.artworkMap[index] = { shape: null, collectionIndex: -1 } // mark as deleted
    collection.delete(feature.collectionIndex)
  }

  toJSON(): Shapes.Shape[] {
    const artworkData: Shapes.Shape[] = []
    for (let i = 0; i < this.artworkMap.length; i++) {
      const feature = this.artworkMap[i]
      if (feature.shape !== null) {
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
    this.shapes[FeatureTypeIdentifier.LINE] = new PrimitiveBufferCollection<Shapes.Line>([...Shapes.LINE_RECORD_PARAMETERS], FeatureTypeIdentifier.LINE)
    this.shapes[FeatureTypeIdentifier.ARC] = new PrimitiveBufferCollection<Shapes.Arc>([...Shapes.ARC_RECORD_PARAMETERS], FeatureTypeIdentifier.ARC)
    this.shapes[FeatureTypeIdentifier.DATUM_POINT] = new PrimitiveBufferCollection<Shapes.Pad>(
      [...Shapes.PAD_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_POINT,
    )
    this.shapes[FeatureTypeIdentifier.DATUM_LINE] = new PrimitiveBufferCollection<Shapes.Line>(
      [...Shapes.LINE_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_LINE,
    )
    this.shapes[FeatureTypeIdentifier.DATUM_ARC] = new PrimitiveBufferCollection<Shapes.Arc>(
      [...Shapes.ARC_RECORD_PARAMETERS],
      FeatureTypeIdentifier.DATUM_ARC,
    )
    this.shapes[FeatureTypeIdentifier.SURFACE] = new SurfaceBufferCollection()
    // Add other collections as needed
  }
}

interface MacroArtworkCollectionType {
  macros: Map<string, MacroArtworkBufferCollection>
  create: (symbol: Symbols.MacroSymbol) => MacroArtworkBufferCollection
  read: (key: string) => MacroArtworkBufferCollection | undefined
  update: (symbol: Symbols.MacroSymbol) => void
  delete: (key: string) => void
}

export const MacroArtworkCollection: MacroArtworkCollectionType = {
  macros: new Map<string, MacroArtworkBufferCollection>(),
  create(symbol: Symbols.MacroSymbol): MacroArtworkBufferCollection {
    const { id, shapes, flatten } = symbol
    symbol.sym_num.value = 0
    if (this.macros.get(id)) {
      if (this.macros.get(id)!.flatten !== flatten) {
        console.warn(`Macro with key: ${id} already exists with different flatten value. Overwriting existing macro.`)
      }
      return this.macros.get(id)!
    }
    const macro = new MacroArtworkBufferCollection(shapes, flatten)
    this.macros.set(id, macro)
    return macro
  },
  read(id: string): MacroArtworkBufferCollection | undefined {
    return this.macros.get(id)
  },
  update(symbol: Symbols.MacroSymbol): void {
    const { id, shapes, flatten } = symbol
    if (!this.macros[id]) {
      throw new Error(`No macro found with key: ${id} when updating macro`)
    }
    const macro = new MacroArtworkBufferCollection(shapes, flatten)
    this.macros.set(id, macro)
  },
  delete(id: string): void {
    if (!this.macros[id]) {
      throw new Error(`No macro found with key: ${id} when deleting macro`)
    }
    this.macros.delete(id)
  },
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
  console.log("Symbols Ids", Symbols.STANDARD_SYMBOLS_MAP)
  console.log("Pad Ids", Shapes.PAD_RECORD_PARAMETERS_MAP)
  console.log("Line Ids", Shapes.LINE_RECORD_PARAMETERS_MAP)
  console.log("Arc Ids", Shapes.ARC_RECORD_PARAMETERS_MAP)
  const a = new ArtworkBufferCollection()
  // const surfaceIndex = a.create(
  //   new Shapes.Surface({
  //     polarity: 1,
  //     contours: [
  //       new Shapes.Contour({
  //         poly_type: 1,
  //         xs: 0,
  //         ys: 0,
  //         segments: [
  //           new Shapes.Contour_Line_Segment({
  //             x: 10,
  //             y: 10,
  //           }),
  //           new Shapes.Contour_Line_Segment({
  //             x: 20,
  //             y: 0,
  //           }),
  //           new Shapes.Contour_Line_Segment({
  //             x: 0,
  //             y: 0,
  //           }),
  //         ],
  //       }),
  //     ],
  //   }),
  // )
  // console.log(a.artwork)
  // console.log(a.collections['surface'].surfaces)
  // console.log("Created Surface, index:", surfaceIndex)
  // const surface = a.read(surfaceIndex)
  // console.log("Read Surface:", surface)
  // console.log('indiciesView', a.collections['surface'].indiciesView)
  // console.log('verticesView', a.collections['surface'].verticesView)
  // console.log('contourPolarityView', a.collections['surface'].contourPolarityView)
  // console.log('contourOffsetView', a.collections['surface'].contourOffsetView)
  // console.log('contourIndexView', a.collections['surface'].contourIndexView)
  // console.log('contourVertexQtyView', a.collections['surface'].contourVertexQtyView)
  // console.log('surfaceIndexView', a.collections['surface'].surfaceIndexView)
  // console.log('surfacePolarityView', a.collections['surface'].surfacePolarityView)
  // console.log('surfaceOffsetView', a.collections['surface'].surfaceOffsetView)
  // console.log('qtyContoursView', a.collections['surface'].qtyContoursView)
  const symbol = new Symbols.StandardSymbol({
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Square,
    width: 10,
  })
  const pad = new Shapes.Pad({
    index: 10,
    x: 2,
    y: 3,
    resize_factor: 4,
    polarity: 1,
    rotation: 5,
    symbol,
    mirror_x: 1,
    mirror_y: 1,
  })
  console.log("Creating Pad:", pad)
  const padIndex = a.create(pad)
  console.log("Pad Index:", padIndex)
  const readPad = a.read(padIndex)
  console.log("Read Pad:", readPad)
  // if (readPad.type == FeatureTypeIdentifier.PAD) {
  // readPad.x = 10 // Update the pad's x position
  // }
  // console.log("Updated Pad:", readPad)
  // a.update(padIndex, readPad)
  // const updatedPad = a.read(padIndex)
  // console.log("Updated Pad after update:", updatedPad)
  console.log("Symbol Buffer Collection:", new Float32Array(SymbolBufferCollection.buffer))
  console.log("Pad Buffer Collection:", new Float32Array(a.shapes[FeatureTypeIdentifier.PAD].buffer))
  // a.delete(padIndex);
  // console.log("Deleted Pad, trying to read again...");
  // try {
  //   const deletedPad = a.read(padIndex);
  //   console.log("Deleted Pad:", deletedPad);
  // } catch (error) {
  //   console.warn("Error reading deleted pad:", error);
  // }
  const symbo2 = new Symbols.StandardSymbol({
    symbol: Symbols.STANDARD_SYMBOLS_MAP.Square,
    width: 20,
  })
  const pad2 = new Shapes.Pad({
    index: 20,
    x: 20,
    y: 30,
    resize_factor: 4,
    polarity: 1,
    rotation: 5,
    symbol: symbol,
  })
  console.log("Creating another Pad:", pad2)
  const padIndex2 = a.create(pad2)
  console.log("Pad Index 2:", padIndex2)
  const readPad2 = a.read(padIndex2)
  console.log("Read Pad 2:", readPad2)
  // if (readPad2.type == FeatureTypeIdentifier.PAD) {
  //   readPad2.x = 20 // Update the pad's x position
  // }
  // console.log("Updated Pad 2:", readPad2)
  // a.update(padIndex2, readPad2)
  // const updatedPad2 = a.read(padIndex2)
  // console.log("Updated Pad 2 after update:", updatedPad2)
  console.log("Symbol Buffer Collection after second pad:", new Float32Array(SymbolBufferCollection.buffer))
  console.log("Pad Buffer Collection after second pad:", new Float32Array(a.shapes[FeatureTypeIdentifier.PAD].buffer))
}
