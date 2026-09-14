import type { GeoItem, LayoutOptions } from '../../../contract/index.js';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

/**
 * O layout recebe o preset inteiro campo a campo, porque é assim que o Directus
 * espalha o retorno do `setup` nas props do componente. Herdar de `LayoutOptions`
 * mantém uma declaração só: acrescentar uma opção é editar o contrato.
 */
export interface MapgridLayoutProps extends LayoutOptions {
  items: GeoItem[];
  loading?: boolean;
  collection: string;
  selectedItems: GeoItem[];
  /** Permissões da coleção, resolvidas pelo layout e repassadas à grade. */
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface MapgridLayoutEmits {
  'update:selectedItems': [items: GeoItem[]];
  'edit-item': [item: GeoItem];
}

export type MapgridLayoutModels = Record<string, never>;
