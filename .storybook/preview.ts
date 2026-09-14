import './directus-theme.css';
import { API_INJECT, STORES_INJECT } from '@directus/constants';
import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { createI18n } from 'vue-i18n';
import {
  createMockApi,
  createMockStores,
  registerDirectusMockComponents,
} from '../src/mocks/directus-mocks';
import { fieldsFor, MAPPABLE_KINDS } from '../src/mocks/mappable-mocks';
import { MESSAGES } from '../src/shared/messages';

/**
 * Em escopo de módulo para o decorator poder trocar o locale. Os componentes
 * usam `useI18n({ useScope: 'local' })`, que herda daqui — então a toolbar
 * exercita o pt-BR de verdade, e não uma ligação separada só da story.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: MESSAGES,
});

/**
 * Tudo o que o app do Directus entrega a uma extensão, entregue aqui. A api e as
 * stores vão sob as chaves de injeção do próprio app (`API_INJECT`/`STORES_INJECT`),
 * que é o que `useApi()` e `useStores()` leem — em vez de strings repetidas aqui,
 * que passariam a divergir em silêncio se o Directus as renomeasse.
 */
setup((app) => {
  registerDirectusMockComponents(app);

  app.provide(API_INJECT, createMockApi());
  app.provide(
    STORES_INJECT,
    createMockStores(
      MAPPABLE_KINDS.map((kind) => ({
        collection: kind.id,
        icon: 'map',
        fields: [
          { field: 'id', primaryKey: true },
          ...fieldsFor(kind.id).map((field) => ({
            field: field.field,
            meta: { interface: field.meta?.interface },
          })),
        ],
      }))
    )
  );

  app.use(i18n);
});

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Idioma do app do Directus',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en-US', title: 'English' },
          { value: 'pt-BR', title: 'Português' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'en-US' },
  decorators: [
    (story, context) => {
      i18n.global.locale.value = (context.globals.locale as 'en-US' | 'pt-BR') ?? 'en-US';
      return story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: { toc: true },
    /*
     * Por título, para o prefixo numérico de cada nível do Atomic Design fazer o
     * que existe para fazer: átomos antes de moléculas, antes de organismos.
     * Sem isso a barra lateral segue a ordem em que os arquivos carregaram.
     */
    options: { storySort: { method: 'alphabetical' } },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#1a1a2e' },
      },
    },
  },
};

export default preview;
