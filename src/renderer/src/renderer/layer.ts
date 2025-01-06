import REGL from "regl"
import { vec2, vec3 } from "gl-matrix"
import { Units, BoundingBox, SnapMode } from "./types"

import type { WorldContext } from "./engine"
import { getUnitsConversion, UID } from "./utils"

import { ShapeRenderer, ShapeRendererProps, ShapeDistance } from "./shape-renderer"

export interface LayerProps {
  name: string
  id?: string
  /**
   * Units of the layer. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
   */
  units: Units
  visible?: boolean
  color?: vec3
  alpha?: number
  context?: string
  type?: string
  format?: string
}

export interface LayerRendererProps extends ShapeRendererProps, LayerProps {}

interface LayerUniforms {
  u_Color: vec3
  u_Alpha: number
}

interface LayerAttributes {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public id: string = UID()
  public name: string
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public alpha: number = 1
  public context = "misc"
  public type = "document"
  public format = "raw"
  /**
   * Units of the layer. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
   */
  public units: "mm" | "inch" | "mil" | "cm" | number = "mm"

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  constructor(props: LayerRendererProps) {
    super(props)

    this.units = props.units

    this.name = props.name
    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.alpha !== undefined) {
      this.alpha = props.alpha
    }
    if (props.context !== undefined) {
      this.context = props.context
    }
    if (props.type !== undefined) {
      this.type = props.type
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }
    if (props.id !== undefined) {
      this.id = props.id
    }
    if (props.format !== undefined) {
      this.format = props.format
    }

    this.framebuffer = this.regl.framebuffer()

    this.layerConfig = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, WorldContext>({
      depth: {
        enable: true,
        mask: true,
        func: "greater",
        range: [0, 1],
      },
      // cull: {
      //   enable: true,
      //   face: 'back'
      // },
      uniforms: {
        u_Color: () => this.color,
        u_Alpha: () => this.alpha,
      },
    })
  }

  public getBoundingBox(): BoundingBox {
    const boundingBox = super.getBoundingBox()
    vec2.scale(boundingBox.min, boundingBox.min, 1 / getUnitsConversion(this.units))
    vec2.scale(boundingBox.max, boundingBox.max, 1 / getUnitsConversion(this.units))
    return boundingBox
  }

  public queryDistance(pointer: vec2, snapMode: SnapMode, context: REGL.DefaultContext & WorldContext): ShapeDistance[] {
    const initScale = this.transform.scale
    this.transform.scale = this.transform.scale / getUnitsConversion(this.units)
    const newPointer = vec2.clone(pointer)
    vec2.scale(newPointer, newPointer, getUnitsConversion(this.units))
    const measurements = super.queryDistance(newPointer, snapMode, context)
    this.transform.scale = initScale
    const fixDistance = (measurements: ShapeDistance[]): void => {
      for (const measurement of measurements) {
        measurement.distance = measurement.distance / getUnitsConversion(this.units)
        fixDistance(measurement.children)
      }
    }
    fixDistance(measurements)
    return measurements
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        const initScale = this.transform.scale
        this.transform.scale = this.transform.scale / getUnitsConversion(this.units)
        super.render(context)
        this.transform.scale = initScale
      })
    })
  }
}
