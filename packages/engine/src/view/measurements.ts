import { ArtworkBufferCollection } from "@src/data/artwork-collections"
import * as Shapes from "@src/data/shape/shape"
import { measurementSettings } from "@src/settings"
import type { vec2 } from "gl-matrix"
import type REGL from "regl"
import type { Units } from "../types"
import { baseUnitsConversionFactor } from "../utils"
import { type RendererProps, ShapeRenderer } from "./shape-renderer"
import type { WorldContext } from "./view"

export class SimpleMeasurement extends ShapeRenderer {
  public measurements: { point1: vec2; point2: vec2 }[] = []
  public currentMeasurement: { point1: vec2; point2: vec2 } | null = null
  public framebuffer: REGL.Framebuffer2D
  public units: Units = measurementSettings.units
  constructor(props: RendererProps) {
    super({ ...props, image: new ArtworkBufferCollection() })
    this.framebuffer = this.regl.framebuffer()
  }

  /**
   * Refresh Measurements Display
   */
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

  /**
   * Add/Start Measurement Point
   * @param coordinate vec2 world coordinates
   */
  public addMeasurement(coordinate: vec2): void {
    if (this.currentMeasurement) {
      this.measurements.push(this.currentMeasurement)
    }
    this.currentMeasurement = { point1: coordinate, point2: coordinate }
    this.refresh()
  }

  /**
   * Update Current Measurement Point
   * @param coordinate vec2 world coordinates
   */
  public updateMeasurement(coordinate: vec2): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.point2 = coordinate
      this.refresh()
    }
  }

  /**
   * Complete Current Measurement
   * @param coordinate vec2 world coordinates
   */
  public finishMeasurement(coordinate: vec2): void {
    if (this.currentMeasurement) {
      // this.currentMeasurement.point2 = coordinate
      this.updateMeasurement(coordinate)
      this.measurements.push(this.currentMeasurement)
      this.currentMeasurement = null
      this.refresh()
    }
  }

  /**
   * Cancel Current Active Measurement
   */
  public cancelMeasurement(): void {
    this.currentMeasurement = null
    this.refresh()
  }

  /**
   * Gets all measurement points
   * @returns list of measurements points. measurement points are a set of vec2 world coordinates, point1 & point2 being of value vec2.
   */
  public getMeasurements(): { point1: vec2; point2: vec2 }[] {
    return this.measurements
  }

  /**
   * Gets current measurement points
   * @returns current measurement, null if no current measurement
   */
  public getCurrentMeasurement(): { point1: vec2; point2: vec2 } | null {
    return this.currentMeasurement
  }

  /**
   * Clear all measurements
   */
  public clearMeasurements(): void {
    this.measurements.length = 0
    this.currentMeasurement = null
    this.refresh()
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
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
