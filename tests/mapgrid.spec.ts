import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../src/defaults.js';
import {
  buildPointFeatureCollection,
  resolveItemCoordinates,
  resolveTitleFromTemplate,
} from '../src/geojson.js';
import type { RowItem } from '../src/types.js';
import { serializeFieldValue, serializeItemRow } from '../src/utils.js';
import {
  COLLECTION_NAME,
  deleteTestCollection,
  deleteTestItems,
  ensureTestCollection,
  getTestItems,
  populateTestItems,
  TEST_ITEMS,
  type TestItem,
} from './helper-collection.js';
import {
  apiRequest,
  type DirectusCollectionResponse,
  type DirectusSingleResponse,
  getAccessToken,
  unwrapItems,
} from './helpers/directus-api.js';
import { setupTestEnvironment } from './setup.js';

describe('MapGrid Extension - Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
    await ensureTestCollection();
    await populateTestItems();
  }, 300_000);

  afterAll(async () => {
    await deleteTestItems();
    await deleteTestCollection();
  });

  test('Test collection should exist with the expected fields', async () => {
    const response = await apiRequest<DirectusCollectionResponse<{ field: string }>>(
      'GET',
      `/fields/${COLLECTION_NAME}`
    );
    const fieldNames = unwrapItems(response).map((field) => field.field);

    expect(fieldNames).toEqual(expect.arrayContaining(['name', 'location', 'status']));
  });

  test('Location field should be stored as json', async () => {
    const response = await apiRequest<DirectusSingleResponse<{ type: string }>>(
      'GET',
      `/fields/${COLLECTION_NAME}/location`
    );

    expect(response.data.type).toBe('json');
  });

  test('Stored items should expose valid point geolocation data', async () => {
    const items = await getTestItems();

    expect(items.length).toBeGreaterThanOrEqual(TEST_ITEMS.length);

    for (const item of items) {
      expect(item.location?.type).toBe('Point');
      expect(item.location?.coordinates).toHaveLength(2);
      expect(resolveItemCoordinates(item, 'location')).toHaveLength(2);
    }
  });

  test('Published and draft items should coexist', async () => {
    const items = await getTestItems();

    expect(items.filter((item) => item.status === 'published').length).toBeGreaterThanOrEqual(4);
    expect(items.filter((item) => item.status === 'draft').length).toBeGreaterThanOrEqual(1);
  });

  test('buildPointFeatureCollection should produce a valid FeatureCollection from live items', async () => {
    const items = await getTestItems();
    const geojson = buildPointFeatureCollection({
      items,
      geolocationField: 'location',
      titleTemplate: '{{name}}',
    });

    const locatedItems = items.filter((item) => item.location !== undefined);

    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(locatedItems.length);

    for (const locatedItem of locatedItems) {
      const feature = geojson.features.find(
        (candidate) => candidate.properties.id === locatedItem.id
      );
      expect(feature).toBeDefined();
      expect(feature?.type).toBe('Feature');
      expect(feature?.geometry.type).toBe('Point');
      expect(feature?.geometry.coordinates).toEqual(locatedItem.location?.coordinates);
      expect(feature?.properties.formattedTitle).toBe(locatedItem.name);
    }
  });

  test('buildPointFeatureCollection should skip items without coordinates', () => {
    const items: RowItem[] = [
      { id: 1, name: 'Brasilia', location: { type: 'Point', coordinates: [-47.9292, -15.7801] } },
      { id: 2, name: 'Sem localizacao' },
      {
        id: 3,
        name: 'Coordenadas incompletas',
        location: { type: 'Point', coordinates: [-47.9292] },
      },
    ];

    const geojson = buildPointFeatureCollection({
      items,
      geolocationField: 'location',
      titleTemplate: '{{name}}',
    });

    expect(geojson.features.map((feature) => feature.properties.formattedTitle)).toEqual([
      'Brasilia',
    ]);
  });

  test('resolveTitleFromTemplate should resolve placeholders and raw field names', () => {
    const item: RowItem = { id: 7, name: 'Curitiba', status: 'published' };

    expect(resolveTitleFromTemplate(item, '{{name}}')).toBe('Curitiba');
    expect(resolveTitleFromTemplate(item, '{{status}} / {{name}}')).toBe('published / Curitiba');
    expect(resolveTitleFromTemplate(item, 'name')).toBe('Curitiba');
    expect(resolveTitleFromTemplate(item, '')).toBe('7');
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
    expect(serializeItemRow(null, 'name')).toBe('');
    expect(serializeItemRow(undefined, 'name')).toBe('');
  });

  test('Default map options should stay pinned to the published contract', () => {
    expect(DEFAULT_MAP_CENTER).toEqual([-47.9292, -15.7801]);
    expect(DEFAULT_MAP_ZOOM).toBe(4);
  });

  test('Items should be sortable via API', async () => {
    const items = await getTestItems('?sort=name&limit=3');

    expect(items.length).toBeGreaterThanOrEqual(3);

    const names = items.map((item) => item.name);
    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second)));
  });

  test('Items should be filterable via API', async () => {
    const response = await apiRequest<DirectusCollectionResponse<TestItem>>(
      'GET',
      `/items/${COLLECTION_NAME}?filter[status][_eq]=draft&limit=-1`,
      undefined,
      getAccessToken()
    );

    const drafts = unwrapItems(response);
    expect(drafts.length).toBeGreaterThanOrEqual(1);

    for (const item of drafts) {
      expect(item.status).toBe('draft');
    }
  });
});
