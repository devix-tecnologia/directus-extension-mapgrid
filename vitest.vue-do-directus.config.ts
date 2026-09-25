import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const inThisProject = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Tests that run with the Directus app's Vue the e2e uses, and not with ours. */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: 'vue-do-directus' },
      /*
       * @vue/test-utils' `exports` has a `node` condition, and vitest runs in
       * node: without this the CommonJS build's `require('vue')` escapes the
       * alias above and `mount` uses a second Vue. The guard is in
       * MapgridLayout.vue-do-directus.test.ts.
       */
      {
        find: /^@vue\/test-utils$/,
        replacement: inThisProject(
          './node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs'
        ),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.vue-do-directus.test.ts'],
    server: { deps: { inline: ['@vue/test-utils', 'vue-i18n'] } },
    setupFiles: ['src/test-setup.ts'],
  },
});
