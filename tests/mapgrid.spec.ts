import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  COLLECTION_NAME,
  deleteTestCollection,
  deleteTestItems,
  ensureTestCollection,
  getTestItems,
  populateTestItems,
  TEST_ITEMS,
  type TestItem,
} from './helper-collection';
import {
  apiRequest,
  type DirectusCollectionResponse,
  type DirectusSingleResponse,
  getAccessToken,
  unwrapItems,
} from './helpers/directus-api';
import { setupTestEnvironment } from './setup';

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
      expect(item.location?.coordinates.every(Number.isFinite)).toBe(true);
    }
  });

  test('Published and draft items should coexist', async () => {
    const items = await getTestItems();

    expect(items.filter((item) => item.status === 'published').length).toBeGreaterThanOrEqual(4);
    expect(items.filter((item) => item.status === 'draft').length).toBeGreaterThanOrEqual(1);
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
