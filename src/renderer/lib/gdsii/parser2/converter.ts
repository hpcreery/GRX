import * as GDSII from './gdsii'
import * as TREE from './tree'
import * as parser from './parser'

import {
  MacroSymbol,
  STANDARD_SYMBOLS,
  STANDARD_SYMBOLS_MAP,
  StandardSymbol
} from '../../../src/rendererv2/symbols'
import {
  Pad,
  Line,
  // Arc,
  Surface,
  Contour,
  // Contour_Arc_Segment,
  Contour_Line_Segment,
  Shape
} from '../../../src/rendererv2/shapes'
// import * as Shapes from '../../../src/rendererv2/shapes'
import { RenderEngine } from '../../../src/rendererv2/engine'
import { IPlotRecord, ISymbolRecord } from '../../../src/rendererv2/types'

// CELL structure and DATATYPE information is lost in the conversion.

// Each cell maps to a Pad
// only unreferenced cell is drawn

type GDSIIHierarchy = {
  [cellName: string]: {
    layer: number
    // datatype: number
    shape: Shape
    // shape: MacroSymbol
  }[]
}

type LayerHierarchy = {
  [layer: number]: {
    shapes: Shape[]
    // shapes: MacroSymbol[]
  }
}

export function addGDSII(engine: RenderEngine, gdsii: TREE.GDSIIBNF) {
  const scale = gdsii.UNITS.databaseUnit / gdsii.UNITS.userUnit
  // const scale = gdsii.UNITS.userUnit / gdsii.UNITS.databaseUnit
  console.log('scale', scale)

  // const cells = new Map<string, Array<Surface>>()
  // const layers = new Map<number, Array<Surface>>()
  // const macros: MacroSymbol[] = []
  // const symbols: ISymbolRecord[] = []

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
      switch (element.type) {
        case 'box':
        case 'boundary':
          // console.log('boundary', element)
          let contour = new Contour({
            poly_type: 1,
            // Start point.
            xs: element.el.XY[0].x * scale,
            ys: element.el.XY[0].y * scale
          })
          for (const xy of element.el.XY) {
            contour = contour.addSegments([
              new Contour_Line_Segment({
                x: xy.x * scale,
                y: xy.y * scale
              })
            ])
          }
          contour = contour.addSegments([
            new Contour_Line_Segment({
              x: element.el.XY[0].x * scale,
              y: element.el.XY[0].y * scale
            })
          ])
          const shape = new Surface({
            polarity: 1
          }).addContour(contour)

          gdsiiHierarchy[cellName].push({
            layer: element.el.LAYER.layer,
            shape: shape
          })

          break

        case 'path':
          const width = (element.el.WIDTH ? element.el.WIDTH.width : 0.001) * scale

          const round_sym_ptr = new StandardSymbol({
            id: 'round', // id
            symbol: STANDARD_SYMBOLS_MAP.Round, // symbol
            width: width, // width, square side, diameter
            height: width, // height
            corner_radius: 0.002, // corner radius
            corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
            outer_dia: width, // — Outer diameter of the shape
            inner_dia: 0.008, // — Inner diameter of the shape
            line_width: 0.001, // — Line width of the shape (applies to the whole shape)
            line_length: 0.02, // — Line length of the shape (applies to the whole shape)
            angle: 0, // — Angle of the spoke from 0 degrees
            gap: 0.001, // — Gap
            num_spokes: 2, // — Number of spokes
            round: 0, // —r|s == 1|0 — Support for rounded or straight corners
            cut_size: 0, // — Size of the cut ( see corner radius )
            ring_width: 0.001, // — Ring width
            ring_gap: 0.004, // — Ring gap
            num_rings: 2 // — Number of rings
          })
          const square_sym_ptr = new StandardSymbol({
            id: 'round', // id
            symbol: STANDARD_SYMBOLS_MAP.Square, // symbol
            width: width, // width, square side, diameter
            height: width, // height
            corner_radius: 0.002, // corner radius
            corners: 15, // — Indicates which corners are rounded. x<corners> is omitted if all corners are rounded.
            outer_dia: width, // — Outer diameter of the shape
            inner_dia: 0.008, // — Inner diameter of the shape
            line_width: 0.001, // — Line width of the shape (applies to the whole shape)
            line_length: 0.02, // — Line length of the shape (applies to the whole shape)
            angle: 0, // — Angle of the spoke from 0 degrees
            gap: 0.001, // — Gap
            num_spokes: 2, // — Number of spokes
            round: 0, // —r|s == 1|0 — Support for rounded or straight corners
            cut_size: 0, // — Size of the cut ( see corner radius )
            ring_width: 0.001, // — Ring width
            ring_gap: 0.004, // — Ring gap
            num_rings: 2 // — Number of rings
          })

          const lines: Shape[] = []
          for (const [i, xy] of element.el.XY.entries()) {
            if (i == 0) continue
            const line = new Line({
              // Start point.
              xs: element.el.XY[i - 1].x * scale,
              ys: element.el.XY[i - 1].y * scale,

              // End point.
              xe: xy.x * scale,
              ye: xy.y * scale,

              // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
              // sym_num: i % 2 == 0 ? STANDARD_SYMBOLS_MAP.Square : STANDARD_SYMBOLS_MAP.Round,
              symbol: [square_sym_ptr, round_sym_ptr, square_sym_ptr][
                element.el.PATH_TYPE ? element.el.PATH_TYPE.path_type : 0
              ],
              // The symbol with index <sym_num> is enlarged or shrunk by factor <resize_factor>.
              // Polarity. 0 = negative, 1 = positive
              // polarity: i % 2,
              // polarity: Math.random() > 0.5 ? 1 : 0,
              polarity: 1
            })
            lines.push(line)
          }
          let macro = new MacroSymbol({
            id: 'path', // id
            shapes: lines
          })
          let pad = new Pad({
            x: 0,
            y: 0,
            symbol: macro, // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
            resize_factor: 1,
            polarity: 1 // Polarity. 0 = negative, 1 = positive
            // Pad orientation (degrees)
            // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
            // rotation: element.el.ANGLE ? element.el.ANGLE.angle : 0,
            // mirror: element.el.STRANS ? (element.el.STRANS.mirror ? 1 : 0) : 0 // 0 = no mirror, 1 = mirror
          })
          gdsiiHierarchy[cellName].push({
            layer: element.el.LAYER.layer,
            shape: pad
          })
          break

        case 'sref':
          // console.log('sref', element)
          const srefName = element.el.SNAME.name
          referencedCells.add(srefName)
          // check if gdsiiHierarchy[srefName] exists
          if (!gdsiiHierarchy[srefName]) {
            console.warn(`SREF ${srefName} not found in hierarchy.`)
            continue
          }
          // convert shape to translated shape by making it a macro then placing as a pad
          for (const el of gdsiiHierarchy[srefName]) {
            let macro = new MacroSymbol({
              id: srefName,
              shapes: [el.shape]
            })
            let pad = new Pad({
              x: element.el.XY[0].x * scale,
              y: element.el.XY[0].y * scale,
              symbol: macro, // The index, in the feature symbol names section, of the symbol to be used to draw the pad.
              resize_factor: 1,
              polarity: 1, // Polarity. 0 = negative, 1 = positive
              // Pad orientation (degrees)
              // Rotation is any number of degrees, although 90º multiples is the usual angle; positive rotation is always counterclockwise as viewed from the board TOP (primary side).
              rotation: element.el.ANGLE ? element.el.ANGLE.angle : 0,
              mirror: element.el.STRANS ? (element.el.STRANS.mirror ? 1 : 0) : 0 // 0 = no mirror, 1 = mirror
            })
            gdsiiHierarchy[cellName].push({
              layer: el.layer,
              shape: pad
            })
          }
          break
        default:
          console.warn('unhandled element', element)
      }
    }
  }

  let topLevelCells = Array.from(availableCells).filter(function (obj) {
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

  // console.log('layerHierarchy', layerHierarchy)
  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    engine.addLayer({
      name: layer,
      // symbols: [],
      // macros: [],
      image: shapes.shapes
    })
  }
}
