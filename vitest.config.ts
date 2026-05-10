import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'e2e', '.next'],
    globals: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
