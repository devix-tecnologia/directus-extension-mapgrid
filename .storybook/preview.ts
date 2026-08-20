import type { Preview } from '@storybook/vue3-vite';
import { setup } from '@storybook/vue3-vite';
import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { createMemoryHistory, createRouter } from 'vue-router';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  createMockApi,
  createMockStores,
  registerDirectusMockComponents,
} from '../src/mocks/directus-mocks';

setup((app) => {
  registerDirectusMockComponents(app);

  app.provide(API_INJECT, createMockApi());
  app.provide(STORES_INJECT, createMockStores());

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [],
  });
  app.use(router);
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
  },
};

export default preview;
