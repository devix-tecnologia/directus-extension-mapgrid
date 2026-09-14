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
    options: {},
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
