import type {
  GeoItem,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  PointCoordinates,
} from './types.js';
import { serializeFieldValue } from './utils.js';

const PLACEHOLDER_PATTERN_SOURCE = '\\{\\{([^}]+)\\}\\}';

export interface PointFeatureCollectionInput {
  items: GeoItem[];
  geolocationField: string;
  titleTemplate?: string;
}

export const resolveItemCoordinates = (
  item: GeoItem,
  geolocationField: string
): PointCoordinates | undefined => {
  const coordinates = (item[geolocationField] as { coordinates?: PointCoordinates } | undefined)
    ?.coordinates;
  return Array.isArray(coordinates) && coordinates.length === 2
    ? [coordinates[0], coordinates[1]]
    : undefined;
};

export const resolveTitleFromTemplate = (item: GeoItem, template: string): string => {
  const templateContainsPlaceholders = new RegExp(PLACEHOLDER_PATTERN_SOURCE).test(template);
  if (!templateContainsPlaceholders && template in item) return serializeFieldValue(item[template]);

  const resolvedTemplate = template.replace(
    new RegExp(PLACEHOLDER_PATTERN_SOURCE, 'g'),
    (_placeholder, fieldName: string) => serializeFieldValue(item[fieldName])
  );
  return resolvedTemplate.trim() || String(item.id);
};

export const buildPointFeatureCollection = ({
  items,
  geolocationField,
  titleTemplate = '',
}: PointFeatureCollectionInput): GeoJsonFeatureCollection => {
  const features = items.flatMap<GeoJsonFeature>((item) => {
    const coordinates = resolveItemCoordinates(item, geolocationField);
    if (!coordinates) return [];
    return [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { id: item.id, formattedTitle: resolveTitleFromTemplate(item, titleTemplate) },
      },
    ];
  });
  return { type: 'FeatureCollection', features };
};
