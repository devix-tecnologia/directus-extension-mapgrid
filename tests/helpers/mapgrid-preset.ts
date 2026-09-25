import { COLLECTION_NAME } from '../helper-collection';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from './directus-api';

export interface Preset {
  id?: string;
  user?: string | null;
  role?: string | null;
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
      /*
       * The columns are explicit on purpose.
       *
       * Without `fields`, the one choosing is the Directus tabular layout,
       * which shows every visible field of the collection — `status`
       * included. The spec that adds `status` through the header then started
       * with it already on screen and measured nothing. The seed now says
       * which state every spec starts from, instead of inheriting it from a
       * default of theirs that may change with the version.
       */
      fields: ['name', 'location'],
    },
  },
  layout_options: {
    mapgrid: {
      zoomOnClick: true,
    },
  },
});

/**
 * The same preset, with the map camera already pointed at a place.
 *
 * It exists because there is no way to find a marker on a MapLibre canvas
 * without knowing where the camera is, and the map instance belongs to the
 * Directus layout — unreachable from outside. By saying where the camera
 * starts, the projection becomes arithmetic: the seeded point lands at the
 * centre of the canvas, and the click has a sure target.
 *
 * Moving the camera through the interface does not work for this: writing
 * `cameraOptions` stores it in the preset but does not move the drawn map
 * (measured on 2026-09-24, see task-010).
 */
export const mapGridPresetCenteredOn = (
  collection: string,
  center: [number, number],
  zoom: number,
  options: Record<string, unknown> = {}
): Omit<Preset, 'id'> => {
  const preset = mapGridPresetFor(collection);
  return {
    ...preset,
    layout_options: {
      mapgrid: {
        ...preset.layout_options?.mapgrid,
        ...options,
        map: { geometryField: 'location', cameraOptions: { center, zoom } },
      },
    },
  };
};

export async function deleteAllPresetsFor(collection: string): Promise<void> {
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

/** The plain Directus map layout, without the MapGrid, to compare against it. */
export async function ensureMapLayoutPreset(collection: string): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', {
    collection,
    layout: 'map',
    layout_options: { map: { geometryField: 'location' } },
    layout_query: { map: {} },
  });
}

/** The seed preset, with the map camera already pointed at a place. */
export async function ensureMapGridPresetCenteredOn(
  center: [number, number],
  zoom: number,
  collection: string = COLLECTION_NAME,
  options: Record<string, unknown> = {}
): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', mapGridPresetCenteredOn(collection, center, zoom, options));
}

/*
 * Which preset Directus actually reads.
 *
 * The seed stores a global preset — no `user` and no `role`. When someone
 * changes a layout option through the interface, Directus does not edit that
 * global one: it creates a new preset, that person's only. Reading "the
 * collection's first preset" then returns the global one, frozen at whatever
 * the seed wrote, and the test concludes nothing was stored when in fact it was
 * stored in another row.
 *
 * The precedence is the same one Directus applies: the person's beats the
 * role's, which beats the global one.
 */
const presetPrecedence = (preset: Preset): number => {
  if (preset.user) return 2;
  if (preset.role) return 1;
  return 0;
};

async function readEffectivePreset(collection: string): Promise<Preset | undefined> {
  const query = `filter[collection][_eq]=${collection}&fields=id,user,role,layout_query,layout_options&limit=-1`;
  const response = await apiRequest<DirectusCollectionResponse<Preset>>('GET', `/presets?${query}`);

  return unwrapItems(response).sort((a, b) => presetPrecedence(b) - presetPrecedence(a))[0];
}

/** The layout query currently stored for a collection, where the columns live. */
export async function readMapGridPresetQuery(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const preset = await readEffectivePreset(collection);
  return preset?.layout_query?.mapgrid ?? {};
}

/** The layout options currently stored for a collection, as the API returns them. */
export async function readMapGridPresetOptions(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const preset = await readEffectivePreset(collection);
  return preset?.layout_options?.mapgrid ?? {};
}
