import { resolveFieldTemplate } from '../value-formatter/index.js';
import type { GeoItem, GeoJsonFeature, GeoJsonFeatureCollection } from './geo.types.js';

export const GEO_SOURCE_ID = 'points';
export const GEO_CLUSTER_LAYER_ID = 'clusters';
export const GEO_POINT_LAYER_ID = 'unclustered-point';
export const GEO_ANIMATION_DURATION = 1000;
export const GEO_FIT_BOUNDS_MAX_ZOOM = 15;
export const GEO_CLUSTER_MAX_ZOOM = 14;
export const GEO_CLUSTER_RADIUS = 20;

export const DEFAULT_MAP_CENTER: [number, number] = [-47.9292, -15.7801];
export const DEFAULT_MAP_ZOOM = 4;

export const getItemCoordinates = (item: GeoItem, geolocation: string): [number, number] | null => {
  const coordinates = (item[geolocation] as { coordinates?: [number, number] } | undefined)
    ?.coordinates;

  if (coordinates?.length !== 2) return null;

  return [coordinates[0], coordinates[1]];
};

export const buildPointFeatureCollection = ({
  items,
  geolocationField,
  titleTemplate,
}: {
  items: GeoItem[];
  geolocationField: string;
  titleTemplate: string;
}): GeoJsonFeatureCollection => {
  const features = items.flatMap<GeoJsonFeature>((item) => {
    const coords = getItemCoordinates(item, geolocationField);
    if (!coords) return [];

    return [
      {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coords },
        properties: { id: item.id, formattedTitle: resolveFieldTemplate(item, titleTemplate) },
      },
    ];
  });

  return { type: 'FeatureCollection' as const, features };
};
