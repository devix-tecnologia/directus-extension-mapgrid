import type { GeoItem } from '../../../services/geo/index.js';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

export interface MapgridLayoutProps {
  items: GeoItem[];
  loading?: boolean;
  collection: string;
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
  selectedItems: GeoItem[];
}

export interface MapgridLayoutEmits {
  'update:selectedItems': [items: GeoItem[]];
}

export interface MapgridLayoutModels {}
