import { config } from '@vue/test-utils';
import { tooltipDirective } from './mocks/directus-mocks.js';

config.global.directives = { tooltip: tooltipDirective };
