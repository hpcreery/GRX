import { vec2 } from 'gl-matrix'

import * as TREE from './gdsii_tree'
import * as Shapes from '../../src/renderer/shapes'

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
  // const scale = gdsii.UNITS.databaseUnit / gdsii.UNITS.userUnit
  const scale = 0.01

  const availableCells = new Set<string>()
  const referencedCells = new Set<string>()
  const gdsiiHierarchy: GDSIIHierarchy = {}

  for (const cell of gdsii.structure) {
    const cellName = cell.STRNAME.name
    gdsiiHierarchy[cellName] = []
    availableCells.add(cellName)
    if (!cell.element) continue
    for (const element of cell.element) {
      // console.log(`${cellName} = ${element.type}`)
      if (!element.el) continue

      if (element.type === 'boundary' || element.type === 'box') {
        // console.log('boundary|box', cellName, element)
        const el = element.el as TREE.boundary | TREE.box

        const contour_line_segments: Shapes.Contour_Line_Segment[] = []
        for (const xy of el.XY) {
          const contour_line_segment = new Shapes.Contour_Line_Segment({
            x: xy.x * scale,
            y: xy.y * scale
          })
          contour_line_segments.push(contour_line_segment)
        }

        const contour = new Shapes.Contour({
          poly_type: 1,
          xs: el.XY[0].x * scale,
          ys: el.XY[0].y * scale
        }).addSegments(contour_line_segments)

        const shape = new Shapes.Surface({
          polarity: 1
        }).addContour(contour)

        gdsiiHierarchy[cellName].push({
          layer: el.LAYER.layer,
          shape: shape
        })
      } else if (element.type === 'path') {
        {
          // console.log('path', cellName, element)
          if (cellName === "path4_no_bgn" || cellName === "path4_no_end") {
            console.log('path4_no_bgn', element, JSON.stringify(element, null, 2))
          }
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
          const polyline = new Shapes.PolyLine({
            // Start point.
            xs: el.XY[0].x * scale,
            ys: el.XY[0].y * scale,
            // GDSII spec. 0=Flush, 1=Half Round Extension, 2=Half Width Extension, 4=Custom Extension
            // See Records 0x30 and 0x31
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
        // console.log('sref with S&R', cellName, element)
        const el = element.el as TREE.sref
        const srefName = el.SNAME.name

        referencedCells.add(srefName)
        // check if gdsiiHierarchy[srefName] exists
        if (!gdsiiHierarchy[srefName]) {
          console.warn(`SREF ${srefName} not found in hierarchy.`)
          continue
        }
        for (const [idx, cell] of gdsiiHierarchy[srefName].entries()) {
          const srShape = new Shapes.StepAndRepeat({
            shapes: [cell.shape],
            repeats: [
              {
                datum: el.strans?.STRANS.reflectAboutX
                  ? vec2.fromValues(el.XY[0].x * scale, el.XY[0].y * -scale)
                  : vec2.fromValues(el.XY[0].x * scale, el.XY[0].y * scale),
                rotation:
                  (el.strans?.STRANS.reflectAboutX ? -1 : 1) * (el.strans?.ANGLE?.angle || 0),
                scale: el.strans?.MAG?.mag || 1, // Resize factor. 1 = normal size
                mirror_x: el.strans?.STRANS.reflectAboutX ? 1 : 0, // 0 = no mirror, 1 = mirror
                mirror_y: 0,
                order: ['mirror', 'translate', 'rotate', 'scale']
              }
            ]
          })
          gdsiiHierarchy[cellName].push({
            layer: cell.layer,
            shape: srShape
          })
        }
      } else if (element.type === 'aref') {
        console.log('aref', cellName, element, JSON.stringify(element))
        const el = element.el as TREE.aref
        const arefName = el.SNAME.name
        referencedCells.add(arefName)
        // check if gdsiiHierarchy[srefName] exists
        if (!gdsiiHierarchy[arefName]) {
          console.warn(`AREF ${arefName} not found in hierarchy.`)
          continue
        }
        if (cellName === 'aref1_2_3') {
          console.log('aref1_2_3', element, JSON.stringify(element, null, 2))
        }
        const origin = vec2.fromValues(el.XY[0].x * scale, el.XY[0].y * scale)
        const cols = el.COLROW.cols || 1
        const rows = el.COLROW.rows || 1
        const xDisplace = vec2.fromValues(el.XY[1].x * scale, el.XY[1].y * scale)
        const yDisplace = vec2.fromValues(el.XY[2].x * scale, el.XY[2].y * scale)
        const xSpacing = vec2.divide(vec2.create(), vec2.sub(vec2.create(), xDisplace, origin), [cols, cols])
        const ySpacing = vec2.divide(vec2.create(), vec2.sub(vec2.create(), yDisplace, origin), [rows, rows])

        for (const [idx, cell] of gdsiiHierarchy[arefName].entries()) {
          const repeats: Shapes.StepAndRepeat['repeats'] = []
          for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
              repeats.push({
                datum: vec2.add(vec2.create(), origin, vec2.add(vec2.create(), vec2.scale(vec2.create(), xSpacing, i), vec2.scale(vec2.create(), ySpacing, j))),
                rotation:
                  (el.strans?.STRANS.reflectAboutX ? -1 : 1) * (el.strans?.ANGLE?.angle || 0),
                  scale: el.strans?.MAG?.mag || 1, // Resize factor. 1 = normal size
                mirror_x: 0,
                mirror_y: 0,
                order: ['mirror', 'translate', 'rotate', 'scale']
              })
            }
          }

          const srShape = new Shapes.StepAndRepeat({
            shapes: [cell.shape],
            repeats: repeats
          })
          gdsiiHierarchy[cellName].push({
            layer: cell.layer,
            shape: srShape
          })
        }
      } else {
        console.warn('unhandled element', element, JSON.stringify(element))
      }
    }
  }

  const topLevelCells = Array.from(availableCells).filter(function (obj) {
    return Array.from(referencedCells).indexOf(obj) == -1
  })
  console.log('topLevelCells', topLevelCells)

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
