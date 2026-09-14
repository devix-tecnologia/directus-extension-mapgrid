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
       * O motor padrão, `vue-docgen-api`, está depreciado e sai no Storybook 11.
       * Ele também resolve imports por conta própria, e não entende a convenção
       * do TypeScript em que o especificador termina em `.js` e o arquivo em
       * disco é `.ts` — daí ele procurar `contract/index.js.js` e desistir das
       * props de quem importa assim. O `vue-component-meta` usa o language
       * service do próprio TypeScript, então resolve igual ao compilador.
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
    };
    /*
     * Desliga as pontes de devtools do Vue e do vue-i18n. O Storybook cria um
     * app por story e cada plugin se registra na extensão Vue Devtools ao ser
     * instalado; a extensão não espera o registro repetido e quebra sozinha
     * com "Cannot read properties of undefined (reading 'app')", uma vez por
     * story, no mesmo console que pedimos para as pessoas lerem. As pontes não
     * servem para nada aqui, já que cada story é um app separado e efêmero.
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
