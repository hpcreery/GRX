import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import packageJson from "../../package.json" with { type: "json" }
import electron from "vite-plugin-electron/simple"

export default defineConfig(({ command, mode }) => {
  return {
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
    plugins: [
      react(),
      mode === "desktop" ? electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: "electron/main/index.ts",
        },
        preload: {
          // Shortcut of `build.rolldownOptions.input` (`build.rollupOptions.input` on Vite < 8)
          input: "electron/preload/index.ts",
        },
        // Optional: Use Node.js API in the Renderer process
        // renderer: {},
      }) : undefined,
    ],
    worker: {
      format: "es",
      plugins: () => [],
    },
  }
})
