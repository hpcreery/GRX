import type * as TREE from "@grx/parser-gdsii/gdsii_tree"
import messages from "./messages"
import { Plotter } from "./plotter"
import type { LayerHierarchy } from "./types"

// CONVERTER
// CELL structure and DATATYPE information is lost in the conversion.
// Each cell maps to a Shape
// only unreferenced cells are drawn

export function convert(gdsii: TREE.GDSIIBNF): LayerHierarchy {
  const scale = gdsii.UNITS.metersPerDatabaseUnit * 1000 // to convert to mm

  const plotter = new Plotter(scale)

  for (const cell of gdsii.structure) {
    plotter.withCell(cell)
    if (!cell.element) continue
    for (const element of cell.element) {
      if (!element.el) continue
      if (element.type === "boundary" || element.type === "box") {
        plotter.addPolygon(element.el as TREE.boundary | TREE.box)
      } else if (element.type === "path") {
        plotter.addPolyLine(element.el as TREE.path)
      } else if (element.type === "sref") {
        plotter.addReference(element.el as TREE.sref)
      } else if (element.type === "aref") {
        plotter.addArrayReference(element.el as TREE.aref)
      } else if (element.type === "text") {
        plotter.addText(element.el as TREE.text)
      } else {
        messages.warn(`Converter: unhandled element, ${JSON.stringify(element)}`)
      }
    }
  }

  const topLevelCells = Array.from(plotter.availableCells).filter((obj) => Array.from(plotter.referencedCells).indexOf(obj) == -1)

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
