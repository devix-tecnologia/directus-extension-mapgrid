import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/** Testes que rodam com o Vue do app do Directus que o e2e usa, e não com o nosso. */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^vue$/, replacement: 'vue-do-directus' }],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.vue-do-directus.test.ts'],
    server: { deps: { inline: ['@vue/test-utils', 'vue-i18n'] } },
    setupFiles: ['src/test-setup.ts'],
  },
});
