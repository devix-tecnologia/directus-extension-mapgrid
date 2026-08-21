import type { PointCoordinates, RowItem } from './types.js';

interface PointLikeValue {
  coordinates: PointCoordinates;
}

const hasPointCoordinates = (value: object): value is PointLikeValue => 'coordinates' in value;

const formatGeographicCoordinates = (value: PointLikeValue): string =>
  `${value.coordinates[1]}, ${value.coordinates[0]}`;

export const serializeFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (hasPointCoordinates(value)) return formatGeographicCoordinates(value);
  return JSON.stringify(value);
};

export const serializeItemRow = (item: RowItem | null | undefined, field: string): string => {
  if (!item) return '';
  if (!(field in item)) return '';
  return serializeFieldValue(item[field]);
};
