import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/zod.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
});
