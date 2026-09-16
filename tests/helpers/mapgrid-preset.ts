import { COLLECTION_NAME } from '../helper-collection';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from './directus-api';

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

/**
 * A preset in the shape written before `fields` existed: the grid columns live
 * in five numbered keys. Used to prove that a collection configured by an
 * earlier version of the extension still shows its columns.
 */
export const legacyMapGridPresetFor = (collection: string): Omit<Preset, 'id'> => ({
  collection,
  layout: 'mapgrid',
  layout_query: { mapgrid: { page: 1, limit: 25, sort: ['name'] } },
  layout_options: {
    mapgrid: {
      zoomOnClick: true,
      geolocation: 'location',
      title: '{{name}}',
      // deliberately leaves coluna2 blank: the gap has to close, not render
      coluna1: 'name',
      coluna3: 'status',
    },
  },
});

/** Replaces the collection's preset with one in the pre-`fields` format. */
export async function ensureLegacyMapGridPreset(
  collection: string = COLLECTION_NAME
): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', legacyMapGridPresetFor(collection));
}

/** The layout query currently stored for a collection, where the columns live. */
export async function readMapGridPresetQuery(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const query = `filter[collection][_eq]=${collection}&fields=layout_query&limit=1`;
  const response = await apiRequest<DirectusCollectionResponse<Pick<Preset, 'layout_query'>>>(
    'GET',
    `/presets?${query}`
  );

  const [preset] = unwrapItems(response);
  return preset?.layout_query?.mapgrid ?? {};
}

/** The layout options currently stored for a collection, as the API returns them. */
export async function readMapGridPresetOptions(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const query = `filter[collection][_eq]=${collection}&fields=layout_options&limit=1`;
  const response = await apiRequest<DirectusCollectionResponse<Pick<Preset, 'layout_options'>>>(
    'GET',
    `/presets?${query}`
  );

  const [preset] = unwrapItems(response);
  return preset?.layout_options?.mapgrid ?? {};
}
