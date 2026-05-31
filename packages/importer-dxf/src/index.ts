import DxfParser from "dxf-parser"
import * as converter from "./converter"

export function parseDXF(dxfString: string): converter.Layers {
  const parser = new DxfParser()
  let dxf
  try {
    dxf = parser.parse(dxfString)
  } catch (err) {
    console.error("Failed to parse DXF file:", err instanceof Error ? err.message : err)
    throw new Error(`Failed to parse DXF file: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!dxf) {
    console.error("Failed to parse DXF file")
    throw new Error("Failed to parse DXF file")
  }

  const layerHierarchy = converter.convert(dxf)
  return layerHierarchy
}

// see https://github.com/vagran/dxf-viewer/tree/master/src/parser
