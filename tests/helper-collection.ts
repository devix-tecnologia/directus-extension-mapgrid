import {
  apiRequest,
  type DirectusCollectionResponse,
  resourceExists,
  unwrapItems,
} from './helpers/directus-api';
import { waitForCondition } from './helpers/wait';
import { logger } from './test-logger';

const COLLECTION_NAME = 'test_mapgrid_items';
export const EMPTY_COLLECTION_NAME = 'test_mapgrid_empty';

export interface TestItemLocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface TestItem {
  id: number;
  name: string;
  location?: TestItemLocation;
  status: 'published' | 'draft';
  [key: string]: unknown;
}

export type NewTestItem = Omit<TestItem, 'id'>;

export const TEST_ITEMS: NewTestItem[] = [
  {
    name: 'Brasilia',
    location: { type: 'Point', coordinates: [-47.9292, -15.7801] },
    status: 'published',
  },
  {
    name: 'Sao Paulo',
    location: { type: 'Point', coordinates: [-46.6333, -23.5505] },
    status: 'published',
  },
  {
    name: 'Rio de Janeiro',
    location: { type: 'Point', coordinates: [-43.1729, -22.9068] },
    status: 'published',
  },
  {
    name: 'Salvador',
    location: { type: 'Point', coordinates: [-38.5124, -12.9714] },
    status: 'published',
  },
  {
    name: 'Belo Horizonte',
    location: { type: 'Point', coordinates: [-43.9386, -19.9191] },
    status: 'draft',
  },
  {
    name: 'Curitiba',
    location: { type: 'Point', coordinates: [-49.2653, -25.4284] },
    status: 'published',
  },
  {
    name: 'Recife',
    location: { type: 'Point', coordinates: [-34.877, -8.0476] },
    status: 'published',
  },
  { name: 'Manaus', location: { type: 'Point', coordinates: [-60.0255, -3.119] }, status: 'draft' },
];

interface CollectionPayload {
  collection: string;
  schema: { schema: string; name: string };
  meta: Record<string, unknown>;
  fields: Array<{
    field: string;
    type: string;
    meta: Record<string, unknown>;
    schema: Record<string, unknown>;
  }>;
}

const collectionPayload = (collection: string): CollectionPayload => ({
  collection,
  schema: { schema: 'public', name: collection },
  meta: { icon: 'map', note: 'Test collection for mapgrid extension' },
  fields: [
    {
      field: 'id',
      type: 'integer',
      meta: { hidden: true, interface: 'input', readonly: true },
      schema: { is_primary_key: true, has_auto_increment: true },
    },
    {
      field: 'name',
      type: 'string',
      meta: { interface: 'input', options: { placeholder: 'Enter name...' } },
      schema: { is_nullable: false },
    },
    {
      field: 'location',
      type: 'json',
      meta: { interface: 'map', options: {} },
      schema: { is_nullable: true },
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
          ],
        },
      },
      schema: { default_value: 'draft', is_nullable: false },
    },
  ],
});

const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
type PermissionAction = (typeof CRUD_ACTIONS)[number];

const existingPublicPermissionActions = async (
  collection: string
): Promise<Set<PermissionAction>> => {
  const query = `filter[collection][_eq]=${collection}&filter[role][_null]=true&fields=action&limit=-1`;
  const response = await apiRequest<DirectusCollectionResponse<{ action: PermissionAction }>>(
    'GET',
    `/permissions?${query}`
  );
  return new Set(unwrapItems(response).map((permission) => permission.action));
};

export const grantMissingPublicPermissions = async (collection: string): Promise<void> => {
  const grantedActions = await existingPublicPermissionActions(collection);
  const missingActions = CRUD_ACTIONS.filter((action) => !grantedActions.has(action));

  await Promise.all(
    missingActions.map((action) =>
      apiRequest('POST', '/permissions', {
        role: null,
        collection,
        action,
        permissions: {},
        validation: {},
        presets: null,
        fields: ['*'],
      })
    )
  );
};

const collectionExists = async (): Promise<boolean> =>
  resourceExists(`/collections/${COLLECTION_NAME}`);

const countTestItems = async (): Promise<number> => {
  const response = await apiRequest<DirectusCollectionResponse<TestItem>>(
    'GET',
    `/items/${COLLECTION_NAME}?fields=id&limit=-1`
  );
  return unwrapItems(response).length;
};

export async function ensureTestCollection(collection: string = COLLECTION_NAME): Promise<string> {
  if (await resourceExists(`/collections/${collection}`)) {
    logger.info(`Collection ${collection} already exists`);
    return collection;
  }

  logger.info(`Creating test collection ${collection}...`);
  await apiRequest('POST', '/collections', collectionPayload(collection));
  await waitForCondition(() => resourceExists(`/collections/${collection}`));
  await grantMissingPublicPermissions(collection);
  logger.info(`Collection ${collection} created successfully`);

  return collection;
}

export async function populateTestItems(): Promise<void> {
  if ((await countTestItems()) >= TEST_ITEMS.length) {
    logger.info(`Collection ${COLLECTION_NAME} already populated with ${TEST_ITEMS.length} items`);
    return;
  }

  logger.info(`Populating ${TEST_ITEMS.length} test items...`);
  await apiRequest('POST', `/items/${COLLECTION_NAME}`, TEST_ITEMS);
  await waitForCondition(async () => (await countTestItems()) >= TEST_ITEMS.length);
  logger.info(`Created ${TEST_ITEMS.length} test items`);
}

export async function ensureTestData(): Promise<string> {
  await ensureTestCollection();
  await populateTestItems();
  return COLLECTION_NAME;
}

export async function getTestItems(query = '?sort=name&limit=-1'): Promise<TestItem[]> {
  const response = await apiRequest<DirectusCollectionResponse<TestItem>>(
    'GET',
    `/items/${COLLECTION_NAME}${query}`
  );
  return unwrapItems(response);
}

export async function deleteTestItems(): Promise<void> {
  if (!(await collectionExists())) return;

  for (const item of await getTestItems()) {
    await apiRequest('DELETE', `/items/${COLLECTION_NAME}/${item.id}`);
  }
}

export async function deleteTestCollection(collection: string = COLLECTION_NAME): Promise<void> {
  if (!(await resourceExists(`/collections/${collection}`))) return;
  await apiRequest('DELETE', `/collections/${collection}`);
  logger.info(`Collection ${collection} deleted`);
}

export { COLLECTION_NAME };
