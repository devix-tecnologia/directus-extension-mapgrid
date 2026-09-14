import type { Filter } from '@directus/types';

export type { LayoutOptions } from './contract/index.js';

export interface LayoutQuery {
  fields: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
