import { resolve } from "node:path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import { comlink } from "vite-plugin-comlink"
import arraybuffer from "vite-plugin-arraybuffer"
import glslify from "rollup-plugin-glslify"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@src": resolve("src/renderer/src"),
        "@lib": resolve("src/renderer/lib"),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
      react(),
      comlink(),
      arraybuffer(),
      glslify({
        compress: false,
        // @ts-ignore - glslify options are not typed
        transform: ["glslify-import"],
      }),
    ],
    worker: {
      format: "es",
      plugins: () => [
        comlink(),
        arraybuffer(),
        glslify({
          compress: false,
          // @ts-ignore - glslify options are not typed
          transform: ["glslify-import"],
        }),
      ],
    },
  },
})
