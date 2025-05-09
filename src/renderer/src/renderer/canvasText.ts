import REGL from "regl"
import { UniverseContext } from "./engine"
import { vec2, vec3 } from "gl-matrix"

interface TextUnit {
  text: string
  location: vec2
  font?: string
  fontKerning?: CanvasFontKerning
  fontStretch?: CanvasFontStretch
  fontVariantCaps?: CanvasFontVariantCaps
  textAlign?: CanvasTextAlign
  textBaseline?: CanvasTextBaseline
  textRendering?: CanvasTextRendering
  wordSpacing?: string
  direction?: CanvasDirection
}

export class TextRenderer {
  private ctx: OffscreenCanvasRenderingContext2D
  public texts: TextUnit[] = [] //[{ text: "Hello World", location: [0, 0] }]
  constructor(ctx: OffscreenCanvasRenderingContext2D) {
    this.ctx = ctx
  }

  private resetFontStyle(): void {
    this.ctx.fillStyle = "white"
    this.ctx.font = "10px sans-serif"
    this.ctx.fontKerning = "auto"
    this.ctx.fontStretch = "normal"
    this.ctx.fontVariantCaps = "normal"
  }

  private drawStroked(text: string, position: vec2): void {
    const [x, y] = position
    this.ctx.strokeStyle = "black"
    this.ctx.lineWidth = 2
    this.ctx.strokeText(text, x, y)
    this.ctx.fillStyle = "white"
    this.ctx.fillText(text, x, y)
  }

  public render(context: REGL.DefaultContext & UniverseContext): void {
    this.texts.forEach((text) => {
      this.resetFontStyle()
      if (text.font) this.ctx.font = text.font
      if (text.fontKerning) this.ctx.fontKerning = text.fontKerning
      if (text.fontStretch) this.ctx.fontStretch = text.fontStretch
      if (text.fontVariantCaps) this.ctx.fontVariantCaps = text.fontVariantCaps
      if (text.textAlign) this.ctx.textAlign = text.textAlign
      if (text.textBaseline) this.ctx.textBaseline = text.textBaseline
      if (text.textRendering) this.ctx.textRendering = text.textRendering
      if (text.wordSpacing) this.ctx.wordSpacing = text.wordSpacing
      if (text.direction) this.ctx.direction = text.direction
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.location[0], text.location[1], 1), context.transform.matrix)
      const position = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position, position, [0.5, -0.5])
      vec2.add(position, position, [0.5, 0.5])
      vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      // this.drawStroked(text.text, position)
      const lineHeight = this.ctx.measureText("M").width * 1.2
      const lines = text.text.split("\n")
      for (let i = 0; i < lines.length; i++) {
        vec2.add(position, position, [0, i * lineHeight])
        this.drawStroked(lines[i], position)
      }
    })
  }
}
