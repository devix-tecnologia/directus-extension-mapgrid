import type { GeoItem } from '../../contract/index';
import { itemPointCoordinates } from '../../contract/index';
import { resolveFieldTemplate } from '../value-formatter/index';
import type { GeoJsonFeature, GeoJsonFeatureCollection } from './geo.types';

export const GEO_SOURCE_ID = 'points';
export const GEO_CLUSTER_LAYER_ID = 'clusters';
export const GEO_POINT_LAYER_ID = 'unclustered-point';
export const GEO_ANIMATION_DURATION = 1000;
export const GEO_FIT_BOUNDS_MAX_ZOOM = 15;
export const GEO_CLUSTER_MAX_ZOOM = 14;
export const GEO_CLUSTER_RADIUS = 20;

/**
 * The map's GeoJSON source. Items without a point are omitted rather than
 * turned into an empty feature: maplibre cannot draw one, and clustering would
 * count a marker that is not there.
 */
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
    const coordinates = itemPointCoordinates(item, geolocationField);
    if (!coordinates) return [];

    return [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { id: item.id, formattedTitle: resolveFieldTemplate(item, titleTemplate) },
      },
    ];
  });

  return { type: 'FeatureCollection', features };
};
