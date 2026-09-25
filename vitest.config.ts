import vue from '@vitejs/plugin-vue';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    // The pure-logic modules (contract, services, shared) run in node; the
    // component tests ask for the DOM with a `// @vitest-environment happy-dom`
    // docblock, so only they pay the cost of building a document.
    environment: 'node',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    exclude: [...configDefaults.exclude, 'src/**/*.vue-do-directus.test.ts'],
    include: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'scripts/**/*.test.ts',
      // One level on purpose: '.sandcastle/**' would descend into
      // '.sandcastle/worktrees/<round>/' and collect the whole repository
      // again — the suite would run over a copy of itself, with twice the
      // tests and no warning that it happened.
      '.sandcastle/task-queue/*.test.ts',
      '.sandcastle/credential/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/*.mock.ts', 'src/**/index.ts'],
    },
  },
});
