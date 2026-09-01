import './directus-theme.css';
import type { Preview } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import {
  createMockApi,
  createMockStores,
  registerDirectusMockComponents,
} from '../src/mocks/directus-mocks.js';

setup((app) => {
  registerDirectusMockComponents(app);
  app.provide('api', createMockApi());
  app.provide('stores', createMockStores());
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
};

export default preview;
