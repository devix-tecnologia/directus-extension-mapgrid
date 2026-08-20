import type { GeoItem } from './geo.types.js';

export const GEO_SOURCE_ID = 'points';
export const GEO_CLUSTER_LAYER_ID = 'clusters';
export const GEO_POINT_LAYER_ID = 'unclustered-point';
export const GEO_ANIMATION_DURATION = 1000;
export const GEO_FIT_BOUNDS_MAX_ZOOM = 15;

export const getItemCoordinates = (item: GeoItem, geolocation: string): [number, number] | null => {
  const coordinates = (item[geolocation] as { coordinates?: [number, number] } | undefined)?.coordinates;

  if (!coordinates || coordinates.length !== 2) return null;

  return [coordinates[0], coordinates[1]];
};
