import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['scripts/demo.seed.spec.ts'],
    testTimeout: 600000,
    hookTimeout: 600000,
  },
});
