import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { comlink } from 'vite-plugin-comlink'
// import glsl from 'vite-plugin-glsl'
import glslify from 'rollup-plugin-glslify'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '/src': resolve('src/renderer/src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    plugins: [
      react(),
      comlink(),
      glslify({
        compress: false,
        // @ts-ignore - glslify options are not typed
        transform: ['glslify-import']
      })
    ],
    worker: {
      format: 'es',
      plugins: [
        comlink(),
        glslify({
          compress: false,
          // @ts-ignore - glslify options are not typed
          transform: ['glslify-import']
        })
      ]
    }
  }
})
