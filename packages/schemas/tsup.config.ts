import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./index.ts', './db/schema/index.ts'],
  splitting: true,
  sourcemap: false,
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
})
