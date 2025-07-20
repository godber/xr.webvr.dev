import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/benchmarks/nodejs.bench.test.ts'],
    // Skip browser setup file that causes issues in Node.js
    setupFiles: [],
  },
});