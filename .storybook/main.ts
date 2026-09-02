import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|vue)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src'),
      '@directus/extensions-sdk': resolve(__dirname, 'mocks/directus-extensions-sdk.ts'),
      'vue-router': resolve(__dirname, 'mocks/vue-router.ts'),
    };
    config.plugins = config.plugins || [];
    const hasVuePlugin = config.plugins.some(
      (p: any) =>
        (typeof p === 'object' && p?.name === 'vite:vue') ||
        (typeof p === 'function' && p?.name === 'vite:vue')
    );
    if (!hasVuePlugin) {
      config.plugins.push(vue());
    }
    return config;
  },
};

export default config;
