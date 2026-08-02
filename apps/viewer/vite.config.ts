import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { comlink } from "vite-plugin-comlink"
import deno from "@deno/vite-plugin"

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION),
  },
  resolve: {
    alias: {
      // "@grx/viewer": resolve("src"),
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  build: {
    outDir: resolve("dist/"),
  },
  plugins: [deno(), react(), comlink() ],
  worker: {
    format: "es",
    plugins: () => [deno(), comlink()],
  },
})
