import React from 'react'
import { parse } from './parser'
import { CodeHighlight } from '@mantine/code-highlight';
import { Flex } from '@mantine/core'
import { ChildNode } from './parser/tree'
import { plot } from './plotter';
import { Shape } from '@src/renderer/shapes';

const drill = `\
M48
INCH,TZ
T01C0.25I01H11F123Z23B-0.2
%
G90
T01
G00X0Y0
G02X2500Y2500A2500
G03X5000Y5000A2500
G00X7500Y0
G02X10000Y2500I2500J0
G03X12500Y5000I0J2500
M30
`

const tree = parse(drill)
const shapes = plot(tree)

export default function NCDemo(): JSX.Element {
  const [highlightedLines, setHighlightedLines] = React.useState<number[]>([])

  // React.useEffect(() => {
  //   console.log(highlightedLines)
  // }, [highlightedLines])


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
      <div
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
      </div>
      <div
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
      </div>
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
