import REGL from 'regl'
import { WorldContext } from './engine'
import { vec2, vec3 } from 'gl-matrix'

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
  private regl: REGL.Regl
  private canvas2d: OffscreenCanvas
  private context: OffscreenCanvasRenderingContext2D
  public framebuffer: REGL.Framebuffer2D
  public imageTexture: REGL.Texture2D
  public texts: TextUnit[] = [] //[{ text: "Hello World", location: [0, 0] }]
  constructor(regl: REGL.Regl) {
    this.regl = regl
    this.canvas2d = new OffscreenCanvas(0, 0);
    const context = this.canvas2d.getContext('2d');
    if (context) {
      this.context = context
    } else {
      throw ('asdf')
    }
    this.framebuffer = this.regl.framebuffer()
    this.imageTexture = this.regl.texture()
  }

  private resetFontStyle(): void {
    this.context.fillStyle = "white"
    this.context.font = "10px sans-serif"
    this.context.fontKerning = "auto"
    this.context.fontStretch = "normal"
    this.context.fontVariantCaps = "normal"
  }

  private drawStroked(text: string, position: vec2): void {
    const [x, y] = position

    this.context.strokeStyle = 'black';
    this.context.lineWidth = 2;
    this.context.strokeText(text, x, y);
    this.context.fillStyle = 'white';
    this.context.fillText(text, x, y);
  }



  public render(context: REGL.DefaultContext & WorldContext): void {
    this.canvas2d.height = context.viewportHeight
    this.canvas2d.width = context.viewportWidth
    this.context.clearRect(0, 0, context.viewportWidth, context.viewportWidth);
    this.context.save()
    this.context.scale(1, -1)
    this.texts.forEach(text => {
      this.resetFontStyle()
      if (text.font) this.context.font = text.font
      if (text.fontKerning) this.context.fontKerning = text.fontKerning
      if (text.fontStretch) this.context.fontStretch = text.fontStretch
      if (text.fontVariantCaps) this.context.fontVariantCaps = text.fontVariantCaps
      if (text.textAlign) this.context.textAlign = text.textAlign
      if (text.textBaseline) this.context.textBaseline = text.textBaseline
      if (text.textRendering) this.context.textRendering = text.textRendering
      if (text.wordSpacing) this.context.wordSpacing = text.wordSpacing
      if (text.direction) this.context.direction = text.direction
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.location[0], text.location[1], 1), context.transform.matrix)
      const position = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position, position, [0.5, 0.5])
      vec2.add(position, position, [0.5, 0.5])
      vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      position[1] *= -1
      this.drawStroked(text.text, position)
    })
    this.imageTexture = this.regl.texture(this.canvas2d.transferToImageBitmap())
  }

}
