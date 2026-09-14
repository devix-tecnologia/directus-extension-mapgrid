import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';

const currentDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|vue)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      /*
       * The default engine, `vue-docgen-api`, is deprecated and goes away in
       * Storybook 11. It also resolves imports on its own and does not
       * understand TypeScript's convention where the specifier ends in `.js`
       * and the file on disk is `.ts` — hence it looking for
       * `contract/index.js.js` and giving up on the props of whoever imports
       * that way. `vue-component-meta` uses TypeScript's own language service,
       * so it resolves the way the compiler does.
       */
      docgen: 'vue-component-meta',
    },
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(currentDir, '../src'),
      '@directus/extensions-sdk': resolve(currentDir, 'mocks/directus-extensions-sdk.ts'),
      'vue-router': resolve(currentDir, 'mocks/vue-router.ts'),
      /*
       * The development build of vue-i18n calls `enableDevTools` on install,
       * with no flag to turn it off: the condition compiles to `if (true)`.
       * Storybook creates one app per story, every install registers the
       * bridge again, and the Vue Devtools extension breaks on its own with
       * "Cannot read properties of undefined (reading 'app')" — one unhandled
       * rejection per story, for anyone with the extension installed, which is
       * most Vue developers.
       *
       * The production build does not have that path compiled in. It costs
       * vue-i18n's own development warnings, which are no loss here: key
       * parity between the locales is guaranteed by a test.
       */
      'vue-i18n': resolve(currentDir, '../node_modules/vue-i18n/dist/vue-i18n.esm-browser.prod.js'),
    };
    /*
     * Each story is a separate, throwaway app, so no devtools bridge is of any
     * use here. `__INTLIFY_PROD_DEVTOOLS__` is what vue-i18n's production build
     * reads to decide whether to register the bridge; the alias above is what
     * handles the development case.
     */
    config.define = {
      ...config.define,
      __VUE_PROD_DEVTOOLS__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
    };

    config.plugins = config.plugins || [];
    const hasVuePlugin = config.plugins.some(
      (plugin) =>
        plugin !== null &&
        typeof plugin === 'object' &&
        'name' in plugin &&
        plugin.name === 'vite:vue'
    );
    if (!hasVuePlugin) {
      config.plugins.push(vue());
    }
    return config;
  },
};

export default config;
