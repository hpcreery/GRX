import { resolve } from "node:path"
import typescript from "@rollup/plugin-typescript"
import react from "@vitejs/plugin-react"
import glslify from "rollup-plugin-glslify"
import { defineConfig, type PluginOption } from "vite"
import arraybuffer from "vite-plugin-arraybuffer"
// import { comlink } from "vite-plugin-comlink"
// import pkg from "./package.json"

export default defineConfig({
  base: "./",
  root: resolve("demo/"),
  cacheDir: ".vite",
  resolve: {
    alias: {
      "@src": resolve("src"),
    },
  },
  plugins: [
    react(),
    // comlink(),
    typescript({
      tsconfig: resolve("tsconfig.json"),
    }),
    arraybuffer(),
    glslify({
      compress: false,
      // @ts-expect-error - glslify options are not typed
      transform: ["glslify-import"],
    }) as PluginOption,
  ],
  worker: {
    format: "es",
    plugins: () => [
      // comlink(),
      // typescript(),
      arraybuffer(),
      glslify({
        compress: false,
        // @ts-expect-error - glslify options are not typed
        transform: ["glslify-import"],
      }) as PluginOption,
    ],
  },
})
