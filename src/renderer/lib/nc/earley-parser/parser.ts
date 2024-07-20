import nearley from 'nearley'
import grammar from './grammar'

export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
const cleanSlate = parser.save()

export function parse(chunk: string): nearley.Parser {
  try {
    parser.feed(chunk);
    console.log(JSON.stringify(parser.results, null, 2 )); // [[[[["foo"],"\n"]]]]
  } catch (parseError) {
    console.error(parseError)
  }
  return parser
}

export function reset(): void {
  parser.restore(cleanSlate)
}
