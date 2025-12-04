import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/styles.css'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    entry: 'src/index.ts',
  },
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  loader: {
    '.css': 'copy',
  },
});

