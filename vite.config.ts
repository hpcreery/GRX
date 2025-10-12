import { resolve } from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { comlink } from "vite-plugin-comlink"
import glslify from "rollup-plugin-glslify"
import arraybuffer from "vite-plugin-arraybuffer"
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'

// function crossOriginIsolationMiddleware(_, response, next) {
//   response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
//   response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
//   response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//   next();
// }

// const crossOriginIsolation = {
//   name: 'cross-origin-isolation',
//   configureServer: server => { server.middlewares.use(crossOriginIsolationMiddleware); },
//   configurePreviewServer: server => { server.middlewares.use(crossOriginIsolationMiddleware); },
// };

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  root: resolve("src/renderer"),
  resolve: {
    alias: {
      "@src": resolve("src/renderer/src"),
      "@lib": resolve("src/renderer/lib"),
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },
  build: {
    outDir: resolve("out/web"),
    lib: {
      entry: resolve(__dirname, 'src/renderer/src/renderer/index.ts'),
      name: 'GRX',
      // the proper extensions will be added
      fileName: 'grx',
    },
  },
  server: {
    headers: {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
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
    // crossOriginIsolation
    crossOriginIsolation()
    // {
    //   name: "configure-response-headers",
    //   configureServer: (server) => {
    //     server.middlewares.use((_req, res, next) => {
    //       res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    //       // res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    //       res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    //       next();
    //     });
    //   },
    // },
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
      // crossOriginIsolation
      crossOriginIsolation()
      // {
      //   name: "configure-response-headers",
      //   configureServer: (server) => {
      //     server.middlewares.use((_req, res, next) => {
      //       res.setHeader("Cross-Origin-Resource-Policy", "same-site");
      //       // res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      //       // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      //       next();
      //     });
      //   },
      // },
    ],
  },
})
