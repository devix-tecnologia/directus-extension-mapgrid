import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    // The pure-logic modules (contract, services, shared) run in node; the
    // component tests ask for the DOM with a `// @vitest-environment happy-dom`
    // docblock, so only they pay the cost of building a document.
    environment: 'node',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/*.mock.ts', 'src/**/index.ts'],
    },
  },
});
