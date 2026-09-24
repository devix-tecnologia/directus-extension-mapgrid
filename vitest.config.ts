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
      // Um nível de propósito: '.sandcastle/**' desceria em
      // '.sandcastle/worktrees/<rodada>/' e coletaria o repositório inteiro de
      // novo — a suíte rodaria sobre uma cópia sua, com o dobro dos testes e
      // nenhum aviso de que isso aconteceu.
      '.sandcastle/fila-de-tarefas/*.test.ts',
      '.sandcastle/credencial/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/*.mock.ts', 'src/**/index.ts'],
    },
  },
});
