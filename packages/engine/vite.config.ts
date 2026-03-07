import { resolve } from "node:path"
import typescript from "@rollup/plugin-typescript"
import glslify from "rollup-plugin-glslify"
import { defineConfig, type PluginOption } from "vite"
import arraybuffer from "vite-plugin-arraybuffer"
// import { comlink } from "vite-plugin-comlink"
import pkg from "./package.json"

export default defineConfig({
  base: "./",
  cacheDir: ".vite",
  build: {
    target: "esnext",
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: {
      entry: "./src/index.ts",
      name: pkg.name,
      formats: ["es"],
    },
    rollupOptions: {
      input: "./src/index.ts",
      // Make sure to externalize deps that shouldn't be bundled
      external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: ({ name: fileName }) => {
          return `${fileName}.js`
        },
      },
    },
  },
  resolve: {
    alias: {
      "@src": resolve("src"),
    },
  },
  plugins: [
    // comlink(),
    typescript(),
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
