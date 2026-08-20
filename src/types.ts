import { Filter } from '@directus/types';

export interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

export interface Header {
  text: string;
  value: string;
}

export interface GeoItem {
  id: string | number;
  [key: string]: unknown;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { id: string | number; formattedTitle: string };
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

export const serializeFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if ('coordinates' in (value as Record<string, unknown>)) {
    const geo = value as { coordinates: [number, number] };
    return `${geo.coordinates[1]}, ${geo.coordinates[0]}`;
  }
  return JSON.stringify(value);
};
