import { apiRequest } from './setup.js';
import { logger } from './test-logger.js';

const COLLECTION_NAME = 'test_mapgrid_items';

const TEST_ITEMS = [
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
  {
    name: 'Manaus',
    location: { type: 'Point', coordinates: [-60.0255, -3.119] },
    status: 'draft',
  },
];

function getToken(): string {
  return String(process.env.DIRECTUS_ACCESS_TOKEN);
}

export async function createTestCollection(): Promise<string> {
  logger.info('Creating test collection...');

  await apiRequest(
    'POST',
    '/collections',
    {
      collection: COLLECTION_NAME,
      schema: { schema: 'public', name: COLLECTION_NAME },
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
    },
    getToken(),
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (const action of ['create', 'read', 'update', 'delete']) {
    try {
      await apiRequest(
        'POST',
        '/permissions',
        {
          role: null,
          collection: COLLECTION_NAME,
          action,
          permissions: {},
          validation: {},
          presets: null,
          fields: ['*'],
        },
        getToken(),
      );
    } catch {
      // permissions might already exist
    }
  }

  logger.info(`Collection ${COLLECTION_NAME} created successfully`);
  return COLLECTION_NAME;
}

export async function populateTestItems(): Promise<void> {
  logger.info('Populating test items...');

  for (const item of TEST_ITEMS) {
    try {
      await apiRequest('POST', `/items/${COLLECTION_NAME}`, item, getToken());
    } catch (error) {
      logger.error('Failed to create test item:', error);
      throw error;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  logger.info(`Created ${TEST_ITEMS.length} test items`);
}

export async function deleteTestCollection(): Promise<void> {
  try {
    await apiRequest('DELETE', `/collections/${COLLECTION_NAME}`, undefined, getToken());
  } catch {
    // collection might not exist
  }
}

export { COLLECTION_NAME, TEST_ITEMS };
