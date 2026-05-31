// import { Flex, Textarea } from "@mantine/core"
// import type { Shape } from "@src/data/shape/shape"
// import type { CstNode } from "chevrotain"
// import React, { type JSX } from "react"
// import { NCLexer, NCToShapesVisitor, parser } from "./parser/parser"

// const drill = `T01`

// export default function NCDemo(): JSX.Element {
//   const [input, setInput] = React.useState<string>(drill)
//   const [parsed, setParsed] = React.useState<CstNode>({ name: "", children: {} })
//   const [shapes, setShapes] = React.useState<Shape[]>([])
//   const [error, setError] = React.useState<string | undefined>(undefined)

//   React.useEffect(() => {
//     try {
//       console.time("parse")
//       const lexingResult = NCLexer.tokenize(input)
//       parser.input = lexingResult.tokens
//       const result = parser.program()
//       setParsed(result)
//       console.timeEnd("parse")
//       const visitor = new NCToShapesVisitor()
//       visitor.visit(result)
//       console.log("result", visitor.result)
//       setShapes(visitor.result)
//       console.log(lexingResult)
//       if (lexingResult.errors.length > 0) {
//         console.error("LEXER ERRORS", lexingResult.errors)
//       }
//       console.log(result)
//       if (parser.errors.length > 0) {
//         parser.errors.forEach((e) => console.error("PARSER ERROR: ", e.message))
//         setError(`${parser.errors.map((e, i) => `[ PARSER ERROR ${i + 1}:${e.message} ]`).join("\n")}\n`)
//       } else {
//         setError(undefined)
//       }
//     } catch (err) {
//       setParsed({ name: "", children: {} })
//       setError(String(err))
//     }
//   }, [input])

//   return (
//     <div
//       style={{
//         height: "100vh",
//         overflow: "hidden",
//       }}
//     >
//       <Flex
//         justify="center"
//         align="flex-start"
//         style={{
//           height: "100%",
//           width: "100%",
//         }}
//       >
//         <Textarea
//           style={{
//             overflow: "auto",
//             height: "100%",
//             width: "100%",
//           }}
//           styles={{
//             wrapper: {
//               height: "100%",
//             },
//             input: {
//               height: "100%",
//             },
//           }}
//           radius="0"
//           value={input}
//           onChange={(e) => setInput(e.currentTarget.value)}
//         />
//         {
//           <div
//             style={{
//               overflow: "auto",
//               height: "100%",
//               width: "100%",
//               whiteSpace: "preserve",
//             }}
//           >
//             {error}
//             {JSON.stringify(parsed, null, 2)}
//           </div>
//         }
//         {
//           <div
//             style={{
//               overflow: "auto",
//               height: "100%",
//               width: "100%",
//               whiteSpace: "preserve",
//             }}
//           >
//             {JSON.stringify(shapes, null, 2)}
//           </div>
//         }
//       </Flex>
//     </div>
//   )
// }
