import type { GeoItem } from '../../../services/geo/geo.types.js';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

export interface MapgridLayoutModels {}

export interface MapgridLayoutProps {
  items: GeoItem[];
  loading?: boolean;
  collection: string;
  title?: string;
  geolocation?: string;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
  zoomOnClick?: boolean;
}

export interface MapgridLayoutEmits {}
