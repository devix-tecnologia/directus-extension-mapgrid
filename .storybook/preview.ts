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
 * At module scope so the decorator can switch the locale. The components use
 * `useI18n({ useScope: 'local' })`, which inherits from here — so the toolbar
 * really exercises pt-BR, rather than a separate wiring only the story sees.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: MESSAGES,
});

/**
 * Everything the Directus app hands an extension, provided here instead. The
 * api and the stores go under the app's own injection keys
 * (`API_INJECT`/`STORES_INJECT`), which is what `useApi()` and `useStores()`
 * read — rather than strings repeated here, which would drift silently if
 * Directus ever renamed them.
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
      description: 'Directus app language',
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
     * By title, so the numeric prefix on each Atomic Design level does what it
     * is there for: atoms before molecules before organisms. Without this the
     * sidebar follows whatever order the files happened to load in.
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
