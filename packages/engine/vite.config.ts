import { resolve } from "node:path"
import glslify from "rollup-plugin-glslify"
import dts from "unplugin-dts/vite"
import { defineConfig, type PluginOption } from "vite"
import arraybuffer from "vite-plugin-arraybuffer"
// import { comlink } from "vite-plugin-comlink"
import pkg from "./package.json" with { type: "json" }
// import { analyzer } from "vite-bundle-analyzer"

export default defineConfig({
  base: "./",
  cacheDir: ".vite",
  build: {
    target: "esnext",
    emptyOutDir: true,
    // minify: "esbuild",
    // sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: pkg.name,
      formats: ["es"],
    },
    rolldownOptions: {
      input: "./src/index.ts",
      // Make sure to externalize deps that shouldn't be bundled
      external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
      output: {
        sourcemap: true,
        minify: true,
        preserveModules: false,
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
    dts({
      // insertTypesEntry: true,
      tsconfigPath: "tsconfig.json",
    }) as PluginOption,
    arraybuffer() as PluginOption,
    glslify({
      compress: false,
      // @ts-expect-error - glslify options are not typed
      transform: ["glslify-import"],
    }),
    // analyzer(),
  ],
  worker: {
    format: "es",
    rolldownOptions: {
      external: [],
    },
    plugins: () => [
      // comlink(),
      arraybuffer() as PluginOption,
      glslify({
        compress: false,
        // @ts-expect-error - glslify options are not typed
        transform: ["glslify-import"],
      }) as PluginOption,
      // analyzer(),
    ],
  },
})
