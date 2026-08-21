import { COLLECTION_NAME } from '../helper-collection.js';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from './directus-api.js';

export interface Preset {
  id?: string;
  collection: string;
  layout: 'mapgrid';
  layout_query?: Record<string, Record<string, unknown>>;
  layout_options?: Record<string, Record<string, unknown>>;
}

export const mapGridPresetFor = (collection: string): Omit<Preset, 'id'> => ({
  collection,
  layout: 'mapgrid',
  layout_query: {
    mapgrid: {
      page: 1,
      limit: 25,
      sort: ['name'],
    },
  },
  layout_options: {
    mapgrid: {
      zoomOnClick: true,
    },
  },
});

async function deleteAllPresetsFor(collection: string): Promise<void> {
  const query = `filter[collection][_eq]=${collection}&fields=id&limit=-1`;
  const response = await apiRequest<DirectusCollectionResponse<Pick<Preset, 'id'>>>(
    'GET',
    `/presets?${query}`
  );

  for (const preset of unwrapItems(response)) {
    await apiRequest('DELETE', `/presets/${preset.id}`);
  }
}

export async function ensureMapGridPreset(collection: string = COLLECTION_NAME): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', mapGridPresetFor(collection));
}
