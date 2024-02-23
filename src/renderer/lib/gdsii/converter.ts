import { vec2, Vec2 } from 'gl-matrix'

import * as TREE from './gdsii_tree'
import * as Symbols from '../../src/rendererv2/symbols'
import * as Shapes from '../../src/rendererv2/shapes'

// CELL structure and DATATYPE information is lost in the conversion.
// Each cell maps to a Shape
// only unreferenced cells are drawn

type GDSIIHierarchy = {
  [cellName: string]: {
    layer: number
    // datatype: number
    shape: Shapes.Shape
  }[]
}

type LayerHierarchy = {
  [layer: number]: {
    shapes: Shapes.Shape[]
  }
}

export function convert(gdsii: TREE.GDSIIBNF): LayerHierarchy {
  const scale = gdsii.UNITS.databaseUnit / gdsii.UNITS.userUnit
  // const scale = 0.001

  const availableCells = new Set<string>()
  const referencedCells = new Set<string>()
  const gdsiiHierarchy: GDSIIHierarchy = {}

  for (const cell of gdsii.structure) {
    const cellName = cell.STRNAME.name
    gdsiiHierarchy[cellName] = []
    availableCells.add(cellName)
    if (!cell.element) continue
    for (const element of cell.element) {
      if (!element.el) continue

      if (element.type === 'boundary' || element.type === 'box') {
        console.log('boundary|box', element)
        const el = element.el as TREE.boundary | TREE.box

        const first_contour_line_segment = new Shapes.Contour_Line_Segment({
          x: el.XY[0].x * scale,
          y: el.XY[0].y * scale
        })

        let contour_line_segments: Shapes.Contour_Line_Segment[] = []
        for (const xy of el.XY) {
          const contour_line_segment = new Shapes.Contour_Line_Segment({
            x: xy.x * scale,
            y: xy.y * scale
          })
          // console.log('xy', xy)
          // console.log('contour_line_segment', contour_line_segment)
          contour_line_segments.push(contour_line_segment)
          // contour_line_segments.push(contour_line_segment)
        }
        let contour = new Shapes.Contour({
          poly_type: 1,
          // Start point.
          xs: el.XY[0].x * scale,
          ys: el.XY[0].y * scale
        })
          .addSegment(first_contour_line_segment)
          .addSegments(contour_line_segments)
          .addSegment(first_contour_line_segment)

        const shape = new Shapes.Surface({
          polarity: 1
        }).addContour(contour)

        gdsiiHierarchy[cellName].push({
          layer: el.LAYER.layer,
          shape: shape
        })
      }

      else if (element.type === 'path') {
        {
          // console.log('path', element)
          const el = element.el as TREE.path
          const width = (el.WIDTH ? el.WIDTH.width : 0.001) * scale

          const lines: { x: number; y: number }[] = []
          for (const [i, xy] of el.XY.entries()) {
            if (i == 0) continue
            const line = {
              x: xy.x * scale,
              y: xy.y * scale
            }
            lines.push(line)
          }
          let polyline = new Shapes.PolyLine({
            // Start point.
            xs: el.XY[0].x * scale,
            ys: el.XY[0].y * scale,
            // GDSII spec. 0=Flush, 1=Half Round Extension, 2=Half Width Extension, 4=Custom Extension
            cornertype: ['miter', 'round', 'miter', undefined][
              el.PATHTYPE ? el.PATHTYPE.pathtype : 0
            ] as 'miter' | 'round' | undefined,
            pathtype: ['none', 'round', 'square', 'none'][
              el.PATHTYPE ? el.PATHTYPE.pathtype : 0
            ] as 'none' | 'round' | 'square',
            // Polarity. 0 = negative, 1 = positive
            polarity: 1,
            width: width
          }).addLines(lines)

          gdsiiHierarchy[cellName].push({
            layer: el.LAYER.layer,
            shape: polyline
          })
        }
      } else if (element.type === 'sref') {
        console.log('sref with S&R', element)
        const el = element.el as TREE.sref
        const srefName = el.SNAME.name
        referencedCells.add(srefName)
        // check if gdsiiHierarchy[srefName] exists
        if (!gdsiiHierarchy[srefName]) {
          console.warn(`SREF ${srefName} not found in hierarchy.`)
          continue
        }
        for (const [idx, cell] of gdsiiHierarchy[srefName].entries()) {
          // create StepAndRepeat
          const sr_shape = new Shapes.StepAndRepeat({
            shapes: [cell.shape],
            repeats: [
              {
                datum: el.strans?.STRANS.reflectAboutX ? vec2.fromValues(el.XY[0].x * scale, el.XY[0].y * -scale) : vec2.fromValues(el.XY[0].x * scale, el.XY[0].y * scale),
                rotation: (el.strans?.STRANS.reflectAboutX ? -1 : 1)* (el.strans?.ANGLE?.angle || 0),
                scale: el.strans?.MAG?.mag || 1, // Resize factor. 1 = normal size
                mirror: el.strans?.STRANS.reflectAboutX ? 1 : 0, // 0 = no mirror, 1 = mirror
                order: ['mirror', 'translate', 'rotate', 'scale']
              }
            ]
          })
          gdsiiHierarchy[cellName].push({
            layer: cell.layer,
            shape: sr_shape
          })
        }
        
      }

      else {
        console.warn('unhandled element', element)
      }
    }
  }

  const topLevelCells = Array.from(availableCells).filter(function (obj) {
    return Array.from(referencedCells).indexOf(obj) == -1
  })
  // console.log('topLevelCells', topLevelCells)

  // convert GDSIIHierarchy to LayerHierarchy
  const layerHierarchy: LayerHierarchy = {}
  for (const cellName of topLevelCells) {
    for (const el of gdsiiHierarchy[cellName]) {
      const layer = el.layer
      if (!layerHierarchy[layer]) {
        layerHierarchy[layer] = {
          shapes: []
        }
      }
      layerHierarchy[layer].shapes.push(el.shape)
    }
  }

  return layerHierarchy
}
