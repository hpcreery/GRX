import { vec2 } from "gl-matrix"
import * as TREE from "./gdsii_tree"
import * as Shapes from "../../src/renderer/shapes"
import { GDSIIHierarchy } from "./types"

export class Plotter {
  scale: number
  availableCells: Set<string>
  referencedCells: Set<string>
  gdsiiHierarchy: GDSIIHierarchy

  currentCellName: string

  constructor(scale: number) {
    this.scale = scale

    this.availableCells = new Set<string>()
    this.referencedCells = new Set<string>()
    this.gdsiiHierarchy = {}
    this.currentCellName = ""
  }

  public withCell(cell: TREE.structure): void {
    this.currentCellName = cell.STRNAME.name
    this.gdsiiHierarchy[this.currentCellName] = []
    this.availableCells.add(this.currentCellName)
  }

  private pushShape(layer: number, shape: Shapes.Shape): void {
    this.gdsiiHierarchy[this.currentCellName].push({
      layer: layer,
      shape: shape,
    })
  }

  public addPolygon(el: TREE.boundary | TREE.box): Shapes.Surface {
    const contour_line_segments: Shapes.Contour_Line_Segment[] = []
    for (const xy of el.XY) {
      const contour_line_segment = new Shapes.Contour_Line_Segment({
        x: xy.x * this.scale,
        y: xy.y * this.scale,
      })
      contour_line_segments.push(contour_line_segment)
    }

    const contour = new Shapes.Contour({
      poly_type: 1,
      xs: el.XY[0].x * this.scale,
      ys: el.XY[0].y * this.scale,
    }).addSegments(contour_line_segments)

    const shape = new Shapes.Surface({
      polarity: 1,
    }).addContour(contour)

    this.pushShape(el.LAYER.layer, shape)
    return shape
  }

  public addPolyLine(el: TREE.path): Shapes.PolyLine {
    // const el = element.el as TREE.path
    const width = (el.WIDTH ? el.WIDTH.width : 0.001) * this.scale

    const lines: { x: number; y: number }[] = []
    for (const [i, xy] of el.XY.entries()) {
      if (i == 0) continue
      const line = {
        x: xy.x * this.scale,
        y: xy.y * this.scale,
      }
      lines.push(line)
    }
    const polyline = new Shapes.PolyLine({
      // Start point.
      xs: el.XY[0].x * this.scale,
      ys: el.XY[0].y * this.scale,
      // GDSII spec. 0=Flush, 1=Half Round Extension, 2=Half Width Extension, 4=Custom Extension
      // See Records 0x30 and 0x31
      cornertype: ["miter", "round", "miter", undefined][el.PATHTYPE ? el.PATHTYPE.pathtype : 0] as "miter" | "round" | undefined,
      pathtype: ["none", "round", "square", "none"][el.PATHTYPE ? el.PATHTYPE.pathtype : 0] as "none" | "round" | "square",
      // Polarity. 0 = negative, 1 = positive
      polarity: 1,
      width: width,
    }).addLines(lines)

    this.pushShape(el.LAYER.layer, polyline)
    return polyline
  }

  public addReference(el: TREE.sref): void {
    const srefName = el.SNAME.name

    this.referencedCells.add(srefName)
    // check if gdsiiHierarchy[srefName] exists
    if (!this.gdsiiHierarchy[srefName]) {
      console.warn(`SREF ${srefName} not found in hierarchy.`)
      return
    }
    for (const [_idx, cell] of this.gdsiiHierarchy[srefName].entries()) {
      const srShape = new Shapes.StepAndRepeat({
        shapes: [cell.shape],
        break: true,
        repeats: [
          {
            datum: vec2.fromValues(el.XY[0].x * this.scale, el.XY[0].y * this.scale),
            rotation: el.strans?.ANGLE?.angle || 0,
            scale: el.strans?.MAG?.mag || 1, // Resize factor. 1 = normal size
            mirror_x: 0, // 0 = no mirror, 1 = mirror
            mirror_y: el.strans?.STRANS.reflectAboutX ? 1 : 0,
            order: ["translate", "rotate", "mirror", "scale"],
          },
        ],
      })
      this.pushShape(cell.layer, srShape)
    }
  }

  public addArrayReference(el: TREE.aref): void {
    // const el = element.el as TREE.aref
    const arefName = el.SNAME.name
    this.referencedCells.add(arefName)
    // check if gdsiiHierarchy[srefName] exists
    if (!this.gdsiiHierarchy[arefName]) {
      console.warn(`AREF ${arefName} not found in hierarchy.`)
      // continue
      return
    }
    const origin = vec2.fromValues(el.XY[0].x * this.scale, el.XY[0].y * this.scale)
    const cols = el.COLROW.cols || 1
    const rows = el.COLROW.rows || 1
    const xDisplace = vec2.fromValues(el.XY[1].x * this.scale, el.XY[1].y * this.scale)
    const yDisplace = vec2.fromValues(el.XY[2].x * this.scale, el.XY[2].y * this.scale)
    const xSpacing = vec2.divide(vec2.create(), vec2.sub(vec2.create(), xDisplace, origin), [cols, cols])
    const ySpacing = vec2.divide(vec2.create(), vec2.sub(vec2.create(), yDisplace, origin), [rows, rows])

    for (const [_idx, cell] of this.gdsiiHierarchy[arefName].entries()) {
      const repeats: Shapes.StepAndRepeat["repeats"] = []
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          repeats.push({
            datum: vec2.add(
              vec2.create(),
              origin,
              vec2.add(vec2.create(), vec2.scale(vec2.create(), xSpacing, i), vec2.scale(vec2.create(), ySpacing, j)),
            ),
            rotation: el.strans?.ANGLE?.angle || 0,
            scale: el.strans?.MAG?.mag || 1, // Resize factor. 1 = normal size
            mirror_x: 0,
            mirror_y: 0,
            order: ["mirror", "translate", "rotate", "scale"],
          })
        }
      }

      const srShape = new Shapes.StepAndRepeat({
        shapes: [cell.shape],
        break: true,
        repeats: repeats,
      })
      // gdsiiHierarchy[cellName].push({
      //   layer: cell.layer,
      //   shape: srShape
      // })
      this.pushShape(cell.layer, srShape)
    }
  }
}
