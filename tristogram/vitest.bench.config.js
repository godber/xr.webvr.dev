import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    workerTimeout: 120000, // 2 minutes for worker communication
    include: ['**/benchmarks/*.bench.test.ts'], // Only include benchmark tests
  },
});