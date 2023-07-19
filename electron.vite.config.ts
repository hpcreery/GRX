import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { comlink } from 'vite-plugin-comlink'
import glsl from 'vite-plugin-glsl'

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
        '@renderer': resolve('src/renderer/src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    plugins: [react(), comlink(), glsl()],
    worker: {
      format: 'es',
      plugins: [comlink(), glsl()]
    }
  }
})
