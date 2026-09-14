import { describe, expect, it } from 'vitest';
import type { GeoItem } from '../../contract/index';
import { buildPointFeatureCollection } from './geo';

const itemAt = (id: number, coordinates: [number, number], name: string): GeoItem => ({
  id,
  name,
  position: { type: 'Point', coordinates },
});

describe('buildPointFeatureCollection — the map’s GeoJSON source', () => {
  it('turns each item into a feature, keeping the id so it matches its grid row', () => {
    const collection = buildPointFeatureCollection({
      items: [itemAt(1, [-47.9, -15.7], 'Brasília'), itemAt(2, [-46.6, -23.5], 'São Paulo')],
      geolocationField: 'position',
      titleTemplate: '{{name}}',
    });

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.properties).toEqual({ id: 1, formattedTitle: 'Brasília' });
    expect(collection.features[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [-47.9, -15.7],
    });
  });

  it('omits an item without a point, because clustering would count a marker that is not there', () => {
    const collection = buildPointFeatureCollection({
      items: [
        itemAt(1, [-47.9, -15.7], 'Brasília'),
        { id: 2, name: 'No location', position: null },
        { id: 3, name: 'Missing field' },
      ],
      geolocationField: 'position',
      titleTemplate: '{{name}}',
    });

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.properties.id).toBe(1);
  });

  it('omits an item whose point does not survive parsing, instead of propagating NaN to the map', () => {
    const collection = buildPointFeatureCollection({
      items: [{ id: 1, name: 'Malformed', position: { coordinates: ['a', 'b'] } }],
      geolocationField: 'position',
      titleTemplate: '{{name}}',
    });

    expect(collection.features).toEqual([]);
  });

  it('reads the geolocation field the preset chose, not a hardcoded name', () => {
    const collection = buildPointFeatureCollection({
      items: [{ id: 1, name: 'Another field', location: { coordinates: [1, 2] } }],
      geolocationField: 'location',
      titleTemplate: '{{name}}',
    });

    expect(collection.features[0]?.geometry.coordinates).toEqual([1, 2]);
  });

  it('falls back to the id when the template does not resolve, so a popup never opens blank', () => {
    const collection = buildPointFeatureCollection({
      items: [itemAt(7, [0, 0], 'Seven')],
      geolocationField: 'position',
      titleTemplate: '{{missing}}',
    });

    expect(collection.features[0]?.properties.formattedTitle).toBe('7');
  });

  it('returns an empty collection for an empty list, and not a missing value', () => {
    const collection = buildPointFeatureCollection({
      items: [],
      geolocationField: 'position',
      titleTemplate: '{{name}}',
    });

    expect(collection).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
