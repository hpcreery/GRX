import REGL from "regl"
import { vec3 } from "gl-matrix"

import type { UniverseContext } from "../engine"

import { ShapeRenderer, ShapeRendererProps } from "./shape-renderer"
import { WorldContext } from "./view"
import { StepLayer } from '@src/renderer/data/project'

export interface LayerProps {
  dataLayer: StepLayer
  visible?: boolean
  color?: vec3
  alpha?: number
}

export interface LayerRendererProps extends Omit<ShapeRendererProps, 'image'>, LayerProps {}

interface LayerUniforms {
  u_Color: vec3
  u_Alpha: number
}

interface LayerAttributes {}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public dataLayer: StepLayer
  public color: vec3 = vec3.fromValues(Math.random(), Math.random(), Math.random())
  public alpha: number = 1

  private layerConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  private previousContextString = ""
  private previousTransformString = ""
  private previousColorString = ""
  private artworkChanged = false

  constructor(props: LayerRendererProps) {
    const image = props.dataLayer.artwork
    super({...props, image})
    this.dataLayer = props.dataLayer


    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.alpha !== undefined) {
      this.alpha = props.alpha
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }


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

  private needsRender(context: REGL.DefaultContext & UniverseContext & WorldContext): boolean {
    const contextCopy = JSON.parse(JSON.stringify(context))
    const transformCopy = JSON.parse(JSON.stringify(this.transform))
    delete contextCopy['tick']
    delete contextCopy['time']
    const contextCopyStr = JSON.stringify(contextCopy)
    const transformCopyStr = JSON.stringify(transformCopy)
    const colorCopyStr = JSON.stringify(this.color)
    if (this.previousContextString == contextCopyStr && !this.artworkChanged && this.previousTransformString == transformCopyStr && this.previousColorString == colorCopyStr) {
      return false
    }
    this.previousContextString = contextCopyStr
    this.previousTransformString = transformCopyStr
    this.previousColorString = colorCopyStr
    this.artworkChanged = false
    return true
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {

    if (!this.needsRender(context)) return

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.layerConfig(() => {
        super.render(context)
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}

export class SelectionRenderer extends ShapeRenderer {

  private selectionConfig: REGL.DrawCommand<REGL.DefaultContext & UniverseContext & WorldContext>

  public framebuffer: REGL.Framebuffer2D

  private previousContextString = ""
  private previousTransformString = ""
  private artworkChanged = false

  constructor(props: ShapeRendererProps) {
    super(props)

    this.framebuffer = this.regl.framebuffer()

    this.selectionConfig = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, UniverseContext & WorldContext>({
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
        u_Color: vec3.fromValues(0.5, 0.5, 0.5),
        u_Alpha: 0.7,
      },
    })

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  private needsRender(context: REGL.DefaultContext & UniverseContext & WorldContext): boolean {
    const contextCopy = JSON.parse(JSON.stringify(context))
    const transformCopy = JSON.parse(JSON.stringify(this.transform))
    delete contextCopy['tick']
    delete contextCopy['time']
    const contextCopyStr = JSON.stringify(contextCopy)
    const transformCopyStr = JSON.stringify(transformCopy)
    if (this.previousContextString == contextCopyStr && !this.artworkChanged && this.previousTransformString == transformCopyStr) {
      return false
    }
    this.previousContextString = contextCopyStr
    this.previousTransformString = transformCopyStr
    this.artworkChanged = false
    return true
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    if (!this.needsRender(context)) return

    this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
    this.regl.clear({
      framebuffer: this.framebuffer,
      color: [0, 0, 0, 0],
      depth: 0,
    })
    this.framebuffer.use(() => {
      this.selectionConfig(() => {
        super.render(context)
      })
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}
