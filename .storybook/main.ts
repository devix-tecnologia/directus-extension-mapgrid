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
      /*
       * O build de desenvolvimento do vue-i18n chama `enableDevTools` no
       * install, sem flag que desligue: a condição compila para `if (true)`.
       * O Storybook cria um app por story, cada install registra a ponte de
       * novo, e a extensão Vue Devtools quebra sozinha com "Cannot read
       * properties of undefined (reading 'app')" — uma rejeição não tratada
       * por story, para quem tem a extensão instalada, que é quase todo
       * desenvolvedor Vue.
       *
       * O build de produção não tem esse caminho compilado. Custa os avisos de
       * desenvolvimento do próprio vue-i18n, que aqui não fazem falta: a
       * paridade de chaves entre os idiomas é garantida por teste.
       */
      'vue-i18n': resolve(currentDir, '../node_modules/vue-i18n/dist/vue-i18n.esm-browser.prod.js'),
    };
    /*
     * Cada story é um app separado e efêmero, então nenhuma ponte de devtools
     * tem utilidade aqui. `__INTLIFY_PROD_DEVTOOLS__` é o que o build de
     * produção do vue-i18n lê para decidir se registra a ponte; o alias acima
     * é o que resolve o caso de desenvolvimento.
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
