import type { RowItem } from './types.js';

const formatGeographicCoordinates = (value: { coordinates: [number, number] }): string =>
  `${value.coordinates[1]}, ${value.coordinates[0]}`;

export const serializeFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if ('coordinates' in (value as Record<string, unknown>)) {
    return formatGeographicCoordinates(value as { coordinates: [number, number] });
  }
  return JSON.stringify(value);
};

export const serializeItemRow = (item: RowItem, field: string): string => {
  if (!item || !field) return '';
  if (!(field in item)) return '';
  return serializeFieldValue(item[field]);
};
