import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/**/*.ts',
  dts: true,
  outDir: 'dist',
  exports: {
    all: true,
  }
})