import React from 'react'
import { Flex, Textarea } from '@mantine/core'
import { Shape } from '@src/renderer/shapes';
import { parser, SelectLexer, NCToShapesVisitor } from './chevrotain-parser/parser'

const drill = `T01`

// const tree = parse(drill)
// const shapes = plot(tree)
// const new_tree = p("T01")

export default function NCDemo(): JSX.Element {
  const [highlightedLines, setHighlightedLines] = React.useState<number[]>([])
  const [input, setInput] = React.useState<string>(drill)
  const [parsed, setParsed] = React.useState<any>({})
  const [shapes, setShapes] = React.useState<Shape[]>([])
  const [error, setError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    try {
      // reset()
      console.time('parse')
      const lexingResult = SelectLexer.tokenize(input);
      parser.input = lexingResult.tokens;
      const result = parser.program();
      setParsed(result)
      console.timeEnd('parse')
      const visitor = new NCToShapesVisitor()
      visitor.visit(result)
      console.log('result', visitor.result)
      setShapes(visitor.result)
      console.log(lexingResult)
      if (lexingResult.errors.length > 0) {
        console.error('LEXER ERRORS', lexingResult.errors)
      }
      console.log(result)
      if (parser.errors.length > 0) {
        // throw new Error("sad sad panda, Parsing errors detected");
        // console.log('ERRORS', parser.errors.map(e => e.message))
        parser.errors.forEach(e => console.error('PARSER ERROR: ', e.message))
        setError(parser.errors.map(e => e.message).join('\n'))
      } else {
        setError(undefined)
      }
    } catch (err) {
      setParsed({})
      setError(String(err))

    }
  }, [input])


  return <div
    style={{
      height: '100vh',
      overflow: 'hidden'
    }}>
    <Flex
      justify="center"
      align="flex-start"
      style={{
        height: '100%',
        width: '100%'
      }}
    >
      <Textarea
        style={{
          overflow: 'auto',
          height: '100%',
          width: '100%'
        }}
        styles={{
          wrapper: {
            height: '100%'
          },
          input: {
            height: '100%'
          }
        }}
        radius="0"
        value={input}
        onChange={e => setInput(e.currentTarget.value)}
      />
      {
        <div
          style={{
            overflow: 'auto',
            height: '100%',
            width: '100%',
            whiteSpace: 'preserve'
          }}>
          {error}
          {JSON.stringify(parsed, null, 2)}
        </div>
      }
            {
        <div
          style={{
            overflow: 'auto',
            height: '100%',
            width: '100%',
            whiteSpace: 'preserve'
          }}>
          {error}
          {JSON.stringify(shapes, null, 2)}
        </div>
      }
    </Flex>
  </div>
}
