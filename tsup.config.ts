import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    define: { __VERSION__: JSON.stringify(pkg.version) },
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
  },
]);
