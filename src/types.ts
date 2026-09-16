import type { Filter } from '@directus/types';

export type { LayoutOptions } from './contract/index';

export interface LayoutQuery {
  /** As colunas exibidas na grade, no mesmo lugar que o layout tabular usa. */
  fields?: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
