// call ./build.js file method main when any file in ./src and ./modules changes

import { join } from "path"
import chokidar from "chokidar"
import { main } from "./build.js"

const __dirname = new URL(".", import.meta.url).pathname
const modulePath = join(__dirname, "modules")
const srcPath = join(__dirname, "src")

chokidar.watch([srcPath, modulePath]).on("all", async (eventType, filename) => {
  console.log(eventType, filename)
  if (filename) {
    console.log(`event type is: ${eventType}`)
    if (eventType === "change") {
      console.log(`filename provided: ${filename}`)
      await main()
    }
  } else {
    console.log("filename not provided")
  }
})
