import type { GeoItem } from '../../contract/index.js';
import { itemPointCoordinates } from '../../contract/index.js';
import { resolveFieldTemplate } from '../value-formatter/index.js';
import type { GeoJsonFeature, GeoJsonFeatureCollection } from './geo.types.js';

export const GEO_SOURCE_ID = 'points';
export const GEO_CLUSTER_LAYER_ID = 'clusters';
export const GEO_POINT_LAYER_ID = 'unclustered-point';
export const GEO_ANIMATION_DURATION = 1000;
export const GEO_FIT_BOUNDS_MAX_ZOOM = 15;
export const GEO_CLUSTER_MAX_ZOOM = 14;
export const GEO_CLUSTER_RADIUS = 20;

/**
 * A fonte GeoJSON do mapa. Itens sem ponto são omitidos em vez de virarem uma
 * feature vazia: o maplibre não sabe desenhar uma, e o agrupamento contaria um
 * marcador que não existe.
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
