import type { Layer, StepLayer } from "@src/data/project"
import type { ShapeDistance } from "@src/types"
import { type vec2, vec4 } from "gl-matrix"
import type REGL from "regl"
// import init, { initSync, VectorDoc, vectorize_bytes, vectorize_rgba } from "../contours-vtracer/pkg/vtracer_wasm.js"
import { ShapeRenderer, type ShapeRendererProps } from "./shape-renderer"
import type { DrawWorldContext } from "./view"

export interface LayerProps {
  dataLayer: StepLayer
  visible?: boolean
  color?: vec4
  alpha?: number
}

export interface LayerRendererProps extends Omit<ShapeRendererProps, "image">, LayerProps {}

interface LayerUniforms {
  u_Color: vec4
  u_ZOffset: number
}

type LayerAttributes = {}

interface LayerContext {
  preRender: undefined
  zOffset?: number
  needsRedraw?: boolean
}

export default class LayerRenderer extends ShapeRenderer {
  public visible = true
  public dataLayer: StepLayer
  public color: vec4 = vec4.fromValues(Math.random(), Math.random(), Math.random(), 1.0)

  private drawLayer: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext & LayerContext>
  private drawZOffset: REGL.DrawCommand

  public framebuffer: REGL.Framebuffer2D

  private previousContextString = ""
  private previousTransformString = ""
  private previousColorString = ""
  private artworkChanged = false

  constructor(props: LayerRendererProps) {
    const image = props.dataLayer.artwork
    super({ ...props, image })
    this.dataLayer = props.dataLayer

    if (props.color !== undefined) {
      this.color = props.color
    }
    if (props.visible !== undefined) {
      this.visible = props.visible
    }

    this.framebuffer = this.regl.framebuffer()

    this.drawLayer = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, LayerContext, REGL.DefaultContext & DrawWorldContext>({
      context: {
        needsRedraw: (context) => this.needsRender(context),
        preRender: (context) => {
          this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
        },
      },
      framebuffer: this.framebuffer,
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
        u_ZOffset: () => this.getZOffset(),
      },
    })

    this.drawZOffset = this.regl({
      uniforms: {
        u_ZOffset: () => this.getZOffset(),
      },
    })

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  private needsRender(context: REGL.DefaultContext & DrawWorldContext): boolean {
    const contextCopy = JSON.parse(JSON.stringify(context))
    const transformCopy = JSON.parse(JSON.stringify(this.transform))
    delete contextCopy["tick"]
    delete contextCopy["time"]
    const contextCopyStr = JSON.stringify(contextCopy)
    const transformCopyStr = JSON.stringify(transformCopy)
    const colorCopyStr = JSON.stringify(this.color)
    if (
      this.previousContextString == contextCopyStr &&
      !this.artworkChanged &&
      this.previousTransformString == transformCopyStr &&
      this.previousColorString == colorCopyStr
    ) {
      return false
    }
    this.previousContextString = contextCopyStr
    this.previousTransformString = transformCopyStr
    this.previousColorString = colorCopyStr
    this.artworkChanged = false
    return true
  }

  /**
   * Renders the layer. Note, this will only render if the layer needs to be updated based on context and transform changes.
   * Rendered content will be written to the layer's framebuffer.
   */
  public render(): void {
    this.drawLayer((context) => {
      if (!context.needsRedraw) return
      this.regl.clear({
        framebuffer: this.framebuffer,
        color: [0, 0, 0, 0],
        depth: 0,
      })
      super.render()
    })
  }

  public getZOffset(): number {
    return this.dataLayer.step.matrix.getZOffsetForLayer(this.dataLayer.layer)
  }

  /**
   * Queries the distance from the pointer to all shapes in the renderer
   * @param pointer the pointer in gl screen/view coordinates
   * @param context the regl context
   * @returns an array of ShapeDistance objects, one for each shape in the renderer that is within the query distance. Returned distances are in world coordinates.
   */
  public queryDistance(pointer: vec2): ShapeDistance[] {
    let result: ShapeDistance[] = []
    this.drawZOffset(() => {
      result = super.queryDistance(pointer)
    })
    return result
  }

  public async capture(width: number, height: number): Promise<ImageData> {
    const pixels = this.regl.read<Uint8Array<ArrayBuffer>>({ framebuffer: this.framebuffer, width, height })
    console.log("pixels", pixels)
    const clamped = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.length)
    const image = new ImageData(clamped, width, height)
    console.log("image", image)
    // this.regl._gl.putImageData(image, 0, 0)
    return image
    // await init()
    // const string = vectorize_rgba(pixels, width, height, { mode: "polygon", hierarchical: "cutout", cluster: "color-cluster", filterSpeckle: 1 })
    // console.log("string", string)
    // })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}

interface SelectionRendererProps extends ShapeRendererProps {
  sourceLayer: Layer
}

interface SelectionRendererContext {
  needsRedraw?: boolean
  preRender: undefined
}

export class SelectionRenderer extends ShapeRenderer {
  private drawSelection: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext & SelectionRendererContext>

  public framebuffer: REGL.Framebuffer2D

  public sourceLayer: Layer

  private previousContextString = ""
  private previousTransformString = ""
  private artworkChanged = false

  constructor(props: SelectionRendererProps) {
    super(props)
    this.sourceLayer = props.sourceLayer

    this.framebuffer = this.regl.framebuffer()

    this.drawSelection = this.regl<
      LayerUniforms,
      LayerAttributes,
      Record<string, never>,
      SelectionRendererContext,
      REGL.DefaultContext & DrawWorldContext
    >({
      context: {
        needsRedraw: (context) => this.needsRender(context),
        preRender: (context) => {
          this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
        },
      },
      framebuffer: this.framebuffer,
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
        u_Color: vec4.fromValues(0.5, 0.5, 0.5, 0.7),
        u_ZOffset: () => this.sourceLayer.matrix.getZOffsetForLayer(this.sourceLayer),
      },
    })

    this.shapeShaderAttachments.onUpdate(() => {
      this.artworkChanged = true
    })
  }

  private needsRender(context: REGL.DefaultContext & DrawWorldContext): boolean {
    const contextCopy = JSON.parse(JSON.stringify(context))
    const transformCopy = JSON.parse(JSON.stringify(this.transform))
    delete contextCopy["tick"]
    delete contextCopy["time"]
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

  public render(): void {
    this.drawSelection((context) => {
      if (!context.needsRedraw) return
      this.regl.clear({
        framebuffer: this.framebuffer,
        color: [0, 0, 0, 0],
        depth: 0,
      })
      super.render()
    })
  }

  public destroy(): void {
    this.framebuffer.destroy()
    super.destroy()
  }
}

// export interface RasterizerProps extends ShapeRendererProps {}
// interface RasterizerContext extends Record<string, never> {}

// export class Contourizer extends ShapeRenderer {
//   private drawContour: REGL.DrawCommand<REGL.DefaultContext & DrawWorldContext>

//   public framebuffer: REGL.Framebuffer2D

//   constructor(props: RasterizerProps) {
//     super(props)

//     this.framebuffer = this.regl.framebuffer()

//     this.drawContour = this.regl<LayerUniforms, LayerAttributes, Record<string, never>, RasterizerContext, REGL.DefaultContext & DrawWorldContext>({
//       context: {
//         // preRender: (context) => {
//         //   this.framebuffer.resize(context.viewportWidth, context.viewportHeight)
//         // },
//       },
//       viewport: {
//         x: 0,
//         y: 0,
//         width: 1,
//         height: 1,
//       },
//       scissor: {
//         enable: false,
//       },
//       framebuffer: this.framebuffer,
//       depth: {
//         enable: true,
//         mask: true,
//         func: "greater",
//         range: [0, 1],
//       },
//       // cull: {
//       //   enable: true,
//       //   face: 'back'
//       // },
//       uniforms: {
//         u_Color: vec4.fromValues(1.0, 1.0, 1.0, 1.0),
//         u_ZOffset: 0,
//       },
//     })
//   }

//   /**
//    * Renders the layer. Note, this will only render if the layer needs to be updated based on context and transform changes.
//    * Rendered content will be written to the layer's framebuffer.
//    *
//    */
//   public render(): void {
//     this.drawContour(() => {
//       this.regl.clear({
//         framebuffer: this.framebuffer,
//         color: [0, 0, 0, 0],
//         depth: 0,
//       })
//       super.render()
//     })
//   }

//   public capture(width: number, height: number): void {
//     const pixels = this.regl.read<Uint8Array<ArrayBuffer>>({ framebuffer: this.framebuffer, width, height })
//     console.log("pixels", pixels)
//     const clamped = new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.length)
//     const image = new ImageData(clamped, width, height)
//     console.log("image", image)
//     init().then(() => {
//       const string = vectorize_rgba(pixels, width, height, { mode: "polygon", hierarchical: "cutout", cluster: "color-cluster", filterSpeckle: 1 })
//       console.log("string", string)
//       return string
//     })
//   }

//   // public

//   public destroy(): void {
//     this.framebuffer.destroy()
//     super.destroy()
//   }
// }
