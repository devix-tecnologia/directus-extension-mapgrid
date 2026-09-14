import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { tooltipDirective } from './mocks/directus-mocks';
import { MESSAGES } from './shared/messages';

/**
 * O app do Directus instala o vue-i18n; aqui ele é instalado à mão, senão o
 * `useI18n({ useScope: 'local' })` dos componentes lança por não achar a
 * instância global.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: MESSAGES,
});

config.global.plugins = [i18n];
config.global.directives = { tooltip: tooltipDirective };
