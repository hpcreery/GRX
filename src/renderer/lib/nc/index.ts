import type { LayerRendererProps } from '@src/renderer/layer'
import * as Comlink from 'comlink'

import { parser, SelectLexer, NCToShapesVisitor } from './parser/parser'


export async function plugin(file: string, props: Partial<Omit<LayerRendererProps, "regl">>, addLayer: (params: Omit<LayerRendererProps, "regl">) => void): Promise<void> {

  console.time('parse')
  const lexingResult = SelectLexer.tokenize(file);
  parser.input = lexingResult.tokens;
  const result = parser.program();
  console.timeEnd('parse')
  console.time('visit')
  const visitor = new NCToShapesVisitor()
  visitor.visit(result)
  console.timeEnd('visit')
  console.log('result', visitor.result)

  addLayer({
    name: props.name || 'NC',
    image: visitor.result,
    units: visitor.state.units,
    ...props
  })
}

Comlink.expose(plugin)
