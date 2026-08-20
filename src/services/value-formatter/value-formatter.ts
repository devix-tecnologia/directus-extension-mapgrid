import type { GeoItem } from '../geo/geo.types.js';

export const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if ('coordinates' in (value as Record<string, unknown>)) {
    const geo = value as { coordinates: [number, number] };
    return `${geo.coordinates[1]}, ${geo.coordinates[0]}`;
  }
  return JSON.stringify(value);
};

export const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);

  let result = template;
  const fieldPattern = /\{\{([^}]+)\}\}/g;
  const matches = result.match(fieldPattern) || [];

  for (const match of matches) {
    const fieldName = match.slice(2, -2);
    result = result.replace(match, serializeValue(item[fieldName]));
  }

  return result.trim() || String(item.id);
};
