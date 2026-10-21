import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    hookTimeout: 300000,
    include: ['tests/**/*.spec.ts'],
    // e2e, screenshot and stories run under Playwright, not here
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/screenshot/**', '**/stories/**'],
    pool: 'threads',
    isolate: false,
    maxWorkers: 3,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.spec.ts', '**/*.test.ts'],
    },
  },
});
