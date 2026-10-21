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

/*
 * From Node 25 on, the runtime has a `localStorage` of its own, a getter that
 * is undefined unless started with `--localstorage-file` — and under happy-dom
 * `window` is the global itself, so it shadows happy-dom's. Where the page has
 * a `Storage` class and no storage, one of happy-dom's is put in its place.
 */
const scope = globalThis as {
  localStorage?: Storage;
  Storage?: new () => Storage;
  document?: unknown;
};
if (scope.document && !scope.localStorage && scope.Storage) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new scope.Storage(),
    writable: true,
  });
}
