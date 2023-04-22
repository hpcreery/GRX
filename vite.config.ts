import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { comlink } from 'vite-plugin-comlink'

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  root: resolve('src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '/src': resolve('src/renderer/src')
    }
  },
  build: {
    outDir: resolve('out/dist-web')
  },
  plugins: [react(), comlink()],
  worker: {
    format: 'es',
    plugins: [comlink()]
  }
})
