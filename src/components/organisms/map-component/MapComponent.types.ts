import type { GeoItem } from '../../../services/geo/index.js';

export interface MapComponentType {
  models: MapComponentModels;
  props: MapComponentProps;
  emits: MapComponentEmits;
}

export type MapComponentModels = Record<string, never>;

export interface MapComponentProps {
  items: GeoItem[];
  geolocation: string;
  title: string;
  zoomOnClick?: boolean;
  centerLng?: number;
  centerLat?: number;
  initialZoom?: number;
}

export interface MapComponentEmits {
  'select-item': [id: string | number];
}
