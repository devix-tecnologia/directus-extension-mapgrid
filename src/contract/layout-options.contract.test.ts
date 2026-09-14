import { describe, expect, it } from 'vitest';
import { COLUMN_KEYS, configuredColumns, normalizeLayoutOptions } from './layout-options.contract';

describe('normalizeLayoutOptions — the preset comes from the database, not from an already typed object', () => {
  it('converts numbers that came back as text, which is how the interface stores a v-input', () => {
    const options = normalizeLayoutOptions({
      mapCenterLng: '-47.9292',
      mapCenterLat: '-15.7801',
      mapZoom: '8',
    });

    expect(options.mapCenterLng).toBe(-47.9292);
    expect(options.mapCenterLat).toBe(-15.7801);
    expect(options.mapZoom).toBe(8);
  });

  it('drops impossible numbers instead of letting NaN reach the map', () => {
    const options = normalizeLayoutOptions({ mapCenterLng: 'abc', mapZoom: Number.NaN });

    expect(options.mapCenterLng).toBeUndefined();
    expect(options.mapZoom).toBeUndefined();
  });

  it('treats blank text as an unset field, so the detected default applies', () => {
    const options = normalizeLayoutOptions({ title: '   ', geolocation: '', coluna1: '  ' });

    expect(options.title).toBeUndefined();
    expect(options.geolocation).toBeUndefined();
    expect(options.coluna1).toBeUndefined();
  });

  it('trims whitespace around a field name, which would break the lookup on the collection', () => {
    expect(normalizeLayoutOptions({ geolocation: ' position ' }).geolocation).toBe('position');
  });

  it('only accepts a real boolean for zoomOnClick, so "false" is not treated as true', () => {
    expect(normalizeLayoutOptions({ zoomOnClick: true }).zoomOnClick).toBe(true);
    expect(normalizeLayoutOptions({ zoomOnClick: 'false' }).zoomOnClick).toBeUndefined();
  });

  it('does not throw for a missing preset or one of another shape, because layoutOptions starts empty', () => {
    expect(normalizeLayoutOptions(undefined)).toBeDefined();
    expect(normalizeLayoutOptions(null)).toBeDefined();
    expect(normalizeLayoutOptions('text')).toBeDefined();
  });

  it('ignores keys the layout does not know, carried over from an older preset', () => {
    const options = normalizeLayoutOptions({ geolocation: 'position', widthMap: { a: 1 } });

    expect(options).not.toHaveProperty('widthMap');
    expect(options.geolocation).toBe('position');
  });
});

describe('configuredColumns — a user can leave gaps between the columns', () => {
  it('returns the columns in the order they were declared', () => {
    const columns = configuredColumns({ coluna1: 'name', coluna2: 'status', coluna3: 'city' });

    expect(columns).toEqual(['name', 'status', 'city']);
  });

  it('closes the gaps, so the grid does not open a headerless column', () => {
    const columns = configuredColumns({ coluna1: 'name', coluna3: 'city', coluna5: 'state' });

    expect(columns).toEqual(['name', 'city', 'state']);
  });

  it('returns an empty list when nothing was configured', () => {
    expect(configuredColumns({})).toEqual([]);
  });
});

describe('COLUMN_KEYS — the numbered names come from the Directus preset format', () => {
  it('covers the five columns the preset stores', () => {
    expect(COLUMN_KEYS).toEqual(['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5']);
  });
});
