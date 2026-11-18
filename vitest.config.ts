import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/stores/**', 'src/activities/**', 'src/data/loaders/**'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      src: resolve(__dirname, './src'),
    },
  },
});
