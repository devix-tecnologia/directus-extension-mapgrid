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

export interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

export type GeoItem = RowItem;
