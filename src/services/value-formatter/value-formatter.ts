import type { GeoItem } from '../../contract/index';
import { parsePointCoordinates } from '../../contract/index';

/** `{{field}}`. Compiled once: `resolveFieldTemplate` runs per displayed item. */
const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/;
const PLACEHOLDER_PATTERN_GLOBAL = /\{\{([^}]+)\}\}/g;

/**
 * A point in a grid cell is shown as "latitude, longitude" — the order people
 * read, reversed from the GeoJSON order.
 */
const formatPointCoordinates = ([longitude, latitude]: [number, number]): string =>
  `${latitude}, ${longitude}`;

/** Any value of an item, as the text of a cell. */
export const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');

  const point = parsePointCoordinates(value);
  if (point) return formatPointCoordinates(point);

  return JSON.stringify(value);
};

/**
 * The popup template, resolved against an item. Accepts both `{{field}}` and a
 * bare field name, because the layout options allow either. Always falls back
 * to the id when nothing resolves, so the popup never opens blank.
 */
export const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);

  const hasPlaceholders = PLACEHOLDER_PATTERN.test(template);
  if (!hasPlaceholders && template in item) return serializeValue(item[template]);

  const resolved = template.replace(PLACEHOLDER_PATTERN_GLOBAL, (_match, fieldName: string) =>
    serializeValue(item[fieldName])
  );

  return resolved.trim() || String(item.id);
};

/** The value of an item's field, ready for the cell. */
export const serializeItemRow = (item: GeoItem | null | undefined, field: string): string => {
  if (!item) return '';
  if (!(field in item)) return '';
  return serializeValue(item[field]);
};
