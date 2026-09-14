/**
 * The shape of an item's geolocation field as it arrives from the Directus API.
 * The value is opaque: the field is declared as JSON on the collection, so
 * nothing guarantees that what came back is a point — it may be a polygon, a
 * half-filled value, or `null`. Whoever reads it has to parse, not assert.
 */

import { isRecord } from './is-record';

/** Longitude and latitude, in the order GeoJSON and maplibre use. */
export type PointCoordinates = [number, number];

export interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

export type GeoItem = RowItem;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * A point's coordinates, or `null` for anything else. Rejects geometries that
 * are not points, and coordinates that are incomplete or not numeric — a `NaN`
 * getting past here would surface as an "Invalid LngLat object" deep inside
 * maplibre, far from the cause.
 */
export const parsePointCoordinates = (raw: unknown): PointCoordinates | null => {
  if (!isRecord(raw)) return null;
  if (raw.type !== undefined && raw.type !== 'Point') return null;

  const coordinates = raw.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;

  const [longitude, latitude] = coordinates;
  if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude)) return null;

  return [longitude, latitude];
};

/** The point stored in `field`, or `null` when the item has no point there. */
export const itemPointCoordinates = (item: GeoItem, field: string): PointCoordinates | null =>
  parsePointCoordinates(item[field]);
