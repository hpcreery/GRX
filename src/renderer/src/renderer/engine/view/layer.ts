import REGL from "regl"
import { vec2, vec3 } from "gl-matrix"
import { BoundingBox } from "../types"

import type { UniverseContext } from "../engine"
import { getUnitsConversion, UID } from "../utils"

import { ShapeRenderer, ShapeRendererProps, ShapeDistance } from "./shape-renderer"
import { WorldContext } from "./view"
import { Layer, Project, Step } from '@src/renderer/data/project'

export interface LayerProps {
  layerData: Layer
  stepData: Step
  projectData: Project
  id?: string
  /**
   * Units of the layer. Can be 'mm' | 'inch' | 'mil' | 'cm' | or a number representing the scale factor relative to the base unit mm
   */
  visible?: boolean
  color?: vec3
  alpha?: number
  context?: string
  type?: string
  format?: string
}

export interface LayerRendererProps extends Omit<ShapeRendererProps, 'image'>, LayerProps {}

interface LayerUniforms {
  u_Color: vec3
  u_Alpha: number
}

interface LayerAttributes {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public id: string = UID()
  public layerData: Layer
  public stepData: Step
  public projectData: Project
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public alpha: number = 1

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  private previousContextString = ""
  private artworkChanged = false

  constructor(props: LayerRendererProps) {
    const image = props.layerData.artwork
    super({...props, image})
    this.layerData = props.layerData
    this.stepData = props.stepData
    this.projectData = props.projectData


    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.alpha !== undefined) {
      this.alpha = props.alpha
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }
    if (props.id !== undefined) {
      this.id = props.id
    }
    // if (props.context !== undefined) {
    //   this.context = props.context
    // }
    // if (props.type !== undefined) {
    //   this.type = props.type
    // }
    // if (props.format !== undefined) {
    //   this.format = props.format
    // }


    this.framebuffer = this.regl.framebuffer()

    this.layerConfig = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, UniverseContext & WorldContext>({
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

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  public getBoundingBox(): BoundingBox {
    const boundingBox = super.getBoundingBox()
    vec2.scale(boundingBox.min, boundingBox.min, 1 / getUnitsConversion(this.layerData.artworkUnits))
    vec2.scale(boundingBox.max, boundingBox.max, 1 / getUnitsConversion(this.layerData.artworkUnits))
    return boundingBox
  }

  public queryDistance(pointer: vec2, context: REGL.DefaultContext & UniverseContext & WorldContext): ShapeDistance[] {
    const initScale = this.transform.scale
    this.transform.scale = this.transform.scale / getUnitsConversion(this.layerData.artworkUnits)
    // const newPointer = vec2.clone(pointer)
    // vec2.scale(newPointer, newPointer, getUnitsConversion(this.units))
    const measurements = super.queryDistance(pointer, context)
    this.transform.scale = initScale
    // const fixDistance = (measurements: ShapeDistance[]): void => {
    //   for (const measurement of measurements) {
    //     measurement.distance = measurement.distance / getUnitsConversion(this.units)
    //     fixDistance(measurement.children)
    //   }
    // }
    // fixDistance(measurements)
    return measurements
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    const contextCopy = JSON.parse(JSON.stringify(context))
    delete contextCopy['tick']
    delete contextCopy['time']
    contextCopy['color'] = this.color
    const contextCopyStr = JSON.stringify(contextCopy)
    if (this.previousContextString == contextCopyStr && !this.artworkChanged) {
      return
    }
    this.previousContextString = contextCopyStr
    this.artworkChanged = false

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        const initScale = this.transform.scale
        this.transform.scale = this.transform.scale / getUnitsConversion(this.layerData.artworkUnits)
        super.render(context)
        this.transform.scale = initScale
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}
