import * as TREE from "./gdsii_tree"
import { Plotter } from "./plotter"
import { LayerHierarchy } from "./types"

// CELL structure and DATATYPE information is lost in the conversion.
// Each cell maps to a Shape
// only unreferenced cells are drawn

export function convert(gdsii: TREE.GDSIIBNF): LayerHierarchy {
  const scale = gdsii.UNITS.metersPerDatabaseUnit / gdsii.UNITS.userUnitsPerDatabaseUnit
  // console.log('scale', scale)

  const plotter = new Plotter(scale)

  for (const cell of gdsii.structure) {
    plotter.withCell(cell)
    if (!cell.element) continue
    for (const element of cell.element) {
      // console.log(`${cellName} = ${element.type}`)
      if (!element.el) continue
      if (element.type === "boundary" || element.type === "box") {
        plotter.addPolygon(element.el as TREE.boundary | TREE.box)
      } else if (element.type === "path") {
        plotter.addPolyLine(element.el as TREE.path)
      } else if (element.type === "sref") {
        plotter.addReference(element.el as TREE.sref)
      } else if (element.type === "aref") {
        plotter.addArrayReference(element.el as TREE.aref)
      } else {
        console.warn("unhandled element", element, JSON.stringify(element))
      }
    }
  }

  const topLevelCells = Array.from(plotter.availableCells).filter(function (obj) {
    return Array.from(plotter.referencedCells).indexOf(obj) == -1
  })
  // console.log('topLevelCells', topLevelCells)

  // convert GDSIIHierarchy to LayerHierarchy
  const layerHierarchy: LayerHierarchy = {}
  for (const cellName of topLevelCells) {
    for (const el of plotter.gdsiiHierarchy[cellName]) {
      const layer = el.layer
      if (!layerHierarchy[layer]) {
        layerHierarchy[layer] = {
          shapes: [],
        }
      }
      layerHierarchy[layer].shapes.push(el.shape)
    }
  }

  return layerHierarchy
}
