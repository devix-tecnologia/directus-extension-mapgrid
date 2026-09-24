import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const nesteProjeto = (caminho: string) => fileURLToPath(new URL(caminho, import.meta.url));

/** Testes que rodam com o Vue do app do Directus que o e2e usa, e não com o nosso. */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: 'vue-do-directus' },
      /*
       * O `exports` do @vue/test-utils tem condição `node`, e o vitest roda em
       * node: sem este apontamento o `mount` vem do pacote CommonJS, cujo
       * `require('vue')` o alias acima não alcança — ele montava com o Vue
       * 3.5.22 do projeto enquanto o teste criava o estado com o 3.4.27. Duas
       * reatividades, nenhuma ligação entre elas: nada re-renderizava, e todo
       * teste de componente daqui reprovava sem defeito nenhum. A guarda está
       * em MapgridLayout.vue-do-directus.test.ts.
       */
      {
        find: /^@vue\/test-utils$/,
        replacement: nesteProjeto(
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
