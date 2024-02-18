import * as TREE from './gdsii_tree'

import { MacroSymbol, STANDARD_SYMBOLS_MAP, StandardSymbol } from '../../src/rendererv2/symbols'
import {
  Pad,
  Line,
  PolyLine,
  // Arc,
  Surface,
  Contour,
  // Contour_Arc_Segment,
  Contour_Line_Segment,
  Shape
} from '../../src/rendererv2/shapes'
// import * as Shapes from '../../src/rendererv2/shapes'

// CELL structure and DATATYPE information is lost in the conversion.

// Each cell maps to a Shape
// only unreferenced cell is drawn

type GDSIIHierarchy = {
  [cellName: string]: {
    layer: number
    // datatype: number
    shape: Shape
  }[]
}

type LayerHierarchy = {
  [layer: number]: {
    shapes: Shape[]
  }
}

export function convert(gdsii: TREE.GDSIIBNF): LayerHierarchy {
  const scale = gdsii.UNITS.databaseUnit / gdsii.UNITS.userUnit

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
      let el
      switch (element.type) {
        case 'box':
        case 'boundary': {
          // console.log('boundary|box', element)
          el = element.el as TREE.boundary | TREE.box
          let contour = new Contour({
            poly_type: 1,
            // Start point.
            xs: el.XY[0].x * scale,
            ys: el.XY[0].y * scale
          })
          for (const xy of el.XY) {
            contour = contour.addSegments([
              new Contour_Line_Segment({
                x: xy.x * scale,
                y: xy.y * scale
              })
            ])
          }
          contour = contour.addSegments([
            new Contour_Line_Segment({
              x: el.XY[0].x * scale,
              y: el.XY[0].y * scale
            })
          ])
          const shape = new Surface({
            polarity: 1
          }).addContour(contour)

          gdsiiHierarchy[cellName].push({
            layer: el.LAYER.layer,
            shape: shape
          })

          break
        }

        case 'path':
          {
            // console.log('path', element)
            el = element.el as TREE.path
            const width = (el.WIDTH ? el.WIDTH.width : 0.001) * scale

            const lines: { x: number; y: number; }[] = []
            for (const [i, xy] of el.XY.entries()) {
              if (i == 0) continue
              const line= {
                x: xy.x * scale,
                y: xy.y * scale,
              }
              lines.push(line)
            }
            let polyline = new PolyLine({
              // Start point.
              xs: el.XY[0].x * scale,
              ys: el.XY[0].y * scale,
              // GDSII spec. 0=Flush, 1=Half Round Extension, 2=Half Width Extension, 4=Custom Extension
              cornertype: ['miter', 'round', 'miter', undefined][el.PATHTYPE ? el.PATHTYPE.pathtype : 0] as 'miter' | 'round' | undefined,
              pathtype: ['none', 'round', 'square', 'none'][el.PATHTYPE ? el.PATHTYPE.pathtype : 0] as 'none' | 'round' | 'square',
              // Polarity. 0 = negative, 1 = positive
              polarity: 1,
              width: width,
            }).addLines(lines)
            
            gdsiiHierarchy[cellName].push({
              layer: el.LAYER.layer,
              shape: polyline
            })
          }
          break

        case 'sref': {
          // console.log('sref', element)
          el = element.el as TREE.sref
          const srefName = el.SNAME.name
          referencedCells.add(srefName)
          // check if gdsiiHierarchy[srefName] exists
          if (!gdsiiHierarchy[srefName]) {
            console.warn(`SREF ${srefName} not found in hierarchy.`)
            continue
          }
          // convert shape to translated shape by making it a macro then placing as a pad
          for (const [idx, cell] of gdsiiHierarchy[srefName].entries()) {
            const macro = new MacroSymbol({
              id: `${srefName} ${idx}`,
              shapes: [cell.shape]
            })
            const pad = new Pad({
              x: el.XY[0].x * scale,
              y: el.XY[0].y * scale,
              symbol: macro, // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
              resize_factor: 1,
              polarity: 1, // Polarity. 0 = negative, 1 = positive
              // Pad orientation (degrees)
              // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
              rotation: el.ANGLE ? el.ANGLE.angle : 0,
              mirror: el.STRANS ? (el.STRANS.mirror ? 1 : 0) : 0 // 0 = no mirror, 1 = mirror
            })
            gdsiiHierarchy[cellName].push({
              layer: cell.layer,
              shape: pad
            })
          }
          break
        }
        default:
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
