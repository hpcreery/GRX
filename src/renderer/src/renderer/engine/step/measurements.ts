import REGL from "regl"
import { vec2 } from "gl-matrix"
import { UniverseContext } from "../engine"
// import type { Units } from "../types"
import { getUnitsConversion } from "../utils"
import { RendererProps, ShapeRenderer } from "./layer/shape-renderer"
import * as Shapes from "./layer/shape/shape"
import { WorldContext } from "./view"
import { measurementSettings } from "@src/renderer/engine/settings"

// import SimpleMeasurementFrag from "@src/shaders/src/Measurements/SimpleMeasurement.frag"
// import SimpleMeasurementVert from "@src/shaders/src/Measurements/SimpleMeasurement.vert"
// interface SimpleMeasureRenderProps {}
// interface SimpleMeasureRenderUniforms {
//   u_Point1: vec2
//   u_Point2: vec2
// }
// interface SimpleMeasurementAttachments {
//   point1: vec2
//   point2: vec2
// }

export class SimpleMeasurement extends ShapeRenderer {
  public measurements: { point1: vec2; point2: vec2 }[] = []
  public currentMeasurement: { point1: vec2; point2: vec2 } | null = null
  public framebuffer: REGL.Framebuffer2D
  constructor(props: RendererProps) {
    super({ ...props, image: [] })
    this.framebuffer = this.regl.framebuffer()
  }

  public refresh(): void {
    this.image.length = 0
    const allMeasurements = [...this.measurements, this.currentMeasurement].filter((m) => m !== null)
    allMeasurements.forEach((measurement) => {
      const [x1, y1] = measurement.point1
      const [x2, y2] = measurement.point2
      const length = Math.hypot(x1 - x2, y1 - y2) * getUnitsConversion(measurementSettings.units)
      const x = Math.abs(x1 - x2) * getUnitsConversion(measurementSettings.units)
      const y = Math.abs(y1 - y2) * getUnitsConversion(measurementSettings.units)
      this.image.push(
        new Shapes.DatumText({
          text: `↙${parseFloat(length.toFixed(4))}${typeof measurementSettings.units == "string" ? measurementSettings.units : ""}\n(ΔX:${parseFloat(x.toFixed(4))} ΔY:${parseFloat(y.toFixed(4))})`,
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
      this.image.push(new Shapes.DatumLine({ xs: x1, ys: y1, xe: x2, ye: y2 }))
    })
    this.dirty = true
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

  // public setMeasurementUnits(units: Units): void {
  //   this.units = units
  //   this.refresh()
  // }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
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
