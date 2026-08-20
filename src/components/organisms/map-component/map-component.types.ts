import type { GeoItem } from '../../../services/geo/geo.types.js';

export interface MapComponentType {
  models: MapComponentModels;
  props: MapComponentProps;
  emits: MapComponentEmits;
}

export interface MapComponentModels {}

export interface MapComponentProps {
  items: GeoItem[];
  geolocation: string;
  title: string;
  zoomOnClick?: boolean;
}

export interface MapComponentEmits {
  'select-item': [id: string | number];
}
