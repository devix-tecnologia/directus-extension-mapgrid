import type { GeoItem, LayoutOptions } from '../../../contract/index';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

/**
 * The layout receives the whole preset field by field, because that is how
 * Directus spreads the `setup` return into the component's props. Extending
 * `LayoutOptions` keeps a single declaration: adding an option means editing
 * the contract.
 */
export interface MapgridLayoutProps extends LayoutOptions {
  items: GeoItem[];
  loading?: boolean;
  collection: string;
  selectedItems: GeoItem[];
  /** Collection permissions, resolved by the layout and passed down to the grid. */
  canEdit?: boolean;
  canDelete?: boolean;
  /** Ordenação atual da consulta, no formato do Directus. */
  sort?: string[];
}

export interface MapgridLayoutEmits {
  'update:selectedItems': [items: GeoItem[]];
  'edit-item': [item: GeoItem];
  'update:sort': [sort: string[]];
  /** As colunas escolhidas no cabecalho da grade, na ordem. */
  'update:fields': [fields: string[]];
}

export type MapgridLayoutModels = Record<string, never>;
