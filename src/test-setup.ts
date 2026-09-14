import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { tooltipDirective } from './mocks/directus-mocks';
import { MESSAGES } from './shared/messages';

/**
 * The Directus app installs vue-i18n; here it is installed by hand, otherwise
 * the components' `useI18n({ useScope: 'local' })` throws for lack of a global
 * instance.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: MESSAGES,
});

config.global.plugins = [i18n];
config.global.directives = { tooltip: tooltipDirective };
