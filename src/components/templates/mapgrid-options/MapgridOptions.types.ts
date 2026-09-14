import type { Field } from '@directus/types';
import type { LayoutOptions } from '../../../contract/index';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

/**
 * O painel de opções só lê dos campos da coleção o nome, a chave e a interface —
 * o suficiente para montar os selects. Declarar esse recorte com `Pick` em vez de
 * redesenhar um objeto mantém o alinhamento com o `Field` do Directus.
 */
export type CollectionFieldSummary = Pick<Field, 'name' | 'field'> & {
  meta?: Pick<NonNullable<Field['meta']>, 'interface'> | null;
};

export interface MapgridOptionsProps extends LayoutOptions {
  collection: string;
  fieldsInCollection: CollectionFieldSummary[];
}

export interface MapgridOptionsEmits {
  'update:geolocation': [value: string | null];
  'update:title': [value: string];
  'update:mapCenterLng': [value: number];
  'update:mapCenterLat': [value: number];
  'update:mapZoom': [value: number];
  'update:coluna1': [value: string | null];
  'update:coluna2': [value: string | null];
  'update:coluna3': [value: string | null];
  'update:coluna4': [value: string | null];
  'update:coluna5': [value: string | null];
  'update:zoomOnClick': [value: boolean];
}
