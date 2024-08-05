import * as Comlink from 'comlink'

import { parser, SelectLexer, NCToShapesVisitor } from './parser/parser'
import { AddLayerProps } from '@src/renderer/plugins'


export async function plugin(buffer: ArrayBuffer, props: Partial<AddLayerProps>, addLayer: (params: AddLayerProps) => void): Promise<void> {

  console.time('decode')
  const decoder = new TextDecoder('utf-8')
  const file = decoder.decode(buffer)
  console.timeEnd('decode')
  console.time('parse')
  const lexingResult = SelectLexer.tokenize(file);
  parser.input = lexingResult.tokens;
  // @ts-ignore parser missing type for dynamically created methods
  const result = parser.program();
  console.timeEnd('parse')
  console.time('visit')
  const visitor = new NCToShapesVisitor()
  visitor.visit(result)
  console.timeEnd('visit')

  addLayer({
    name: props.name || 'NC',
    image: visitor.result,
    units: visitor.state.units,
    ...props
  })
}

Comlink.expose(plugin)
