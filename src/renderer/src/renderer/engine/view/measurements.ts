import REGL from "regl"
import { vec2 } from "gl-matrix"
import { UniverseContext } from "../engine"
import { baseUnitsConversionFactor } from "../utils"
import { RendererProps, ShapeRenderer } from "./shape-renderer"
import * as Shapes from "@src/renderer/data/shape/shape"
import { WorldContext } from "./view"
import { measurementSettings } from "@src/renderer/engine/settings"
import { ArtworkBufferCollection } from '@src/renderer/data/artwork-collections'
import { Units } from '../types'

export class SimpleMeasurement extends ShapeRenderer {
  public measurements: { point1: vec2; point2: vec2 }[] = []
  public currentMeasurement: { point1: vec2; point2: vec2 } | null = null
  public framebuffer: REGL.Framebuffer2D
  public units: Units = measurementSettings.units
  constructor(props: RendererProps) {
    super({ ...props, image: new ArtworkBufferCollection() })
    this.framebuffer = this.regl.framebuffer()
  }

  public refresh(): void {
    // TODO: Optimize by only updating changed or new measurements
    this.artwork.clear()
    const allMeasurements = [...this.measurements, this.currentMeasurement].filter((m) => m !== null)
    allMeasurements.forEach((measurement) => {
      const [x1, y1] = measurement.point1
      const [x2, y2] = measurement.point2
      const length = Math.hypot(x1 - x2, y1 - y2) / baseUnitsConversionFactor(this.units)
      const x = Math.abs(x1 - x2) / baseUnitsConversionFactor(this.units)
      const y = Math.abs(y1 - y2) / baseUnitsConversionFactor(this.units)
      this.artwork.create(
        new Shapes.DatumText({
          text: `↙${parseFloat(length.toFixed(4))}${typeof this.units == "string" ? this.units : ""}\n(ΔX:${parseFloat(x.toFixed(4))} ΔY:${parseFloat(y.toFixed(4))})`,
          x: (x1 + x2) / 2,
          y: (y1 + y2) / 2,
          attributes: {
            xs: String(x1),
            ys: String(y1),
            xe: String(x2),
            ye: String(y2),
            length: String(length),
          },
        }),
      )
      this.artwork.create(new Shapes.DatumLine({ xs: x1, ys: y1, xe: x2, ye: y2 }))
    })
  }

  public addMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.measurements.push(this.currentMeasurement)
    }
    this.currentMeasurement = { point1: point, point2: point }
    this.refresh()
  }

  public updateMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.point2 = point
      this.refresh()
    }
  }

  public finishMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      // this.currentMeasurement.point2 = point
      this.updateMeasurement(point)
      this.measurements.push(this.currentMeasurement)
      this.currentMeasurement = null
      this.refresh()
    }
  }

  public cancelMeasurement(): void {
    this.currentMeasurement = null
    this.refresh()
  }

  public getMeasurements(): { point1: vec2; point2: vec2 }[] {
    return this.measurements
  }

  public getCurrentMeasurement(): { point1: vec2; point2: vec2 } | null {
    return this.currentMeasurement
  }

  public clearMeasurements(): void {
    this.measurements.length = 0
    this.currentMeasurement = null
    this.refresh()
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    if (this.units != measurementSettings.units) {
      this.units = measurementSettings.units
      this.refresh()
    }
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 1,
    })
    this.framebuffer.use(() => {
      super.render(context)
    })
  }
}
