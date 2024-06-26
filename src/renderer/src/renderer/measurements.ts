import REGL from 'regl'
import { vec2 } from 'gl-matrix'
import SimpleMeasurementFrag from '@src/shaders/src/Measurements/SimpleMeasurement.frag'
import SimpleMeasurementVert from '@src/shaders/src/Measurements/SimpleMeasurement.vert'

import { TextRenderer } from './text'
import { WorldContext } from './engine'
import type { Units } from './types'
import { getUnitsConversion } from './utils'

interface SimpleMeasureRenderProps {
}

interface SimpleMeasureRenderUniforms {
  u_Point1: vec2
  u_Point2: vec2
}

interface SimpleMeasurementAttachments {
  point1: vec2
  point2: vec2
}

export class SimpleMeasurement {
  private regl: REGL.Regl
  private ctx: OffscreenCanvasRenderingContext2D
  private renderMeasurement: REGL.DrawCommand<REGL.DefaultContext, SimpleMeasureRenderProps>
  public textRenderer: TextRenderer

  public measurements: { point1: vec2, point2: vec2 }[] = []
  public framebuffer: REGL.Framebuffer2D
  public currentMeasurement: { point1: vec2, point2: vec2 } | null = null
  public units: Units = 'mm'

  constructor(regl: REGL.Regl, ctx: OffscreenCanvasRenderingContext2D) {
    this.regl = regl
    this.ctx = ctx
    this.framebuffer = this.regl.framebuffer()
    this.textRenderer = new TextRenderer(this.ctx)
    this.renderMeasurement = this.regl<SimpleMeasureRenderUniforms, Record<string, never>, SimpleMeasureRenderProps>(
      {
        vert: SimpleMeasurementVert,
        frag: SimpleMeasurementFrag,
        uniforms: {
          u_Point1: regl.prop<SimpleMeasurementAttachments, 'point1'>('point1'),
          u_Point2: regl.prop<SimpleMeasurementAttachments, 'point2'>('point2')
        },
      },
    )
  }

  private updateText(measurement: { point1: vec2, point2: vec2 }): void {
    const [x1, y1] = measurement.point1
    const [x2, y2] = measurement.point2
    const length = Math.hypot(x1 - x2, y1 - y2) * getUnitsConversion(this.units)
    const x = Math.abs(x1 - x2) * getUnitsConversion(this.units)
    const y = Math.abs(y1 - y2) * getUnitsConversion(this.units)
    this.textRenderer.texts.push({
      text: `${parseFloat(length.toFixed(4))}${typeof this.units == 'string' ? this.units : ''}\n[X:${parseFloat(x.toFixed(4))} Y:${parseFloat(y.toFixed(4))}]`,
      location: [(x1 + x2) / 2, (y1 + y2) / 2],
      textAlign: 'center'
    })
  }

  public addMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.point2 = point
      this.measurements.push(this.currentMeasurement)
      this.textRenderer.texts.pop()
      this.updateText(this.currentMeasurement)
      this.currentMeasurement = null
    } else {
      this.currentMeasurement = { point1: point, point2: point }
      this.updateText(this.currentMeasurement)
    }
  }

  public updateMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.textRenderer.texts.pop()
      this.currentMeasurement.point2 = point
      this.updateText(this.currentMeasurement)
    }
  }

  public clearMeasurements(): void {
    this.currentMeasurement = null
    this.measurements.length = 0
    this.textRenderer.texts.length = 0
  }

  public setMeasurementUnits(units: Units): void {
    this.units = units
    this.textRenderer.texts.length = 0
    this.measurements.forEach((measurement) => {
      this.updateText(measurement)
    })
    if (this.currentMeasurement) {
      this.updateText(this.currentMeasurement)
    }
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 1
    })
    this.textRenderer.render(context)
    this.framebuffer.use(() => {
      this.measurements.forEach((measurement) => {
        this.renderMeasurement(measurement)
      })
      if (this.currentMeasurement) {
        this.renderMeasurement(this.currentMeasurement)
      }
    })
  }
}
