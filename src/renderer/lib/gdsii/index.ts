// import gdsiiFile from './testdata/example.gds2?url'
// import gdsiiFile from './testdata/inv.gds2?url'
// import gdsiiFile from './testdata/example0.gds?url'
// import gdsiiFile from './testdata/example1.gds?url'
// import gdsiiFile from './testdata/example2.gds?url' // broken boundaries
// import gdsiiFile from './testdata/GdsIITests_test.gds?url' // broken boundaries, paths with different ends
// import gdsiiFile from './testdata/GdsIITests_circles.gds?url'

import { record_reader } from "./lexer"
import { parse } from "./parser"
import { convert } from "./converter"

import messages from "./messages"

import * as Comlink from "comlink"
import { AddLayerProps } from "@src/renderer/plugins"

export async function plugin(
  buffer: ArrayBuffer,
  props: Partial<AddLayerProps>,
  addLayer: (params: AddLayerProps) => void,
  addMessage: (title: string, message: string) => Promise<void>,
): Promise<void> {
  messages.setSender(addMessage, "GDSII")
  messages.clear()
  const tokens = record_reader(buffer)
  const bnf = parse(tokens)
  const layerHierarchy = convert(bnf)

  for (const [layer, shapes] of Object.entries(layerHierarchy)) {
    delete props.name
    addLayer({
      name: layer,
      units: "mm", // TODO: use 1 / (bnf.UNITS.metersPerDatabaseUnit * 1000),
      image: shapes.shapes,
      ...props,
    })
  }
}

Comlink.expose(plugin)
