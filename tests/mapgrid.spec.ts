import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment, apiRequest } from './setup.js';
import { createTestCollection, populateTestItems, deleteTestCollection, COLLECTION_NAME } from './helper-collection.js';
import { getTestItems, deleteTestItems } from './helper-items.js';
import { logger } from './test-logger.js';
import { serializeFieldValue, serializeItemRow } from '../src/utils.js';
import type { RowItem, GeoJsonFeature } from '../src/types.js';

const DEFAULT_LAYOUT_OPTIONS = {
  mapCenterLng: -47.9292,
  mapCenterLat: -15.7801,
  mapZoom: 4,
};

describe('MapGrid Extension - Integration Tests', () => {
  beforeAll(async () => {
    process.env.DIRECTUS_VERSION = process.env.DIRECTUS_VERSION || '10.13.1';
    await setupTestEnvironment('integration');
    await createTestCollection();
    await populateTestItems();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }, 300000);

  afterAll(async () => {
    await deleteTestItems();
    await deleteTestCollection();
    await teardownTestEnvironment('integration');
  });

  beforeEach(() => {
    logger.setCurrentTest('Integration');
  });

  test('Test collection should exist with correct fields', async () => {
    const response = await apiRequest(
      'GET',
      `/fields/${COLLECTION_NAME}`,
      undefined,
      String(process.env.DIRECTUS_ACCESS_TOKEN),
    );

    const fields = (response.data as Record<string, unknown>)?.data || response.data || response;
    expect(Array.isArray(fields)).toBe(true);

    const fieldNames = (fields as Array<{ field: string }>).map((f) => f.field);
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('location');
    expect(fieldNames).toContain('status');
  });

  test('Location field should be configured as json type', async () => {
    const response = await apiRequest(
      'GET',
      `/fields/${COLLECTION_NAME}/location`,
      undefined,
      String(process.env.DIRECTUS_ACCESS_TOKEN),
    );

    const field = (response.data as Record<string, unknown>)?.data || response.data || response;
    expect(field).toBeDefined();
    expect((field as Record<string, unknown>).type).toBe('json');
  });

  test('Test items should have valid geolocation data', async () => {
    const items = await getTestItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(5);

    for (const item of items as Array<RowItem>) {
      const location = item.location as { type?: string; coordinates?: [number, number] } | undefined;
      if (location) {
        expect(location.type).toBe('Point');
        expect(Array.isArray(location.coordinates)).toBe(true);
        expect(location.coordinates).toHaveLength(2);
      }
    }
  });

  test('Published and draft items should coexist', async () => {
    const items = await getTestItems();
    const published = items.filter((item: RowItem) => item.status === 'published');
    const draft = items.filter((item: RowItem) => item.status === 'draft');

    expect(published.length).toBeGreaterThanOrEqual(4);
    expect(draft.length).toBeGreaterThanOrEqual(1);
  });

  test('GeoJSON construction should produce valid FeatureCollection', () => {
    const items: RowItem[] = [
      { id: 1, name: 'Brasilia', location: { type: 'Point', coordinates: [-47.9292, -15.7801] } },
      { id: 2, name: 'Sao Paulo', location: { type: 'Point', coordinates: [-46.6333, -23.5505] } },
      { id: 3, name: 'Sem localizacao' },
    ];

    const geoItemKey = 'location';
    const titleTemplate = '{{name}}';

    const resolveItemCoords = (item: RowItem): [number, number] | undefined => {
      const coords = (item[geoItemKey] as { coordinates?: [number, number] } | undefined)?.coordinates;
      return coords && coords.length === 2 ? [coords[0], coords[1]] : undefined;
    };

    const resolveFieldTemplate = (item: RowItem, template: string): string => {
      if (!template) return String(item.id);
      let result = template;
      const fieldPattern = /\{\{([^}]+)\}\}/g;
      const matches = result.match(fieldPattern) || [];
      for (const match of matches) {
        const fieldName = match.slice(2, -2);
        const raw = item[fieldName];
        const resolved = serializeFieldValue(raw);
        result = result.replace(match, resolved);
      }
      return result.trim() || String(item.id);
    };

    const buildGeoJson = (): { type: string; features: GeoJsonFeature[] } => {
      const features: GeoJsonFeature[] = [];
      for (const item of items) {
        const coords = resolveItemCoords(item);
        if (!coords) continue;
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: { id: item.id, formattedTitle: resolveFieldTemplate(item, titleTemplate) },
        });
      }
      return { type: 'FeatureCollection', features };
    };

    const geojson = buildGeoJson();
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(2);

    expect(geojson.features[0].properties.formattedTitle).toBe('Brasilia');
    expect(geojson.features[0].geometry.coordinates).toEqual([-47.9292, -15.7801]);

    expect(geojson.features[1].properties.formattedTitle).toBe('Sao Paulo');
    expect(geojson.features[1].geometry.coordinates).toEqual([-46.6333, -23.5505]);
  });

  test('serializeFieldValue should handle all field types', () => {
    expect(serializeFieldValue(null)).toBe('');
    expect(serializeFieldValue(undefined)).toBe('');
    expect(serializeFieldValue('hello')).toBe('hello');
    expect(serializeFieldValue(42)).toBe('42');
    expect(serializeFieldValue([1, 2, 3])).toBe('1, 2, 3');
    expect(serializeFieldValue({ coordinates: [-47.9292, -15.7801] })).toBe('-15.7801, -47.9292');
    expect(serializeFieldValue({ key: 'value' })).toBe('{"key":"value"}');
  });

  test('serializeItemRow should handle missing fields', () => {
    const item: RowItem = { id: 1, name: 'Test' };

    expect(serializeItemRow(item, 'name')).toBe('Test');
    expect(serializeItemRow(item, 'nonexistent')).toBe('');
    expect(serializeItemRow(item, '')).toBe('');
    expect(serializeItemRow(null as unknown as RowItem, 'name')).toBe('');
    expect(serializeItemRow(undefined as unknown as RowItem, 'name')).toBe('');
  });

  test('Layout options should have correct defaults', () => {
    expect(DEFAULT_LAYOUT_OPTIONS.mapCenterLng).toBe(-47.9292);
    expect(DEFAULT_LAYOUT_OPTIONS.mapCenterLat).toBe(-15.7801);
    expect(DEFAULT_LAYOUT_OPTIONS.mapZoom).toBe(4);
  });

  test('Items should be sortable via API', async () => {
    const responseAsc = await apiRequest(
      'GET',
      `/items/${COLLECTION_NAME}?sort=name&limit=3`,
      undefined,
      String(process.env.DIRECTUS_ACCESS_TOKEN),
    );

    const items = (responseAsc.data as Record<string, unknown>)?.data || responseAsc.data || responseAsc;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(3);

    const names = (items as Array<RowItem>).map((i) => i.name as string);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('Items should be filterable via API', async () => {
    const response = await apiRequest(
      'GET',
      `/items/${COLLECTION_NAME}?filter[status][_eq]=draft`,
      undefined,
      String(process.env.DIRECTUS_ACCESS_TOKEN),
    );

    const items = (response.data as Record<string, unknown>)?.data || response.data || response;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);

    for (const item of items as Array<RowItem>) {
      expect(item.status).toBe('draft');
    }
  });
});
