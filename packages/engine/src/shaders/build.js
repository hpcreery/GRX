// this script is responsible for building the shaders found in ./src and outputting them to ./build

import { promises as fs } from "node:fs"
import { join } from "node:path"
import glsl from "glslify"

const __dirname = new URL(".", import.meta.url).pathname
const buildPath = join(__dirname, "build")
const srcPath = join(__dirname, "src")

console.log("Building shaders...")

export async function main() {
  // if srcPath doesn't exist, exit
  try {
    await fs.stat(srcPath)
  } catch (_e) {
    console.error(`Source path ${srcPath} does not exist`)
    process.exit(1)
  }

  const files = await fs.readdir(srcPath, { withFileTypes: true })

  // check if buildpath exists, if not, create it
  try {
    await fs.stat(buildPath)
  } catch (_e) {
    await fs.mkdir(buildPath)
  }

  for (const file of files) {
    if (file.isDirectory()) continue

    const filePath = join(srcPath, file.name)
    const fileContents = await fs.readFile(filePath, "utf-8")
    try {
      const output = glsl(fileContents, {
        basedir: srcPath,
        transform: ["glslify-import"],
        // transform: ["glslify-fancy-imports"],
      })
      const outputFile = join(buildPath, file.name)
      await fs.writeFile(outputFile, output)
      console.log(`Built ${file.name}`)
    } catch (e) {
      console.error(`Failed to build ${file.name}`)
      console.error(e)
    }
  }
}

main()
