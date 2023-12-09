import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { comlink } from 'vite-plugin-comlink'
// import glsl from 'vite-plugin-glsl'
import glslify from 'rollup-plugin-glslify'

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
    outDir: resolve('out/web')
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
})
