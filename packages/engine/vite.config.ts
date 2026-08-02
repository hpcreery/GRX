import { resolve } from "node:path"
import glslify from "rollup-plugin-glslify"
import { defineConfig, type PluginOption } from "vite"
import arraybuffer from "vite-plugin-arraybuffer"
// import { comlink } from "vite-plugin-comlink"
import pkg from "./deno.json" with { type: "json" }
import deno from "@deno/vite-plugin"
import dts from "unplugin-dts/vite"

// https://github.com/denoland/deno/issues/17058
// deno-lint-ignore no-explicit-any
const glslifyPlugin = glslify as any as typeof glslify.default
// deno-lint-ignore no-explicit-any
// const typescriptPlugin = typescript as any as typeof typescript.default;

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
      external: [...Object.keys(pkg.imports || {})],
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
      "@grx/engine": resolve("src"),
    },
  },
  plugins: [
    // comlink(),
    dts({
      tsconfigPath: "tsconfig.json",
    }),
    deno(),
    arraybuffer(),
    glslifyPlugin({
      compress: false,
      // @ts-expect-error - glslify options are not typed
      transform: ["glslify-import"],
    }) as PluginOption,
  ],
  worker: {
    format: "es",
    rollupOptions: {
      // Workers must bundle all deps — they run as blob URLs where bare imports can't resolve
      external: [],
    },
    plugins: () => [
      // comlink(),
      // dts({
      //   tsconfigPath: "tsconfig.json",
      // }),
      deno(),
      arraybuffer(),
      glslifyPlugin({
        compress: false,
        // @ts-expect-error - glslify options are not typed
        transform: ["glslify-import"],
      }) as PluginOption,
    ],
  },
})
