import React from 'react'
// import { parse } from './parser'
import { CodeHighlight } from '@mantine/code-highlight';
import { Flex, Textarea } from '@mantine/core'
import { ChildNode } from './parser/tree'
// import { plot } from './plotter';
import { Shape } from '@src/renderer/shapes';
// import { parser, reset } from './earley-parser/parser'
import { parser, SelectLexer } from './chevrotain-parser/parser'

const drill = `T01`

// const tree = parse(drill)
// const shapes = plot(tree)
// const new_tree = p("T01")

export default function NCDemo(): JSX.Element {
  const [highlightedLines, setHighlightedLines] = React.useState<number[]>([])
  const [input, setInput] = React.useState<string>(drill)
  const [parsed, setParsed] = React.useState<any>({})
  const [error, setError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    try {
      // reset()
      console.time('parse')
      const lexingResult = SelectLexer.tokenize(input);
      console.log(lexingResult)
      if (lexingResult.errors.length > 0) {
        console.error('LEXER ERRORS', lexingResult.errors)
      }
      parser.input = lexingResult.tokens;
      const result = parser.program();
      console.log(result)

      if (parser.errors.length > 0) {
        // throw new Error("sad sad panda, Parsing errors detected");
        // console.log('ERRORS', parser.errors.map(e => e.message))
        parser.errors.forEach(e => console.error('PARSER ERROR: ', e.message))
      }
      setParsed(result)
      // parser.feed(input)
      // input.split(/\r?\n/).forEach(chunk => {
      //   console.log(chunk)
      //   parser.feed(chunk)
      // })
      // newTree.push()
      // console.log(JSON.stringify(parser.results, null, 1))
      console.timeEnd('parse')
      // setParsed(parser.)
      // if (parser.results.length === 0) {
      //   console.log('NO RESULTS')
      //   setParsed([])
      // } else if (parser.results.length === 1) {
      //   console.log('NO AMBIGUITY, PERFECTLY OPTIMIZED')
      //   setParsed(parser.results[0])
      // } else if (parser.results.length > 1) {
      //   console.log('AMBIGUITY DETECTED', parser.results.length, 'RESULTS')
      //   setParsed(parser.results[0])
      // }
      // setParsed(newTree.results)
      setError(undefined)
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
      {/* <div
        style={{
          overflow: 'auto',
          height: '100%',
          width: '100%'
        }}>
        {drill.split(/\r?\n/).map((line, i) => <RawLine
          highlightedLines={highlightedLines}
          setHighlightedLines={setHighlightedLines}
          key={i}
          line={line}
          i={i+1} />)}
      </div> */}
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
      // label="Input NC"
      // description="Input description"
      // placeholder="Input placeholder"
      />
      {error ?
        <CodeHighlight
          styles={{
            pre: {
              paddingTop: 0,
              paddingBottom: 0
            }
          }}
          style={{
            backgroundColor: 'rgb(60,30,30)',
            overflow: 'auto',
            height: '100%',
            width: '100%'
          }}
          withCopyButton={false}
          code={error}
        // language="json"
        />

        :
        // <div
        //   style={{
        //     overflow: 'auto',
        //     height: '100%',
        //     width: '100%'
        //   }}>
        //   {parsed.map((child, i) => {
        //     return <ParsedLine
        //       highlightedLines={highlightedLines}
        //       setHighlightedLines={setHighlightedLines}
        //       key={i}
        //       child={child} />
        //   })}
        // </div>
        <div
          style={{
            overflow: 'auto',
            height: '100%',
            width: '100%',
            whiteSpace: 'preserve'
          }}>
          {/* {parsed.map((child, i) => {
            return <CodeHighlight
              code={JSON.stringify(child, null, 2)}
              withCopyButton={false}
              key={i}
            />
          })} */}
          {JSON.stringify(parsed, null, 2)}
        </div>
      }
      {/* <div
        style={{
          overflow: 'auto',
          height: '100%',
          width: '100%'
        }}>
        {tree.children.map((child, i) => {
          return <ParsedLine
            highlightedLines={highlightedLines}
            setHighlightedLines={setHighlightedLines}
            key={i}
            child={child} />
        })}
      </div>
      <div
        style={{
          overflow: 'auto',
          height: '100%',
          width: '100%'
        }}>
        {shapes.children.map((shape, i) => {
          return <ShapeLine
            highlightedLines={highlightedLines}
            setHighlightedLines={setHighlightedLines}
            key={i}
            shape={shape} />
        })}
      </div> */}
    </Flex>
  </div>
}

const useHighlight = <E extends HTMLDivElement>(highlight?: boolean): React.Ref<E> => {
  const element = React.useRef<E>(null)

  React.useEffect(() => {
    if (highlight === true) {
      element.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [highlight])

  return element
}


interface RawLineProps {
  i: number
  line: string
  highlightedLines: number[]
  setHighlightedLines: (lines: number[]) => unknown
}

function RawLine(props: RawLineProps): JSX.Element {
  const { i, line, highlightedLines, setHighlightedLines, } = props
  const highlight =
    i >= Math.min(...highlightedLines) &&
    i <= Math.max(...highlightedLines)
  const targetRef = useHighlight(highlight)

  return <CodeHighlight
    styles={{
      pre: {
        paddingTop: 0,
        paddingBottom: 0
      }
    }}
    style={{
      backgroundColor: highlight ? 'rgb(30,30,30)' : ''
    }}
    ref={targetRef}
    withCopyButton={false}
    code={line}
    onMouseEnter={() => setHighlightedLines([i])}
    onMouseLeave={() => setHighlightedLines([])}
  >
  </CodeHighlight>
}

interface ParsedLineProps {
  child: ChildNode
  highlightedLines: number[]
  setHighlightedLines: (lines: number[]) => unknown
}

function ParsedLine(props: ParsedLineProps): JSX.Element {
  const {
    child,
    highlightedLines,
    setHighlightedLines,
  } = props
  const { position, ...obj } = child
  const startLine = position?.start.line
  const endLine = position?.end.line
  const highlight = highlightedLines.some(
    highlightedLine =>
      startLine !== undefined &&
      endLine !== undefined &&
      startLine <= highlightedLine &&
      endLine >= highlightedLine
  )
  const lines = [startLine, endLine].filter((n): n is number => n !== undefined)
  const targetRef = useHighlight(highlight)

  return <CodeHighlight
    styles={{
      pre: {
        paddingTop: 0,
        paddingBottom: 0
      }
    }}
    style={{
      backgroundColor: highlight ? 'rgb(30,30,30)' : ''
    }}
    withCopyButton={false}
    onMouseEnter={() => setHighlightedLines(lines)}
    onMouseLeave={() => setHighlightedLines([])}
    ref={targetRef}
    code={JSON.stringify(obj, null, 2)}
    language="json"
  />
}


interface ShapeLineProps {
  shape: Shape
  highlightedLines: number[]
  setHighlightedLines: (lines: number[]) => unknown
}

function ShapeLine(props: ShapeLineProps): JSX.Element {
  const {
    shape,
    // highlightedLines,
    // setHighlightedLines,
  } = props
  // const { position, ...obj } = shape
  // const startLine = position?.start.line
  // const endLine = position?.end.line
  // const highlight = highlightedLines.some(
  //   highlightedLine =>
  //     startLine !== undefined &&
  //     endLine !== undefined &&
  //     startLine <= highlightedLine &&
  //     endLine >= highlightedLine
  // )
  // const lines = [startLine, endLine].filter((n): n is number => n !== undefined)
  // const targetRef = useHighlight(highlight)

  return <CodeHighlight
    styles={{
      pre: {
        paddingTop: 0,
        paddingBottom: 0
      }
    }}
    style={{
      // backgroundColor: highlight ? 'rgb(30,30,30)' : ''
    }}
    withCopyButton={false}
    // onMouseEnter={() => setHighlightedLines(lines)}
    // onMouseLeave={() => setHighlightedLines([])}
    // ref={targetRef}
    code={JSON.stringify(shape, null, 2)}
    language="json"
  />
}
