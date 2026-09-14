import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    // Os módulos de lógica pura (contract, services, shared) rodam em node; os
    // testes de componente pedem o DOM com um docblock `// @vitest-environment
    // happy-dom`, para só eles pagarem o custo de montar um documento.
    environment: 'node',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/*.mock.ts', 'src/**/index.ts'],
    },
  },
});
