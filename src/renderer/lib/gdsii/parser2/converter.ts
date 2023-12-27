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
  Arc,
  Surface,
  Contour,
  Contour_Arc_Segment,
  Contour_Line_Segment
} from '../../../src/rendererv2/shapes'
import { RenderEngine } from '../../../src/rendererv2/engine'
import { IPlotRecord, ISymbolRecord } from '../../../src/rendererv2/types'

// CELL structure and DATATYPE information is lost in the conversion.

export function addGDSII(engine: RenderEngine, gdsii: TREE.GDSIIBNF) {
  const scale = gdsii.UNITS.databaseUnit / gdsii.UNITS.userUnit
  // const scale = gdsii.UNITS.userUnit / gdsii.UNITS.databaseUnit
  console.log('scale', scale)

  // const cells = new Map<string, Array<Surface>>()
  // const layers = new Map<number, Array<Surface>>()
  // const macros: MacroSymbol[] = []
  // const symbols: ISymbolRecord[] = []

  for (const cell of gdsii.structure) {
    const shapes: Shape[] = []
    for (const element of cell.element) {
      switch (element.type) {
        case 'box':
        case 'boundary':
          console.log('boundary', element)
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
          shapes.push(
            new Surface({
              polarity: 1
            }).addContour(contour)
          )

          // const layer = element.el.LAYER.layer
          // let surface = layers.get(layer)
          // if (!surface) {
          //   surface = []
          //   layers.set(layer, surface)
          // }
          // surface.push(
          //
          // )
          break

        // case 'PATH':
      }
    }

    new MacroSymbol({
      id: cell.STRNAME.name,
      shapes: shapes
    })
  }
  for (const [layer, surface] of layers.entries()) {
    engine.addLayer({
      name: layer.toString(),
      symbols: [],
      macros: [],
      image: surface
    })
  }

  // const SURFACES_ARRAY: Array<Surface> = []
  // SURFACES_ARRAY.push(
  //   new Surface({
  //     polarity: 1
  //   }).addContours([
  //     new Contour({
  //       poly_type: 1,
  //       // Start point.
  //       xs: 0,
  //       ys: 0
  //     }).addSegments([
  //       new Contour_Line_Segment({
  //         x: 0.05,
  //         y: -0.02
  //       }),
  //       new Contour_Line_Segment({
  //         x: 0.05,
  //         y: 0.05
  //       }),
  //       new Contour_Line_Segment({
  //         x: -0.05,
  //         y: 0.05
  //       }),
  //       new Contour_Line_Segment({
  //         x: -0.05,
  //         y: -0.05
  //       }),
  //       new Contour_Line_Segment({
  //         x: 0,
  //         y: 0
  //       })
  //     ])
  //   ])
  // )
  // engine.addLayer({
  //   name: 'gdslayer3',
  //   symbols: [],
  //   macros: [],
  //   image: [...SURFACES_ARRAY]
  // })
}
