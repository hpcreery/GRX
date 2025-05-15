import REGL from "regl"
import { UniverseContext } from "../engine"
import { DatumPoint, DatumText } from "./layer/shapes/shapes"
import { vec2, vec3 } from "gl-matrix"
import { WorldContext } from "./view"

export class TextRenderer {
  private ctx: OffscreenCanvasRenderingContext2D
  public texts: DatumText[] = []
  constructor(ctx: OffscreenCanvasRenderingContext2D, texts: DatumText[]) {
    this.ctx = ctx
    this.texts = texts
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

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    this.texts.forEach((text) => {
      this.resetFontStyle()
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.x, text.y, 1), context.transform.matrix)
      const position = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position, position, [0.5, -0.5])
      vec2.add(position, position, [0.5, 0.5])
      vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      const lineHeight = this.ctx.measureText("M").width * 1.2
      const lines = text.text.split("\n")
      for (let i = 0; i < lines.length; i++) {
        vec2.add(position, position, [0, i * lineHeight])
        this.drawStroked(lines[i], position)
      }
    })
  }
}

export class PointRenderer {
  private ctx: OffscreenCanvasRenderingContext2D
  public texts: DatumPoint[] = []
  constructor(ctx: OffscreenCanvasRenderingContext2D, texts: DatumPoint[]) {
    this.ctx = ctx
    this.texts = texts
  }

  private drawStroked(position: vec2): void {
    const [x, y] = position
    this.ctx.strokeStyle = "black"
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(x - 5, y - 5)
    this.ctx.lineTo(x + 5, y + 5)
    this.ctx.moveTo(x + 5, y - 5)
    this.ctx.lineTo(x - 5, y + 5)
    this.ctx.stroke()
    this.ctx.strokeStyle = "white"
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.moveTo(x - 5, y - 5)
    this.ctx.lineTo(x + 5, y + 5)
    this.ctx.moveTo(x + 5, y - 5)
    this.ctx.lineTo(x - 5, y + 5)
    this.ctx.stroke()
  }

  public render(context: REGL.DefaultContext & UniverseContext & WorldContext): void {
    this.texts.forEach((text) => {
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.x, text.y, 1), context.transform.matrix)
      const position = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position, position, [0.5, -0.5])
      vec2.add(position, position, [0.5, 0.5])
      vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      this.drawStroked(position)
    })
  }
}
