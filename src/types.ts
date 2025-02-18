import { Filter } from '@directus/types';

export interface LayoutOptions {
  widthMap?: { [key: string]: number };
  heightMap?: { [key: string]: number };
  limit?: number;
  spacing?: number;
  showSelect?: boolean;
  showDrag?: boolean;
  coordinates?: string;
  fields?: string[];
  title?: string;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
}

export interface LayoutQuery {
  fields: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
