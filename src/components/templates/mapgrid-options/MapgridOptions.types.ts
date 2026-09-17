import type { Field } from '@directus/types';
import type { LayoutOptions } from '../../../contract/index';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

/**
 * The options panel reads only a field's name, key and interface — enough to
 * build the selects. Declaring that slice with `Pick`, instead of redrawing an
 * object, keeps it aligned with the Directus `Field`.
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
