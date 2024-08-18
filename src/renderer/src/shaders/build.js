// this script is responsible for building the shaders found in ./src and outputting them to ./build

import { promises as fs } from "fs"
import { join } from "path"
import glsl from "glslify"

const __dirname = new URL(".", import.meta.url).pathname
const buildPath = join(__dirname, "build")
const srcPath = join(__dirname, "src")

console.log("Building shaders...")

export async function main() {
  // if srcPath doesn't exist, exit
  try {
    await fs.stat(srcPath)
  } catch (e) {
    console.error(`Source path ${srcPath} does not exist`)
    process.exit(1)
  }

  const files = await fs.readdir(srcPath)

  // check if buildpath exists, if not, create it
  try {
    await fs.stat(buildPath)
  } catch (e) {
    await fs.mkdir(buildPath)
  }

  for (const file of files) {
    const filePath = join(srcPath, file)
    const fileContents = await fs.readFile(filePath, "utf-8")
    try {
      const output = glsl(fileContents, {
        basedir: srcPath,
        transform: ["glslify-import"],
        // transform: ["glslify-fancy-imports"],
      })
      const outputFile = join(buildPath, file)
      await fs.writeFile(outputFile, output)
      console.log(`Built ${file}`)
    } catch (e) {
      console.error(`Failed to build ${file}`)
      console.error(e)
    }
  }
}

main()
