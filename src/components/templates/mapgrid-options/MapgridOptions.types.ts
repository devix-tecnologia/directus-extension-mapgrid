import type { LayoutOptions } from '../../../types.js';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

export interface MapgridOptionsProps {
  collection: string;
  layoutOptions: LayoutOptions;
  fieldsInCollection: Array<{ name: string; field: string; meta?: { interface?: string } }>;
  title?: string;
  geolocation?: string;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
  zoomOnClick?: boolean;
}

export interface MapgridOptionsEmits {
  'update:layoutOptions': [value: LayoutOptions];
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
