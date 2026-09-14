/**
 * What the MapGrid layout stores in the Directus preset. This is the only
 * declaration of that shape in the project: components derive their props from
 * here with `Pick` instead of repeating the field list, so that adding an
 * option is a one-file edit.
 */

import { isRecord } from './is-record';

/** The layout id — what a preset's `layout` points at. */
export const MAPGRID_LAYOUT_ID = 'mapgrid';

/**
 * The grid columns are numbered fields rather than a list because that is how
 * the Directus preset already stores them; switching to `columns: string[]`
 * would break existing presets. The tuple keeps the names in one place.
 */
export const COLUMN_KEYS = ['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5'] as const;

export type ColumnKey = (typeof COLUMN_KEYS)[number];

export interface LayoutOptions {
  /** Marker popup template, over the item's fields. Empty → the id. */
  title?: string;
  /** The collection's geolocation field. Empty → detected from the collection. */
  geolocation?: string;
  /** Zoom the map in when a row is clicked, instead of only panning. */
  zoomOnClick?: boolean;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
}

/**
 * The fields that describe the map camera. Whoever only positions the map gets
 * this slice, not the whole preset.
 */
export type MapCameraOptions = Pick<LayoutOptions, 'mapCenterLng' | 'mapCenterLat' | 'mapZoom'>;

/** The column fields, without the rest of the preset. */
export type ColumnOptions = Pick<LayoutOptions, ColumnKey>;

const toTrimmedText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

/**
 * The preset arrives from Directus as database data, not as `LayoutOptions`: a
 * numeric field edited in the interface can come back as a string, and an old
 * preset can carry keys that no longer exist. Converts each field and drops
 * what does not fit, instead of asserting the shape with `as`.
 */
export const normalizeLayoutOptions = (raw: unknown): LayoutOptions => {
  const source = isRecord(raw) ? raw : {};

  const options: LayoutOptions = {
    title: toTrimmedText(source.title),
    geolocation: toTrimmedText(source.geolocation),
    zoomOnClick: toBoolean(source.zoomOnClick),
    mapCenterLng: toFiniteNumber(source.mapCenterLng),
    mapCenterLat: toFiniteNumber(source.mapCenterLat),
    mapZoom: toFiniteNumber(source.mapZoom),
  };

  for (const key of COLUMN_KEYS) {
    options[key] = toTrimmedText(source[key]);
  }

  return options;
};

/**
 * The configured columns, in order, with the gaps closed. A user can leave
 * column 2 empty and fill column 3, and the grid should not open a headerless
 * column because of it.
 */
export const configuredColumns = (options: ColumnOptions): string[] =>
  COLUMN_KEYS.map((key) => options[key]).filter(
    (column): column is string => typeof column === 'string' && column !== ''
  );
