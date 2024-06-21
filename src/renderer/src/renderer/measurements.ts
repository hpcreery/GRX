import REGL from 'regl'
import { vec2 } from 'gl-matrix'
// import LayerRenderer, { LayerRendererProps } from './layer'
// import { initializeRenderers } from './collections'
// import * as Shapes from './shapes'
// import * as Comlink from 'comlink'
// import plugins from './plugins'
// import type { parser } from './plugins'
// import type { Units } from './types'
// import GridFrag from '../shaders/src/Grid.frag'
// import { UID } from './utils'
// import LoadingFrag from '../shaders/src/Loading/Winding.frag'
// import FullScreenQuad from '../shaders/src/FullScreenQuad.vert'
import SimpleMeasurementFrag from '../shaders/src/Measurements/SimpleMeasurement.frag'
import SimpleMeasurementVert from '../shaders/src/Measurements/SimpleMeasurement.vert'


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
  private renderMeasurement: REGL.DrawCommand<REGL.DefaultContext, SimpleMeasureRenderProps>

  public measurements: { point1: vec2, point2: vec2 }[] = []
  public currentMeasurement: { point1: vec2, point2: vec2 } | null = null

  constructor(regl: REGL.Regl) {
    this.regl = regl
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

  public addMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.point2 = point
      this.measurements.push(this.currentMeasurement)
      this.currentMeasurement = null
    } else {
      this.currentMeasurement = { point1: point, point2: point }
    }
  }

  public updateMeasurement(point: vec2): void {
    if (this.currentMeasurement) {
      this.currentMeasurement.point2 = point
    }
  }

  public recordMeasurement(): void {
    if (this.currentMeasurement) {
      this.measurements.push(this.currentMeasurement)
      this.currentMeasurement = null
    }
  }

  public render(): void {
    this.measurements.forEach((measurement) => {
      this.renderMeasurement(measurement)
    })
    if (this.currentMeasurement) {
      this.renderMeasurement(this.currentMeasurement)
    }
  }
}
