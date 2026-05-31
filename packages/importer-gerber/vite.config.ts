/// <reference types="vitest/config" />

import { resolve } from "node:path"
import typescript from "@rollup/plugin-typescript"
import { defineConfig } from "vite"
import pkg from "./package.json"

export default defineConfig({
  base: "./",
  cacheDir: ".vite",
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "./temp/**"],
  },
  build: {
    target: "esnext",
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: pkg.name,
      formats: ["es"],
    },
    rollupOptions: {
      input: "./src/index.ts",
      // Make sure to externalize deps that shouldn't be bundled
      external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg?.peerDependencies || {})],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: ({ name: fileName }) => {
          return `${fileName}.js`
        },
      },
    },
  },
  plugins: [
    typescript({
      tsconfig: resolve("tsconfig.json"),
    }),
  ],
})
