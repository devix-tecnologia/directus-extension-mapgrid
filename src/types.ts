import type { Filter } from '@directus/types';

export type { LayoutOptions } from './contract/index';

export interface LayoutQuery {
  /** The columns shown in the grid, in the same place the tabular layout uses. */
  fields?: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
