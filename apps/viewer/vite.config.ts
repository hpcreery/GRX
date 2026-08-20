import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import packageJson from "../../package.json" with { type: "json" }

export default defineConfig({
  base: "./",
  define: {
    // __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@src": resolve("src"),
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  build: {
    outDir: resolve("dist/"),
  },
  plugins: [react()],
  worker: {
    format: "es",
    plugins: () => [],
  },
})
