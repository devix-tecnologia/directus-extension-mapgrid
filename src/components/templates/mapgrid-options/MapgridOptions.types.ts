import type { LayoutOptions } from '../../../types.js';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export interface MapgridOptionsModels {}

export interface MapgridOptionsProps {
  collection: string;
  layoutOptions: LayoutOptions;
  fieldsInCollection: unknown[];
  title?: string;
  geolocation?: string | null;
  coluna1?: string | null;
  coluna2?: string | null;
  coluna3?: string | null;
  coluna4?: string | null;
  coluna5?: string | null;
  zoomOnClick?: boolean;
}

export interface MapgridOptionsEmits {
  'update:layoutOptions': [value: LayoutOptions];
  'update:title': [value: string];
  'update:geolocation': [value: string | null];
  'update:coluna1': [value: string | null];
  'update:coluna2': [value: string | null];
  'update:coluna3': [value: string | null];
  'update:coluna4': [value: string | null];
  'update:coluna5': [value: string | null];
  'update:zoomOnClick': [value: boolean];
}
