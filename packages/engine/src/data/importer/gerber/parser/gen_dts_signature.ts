/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { generateCstDts } from "chevrotain"
import { productions } from "./parser.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const dtsString = generateCstDts(productions)
const dtsPath = resolve(__dirname, "gerbercst.d.ts")
writeFileSync(dtsPath, dtsString)
