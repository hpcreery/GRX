import REGL from 'regl'
import { WorldContext } from './engine'
import { DatumPoint, DatumText, DatumLine } from './shapes'
import { vec2, vec3 } from 'gl-matrix'


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
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(text, x, y);
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(text, x, y);
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.texts.forEach(text => {
      this.resetFontStyle()
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.x, text.y, 1), context.transform.matrix)
      const position = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position, position, [0.5, -0.5])
      vec2.add(position, position, [0.5, 0.5])
      vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      const lineHeight = this.ctx.measureText("M").width * 1.2;
      const lines = text.text.split('\n');
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
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y - 5);
    this.ctx.lineTo(x + 5, y + 5);
    this.ctx.moveTo(x + 5, y - 5);
    this.ctx.lineTo(x - 5, y + 5);
    this.ctx.stroke();
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, y - 5);
    this.ctx.lineTo(x + 5, y + 5);
    this.ctx.moveTo(x + 5, y - 5);
    this.ctx.lineTo(x - 5, y + 5);
    this.ctx.stroke();
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.texts.forEach(text => {
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

export class LineRenderer {
  private ctx: OffscreenCanvasRenderingContext2D
  public texts: DatumLine[] = []
  constructor(ctx: OffscreenCanvasRenderingContext2D, texts: DatumLine[]) {
    this.ctx = ctx
    this.texts = texts
  }

  private drawStroked(position: vec2[]): void {
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(position[0][0], position[0][1]);
    this.ctx.lineTo(position[1][0], position[1][1]);
    this.ctx.stroke();
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(position[0][0], position[0][1]);
    this.ctx.lineTo(position[1][0], position[1][1]);
    this.ctx.stroke();
  }

  public render(context: REGL.DefaultContext & WorldContext): void {
    this.texts.forEach(text => {
      const transform = vec3.create()
      vec3.transformMat3(transform, vec3.fromValues(text.xs, text.ys, 1), context.transform.matrix)
      const position1 = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position1, position1, [0.5, -0.5])
      vec2.add(position1, position1, [0.5, 0.5])
      vec2.multiply(position1, position1, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      vec3.transformMat3(transform, vec3.fromValues(text.xe, text.ye, 1), context.transform.matrix)
      const position2 = vec2.fromValues(transform[0], transform[1])
      vec2.multiply(position2, position2, [0.5, -0.5])
      vec2.add(position2, position2, [0.5, 0.5])
      vec2.multiply(position2, position2, vec2.fromValues(context.viewportWidth, context.viewportHeight))
      this.drawStroked([position1, position2])
    })
  }
}

// export class ArcRenderer {
//   private ctx: OffscreenCanvasRenderingContext2D
//   public arcs: DatumArc[] = []
//   constructor(ctx: OffscreenCanvasRenderingContext2D, arcs: DatumArc[]) {
//     this.ctx = ctx
//     this.arcs = arcs
//   }

//   private drawStroked(center: vec2, radius: number, startAnle: number, endAngle: number, counterClockwise: boolean): void {
//     const [x, y] = center
//     this.ctx.strokeStyle = 'black';
//     this.ctx.lineWidth = 2;
//     this.ctx.beginPath();
//     this.ctx.arc(x, y, radius, startAnle, endAngle, counterClockwise);
//     this.ctx.stroke();
//     this.ctx.strokeStyle = 'white';
//     this.ctx.lineWidth = 1;
//     this.ctx.beginPath();
//     this.ctx.arc(x, y, radius, startAnle, endAngle, counterClockwise);
//     this.ctx.stroke();
//   }

//   public render(context: REGL.DefaultContext & WorldContext): void {
//     this.arcs.forEach(arc => {
//       const transform = vec3.create()
//       vec3.transformMat3(transform, vec3.fromValues(arc.xc, arc.yc, 1), context.transform.matrix)
//       const position = vec2.fromValues(transform[0], transform[1])
//       vec2.multiply(position, position, [0.5, -0.5])
//       vec2.add(position, position, [0.5, 0.5])
//       vec2.multiply(position, position, vec2.fromValues(context.viewportWidth, context.viewportHeight))
//       // this.drawStroked(position, arc.r, arc.start, arc.end)
//       const startAngle = arc.start * Math.PI / 180
//       const endAngle = arc.end * Math.PI / 180

//     })
//   }

// }
