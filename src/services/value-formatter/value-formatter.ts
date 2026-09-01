import type { GeoItem } from '../geo/geo.types.js';

interface PointLikeValue {
  coordinates: [number, number];
}

const PLACEHOLDER_PATTERN_SOURCE = '\\{\\{([^}]+)\\}\\}';

const hasPointCoordinates = (value: object): value is PointLikeValue => 'coordinates' in value;

const formatGeographicCoordinates = (value: PointLikeValue): string =>
  `${value.coordinates[1]}, ${value.coordinates[0]}`;

export const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (hasPointCoordinates(value)) return formatGeographicCoordinates(value);
  return JSON.stringify(value);
};

export const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);

  const templateContainsPlaceholders = new RegExp(PLACEHOLDER_PATTERN_SOURCE).test(template);
  if (!templateContainsPlaceholders && template in item) return serializeValue(item[template]);

  const resolvedTemplate = template.replace(
    new RegExp(PLACEHOLDER_PATTERN_SOURCE, 'g'),
    (_placeholder, fieldName: string) => serializeValue(item[fieldName])
  );
  return resolvedTemplate.trim() || String(item.id);
};

export const serializeItemRow = (item: GeoItem | null | undefined, field: string): string => {
  if (!item) return '';
  if (!(field in item)) return '';
  return serializeValue(item[field]);
};
