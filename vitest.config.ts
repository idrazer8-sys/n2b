import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 20000,
    // DB-backed tests (rate limiting, reservation conflicts) hit the real
    // dev database sequentially — the atomic-counter/upsert logic they
    // exercise is exactly the kind of thing that gives false negatives
    // under parallel test workers stepping on each other's rows.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
});
