import type { PointCoordinates } from '../../contract/index';

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
