import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['scripts/test-collection.seed.spec.ts'],
    testTimeout: 300000,
    hookTimeout: 300000,
  },
});
