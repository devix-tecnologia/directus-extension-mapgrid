import { describe, expect, it } from 'vitest';
import { itemPointCoordinates, parsePointCoordinates } from './geolocation.contract';

describe('parsePointCoordinates — the field is JSON on the collection, so nothing guarantees it is a point', () => {
  it('reads a Directus point in [longitude, latitude] order', () => {
    expect(parsePointCoordinates({ type: 'Point', coordinates: [-47.9292, -15.7801] })).toEqual([
      -47.9292, -15.7801,
    ]);
  });

  it('accepts coordinates without a type field, which is how some older presets wrote them', () => {
    expect(parsePointCoordinates({ coordinates: [10, 20] })).toEqual([10, 20]);
  });

  it('rejects non-point geometries instead of reading a polygon’s first pair', () => {
    expect(
      parsePointCoordinates({
        type: 'Polygon',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      })
    ).toBeNull();
  });

  it('rejects NaN and Infinity, which would reach maplibre as "Invalid LngLat object" far from the cause', () => {
    expect(parsePointCoordinates({ coordinates: [Number.NaN, 10] })).toBeNull();
    expect(parsePointCoordinates({ coordinates: [10, Number.POSITIVE_INFINITY] })).toBeNull();
  });

  it('rejects coordinates given as text, because a half-converted point draws in the wrong place', () => {
    expect(parsePointCoordinates({ coordinates: ['-47.9', '-15.7'] })).toBeNull();
  });

  it('rejects pairs that are incomplete or carry an extra dimension', () => {
    expect(parsePointCoordinates({ coordinates: [10] })).toBeNull();
    expect(parsePointCoordinates({ coordinates: [10, 20, 30] })).toBeNull();
  });

  it('treats a missing value as a missing point, without throwing', () => {
    expect(parsePointCoordinates(null)).toBeNull();
    expect(parsePointCoordinates(undefined)).toBeNull();
    expect(parsePointCoordinates('POINT(-47.9 -15.7)')).toBeNull();
    expect(parsePointCoordinates({})).toBeNull();
  });
});

describe('itemPointCoordinates — the geolocation field is chosen in the layout options', () => {
  const item = {
    id: 1,
    position: { type: 'Point', coordinates: [-46.6333, -23.5505] },
    other: 'text',
  };

  it('reads the requested field', () => {
    expect(itemPointCoordinates(item, 'position')).toEqual([-46.6333, -23.5505]);
  });

  it('returns null when the configured field is absent from the item, so the item is skipped', () => {
    expect(itemPointCoordinates(item, 'missing')).toBeNull();
    expect(itemPointCoordinates(item, 'other')).toBeNull();
  });
});
