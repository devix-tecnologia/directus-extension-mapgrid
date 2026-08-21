import type { Filter } from '@directus/types';

export interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

export type GeoItem = RowItem;

export interface Header {
  text: string;
  value: string;
}

export type PointCoordinates = [number, number];

export interface PointGeometry {
  type: 'Point';
  coordinates: PointCoordinates;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: PointGeometry;
  properties: { id: string | number; formattedTitle: string };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeolocationData {
  type?: string;
  coordinates?: PointCoordinates;
}

export interface LayoutOptions {
  title?: string;
  geolocation?: string;
  zoomOnClick?: boolean;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
}

export interface LayoutQuery {
  fields: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
