/** A synthetic tracking route of a thousand points, in the order they happened. */
import {
  apiRequest,
  type DirectusCollectionResponse,
  resourceExists,
  unwrapItems,
} from './directus-api';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const TRACK_COLLECTION = 'test_mapgrid_track';
export const TRACK_SIZE = 1_000;
export const TRACK_PAGE_SIZE = 25;

/** Curitiba to São Paulo, in a straight line — the shape does not matter, the count does. */
const FROM: [number, number] = [-49.2653, -25.4284];
const TO: [number, number] = [-46.6333, -23.5505];

const trackItems = (): Record<string, unknown>[] =>
  Array.from({ length: TRACK_SIZE }, (_, index) => {
    const fraction = index / (TRACK_SIZE - 1);
    return {
      location: {
        coordinates: [
          FROM[0] + (TO[0] - FROM[0]) * fraction,
          FROM[1] + (TO[1] - FROM[1]) * fraction,
        ],
        type: 'Point',
      },
      name: `Point ${String(index + 1).padStart(4, '0')}`,
      sequence: index + 1,
    };
  });

const countTrackItems = async (): Promise<number> => {
  const response = await apiRequest<DirectusCollectionResponse<{ id: number }>>(
    'GET',
    `/items/${TRACK_COLLECTION}?fields=id&limit=-1`
  );
  return unwrapItems(response).length;
};

/** The geometry is `json`, as in the seeded collection: with a native one the map adds a filter by the visible area, and the count would be another. */
export async function ensureTrackCollection(): Promise<void> {
  if (!(await resourceExists(`/collections/${TRACK_COLLECTION}`))) {
    await apiRequest('POST', '/collections', {
      collection: TRACK_COLLECTION,
      fields: [
        {
          field: 'id',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { has_auto_increment: true, is_primary_key: true },
          type: 'integer',
        },
        { field: 'name', meta: { interface: 'input' }, schema: {}, type: 'string' },
        { field: 'sequence', meta: { interface: 'input' }, schema: {}, type: 'integer' },
        { field: 'location', meta: { interface: 'map' }, schema: {}, type: 'json' },
      ],
      meta: { icon: 'route', note: 'Synthetic tracking route for the page-turn measurement' },
      schema: {},
    });
  }

  if ((await countTrackItems()) >= TRACK_SIZE) return;

  const items = trackItems();
  for (let at = 0; at < items.length; at += 250) {
    await apiRequest('POST', `/items/${TRACK_COLLECTION}`, items.slice(at, at + 250));
  }
}

/** The MapGrid over the route, sorted by sequence; `query` overrides the shared query. */
export async function ensureTrackMapGrid(
  options: Record<string, unknown> = {},
  query: Record<string, unknown> = {}
): Promise<void> {
  await deleteAllPresetsFor(TRACK_COLLECTION);
  await apiRequest('POST', '/presets', {
    collection: TRACK_COLLECTION,
    layout: 'mapgrid',
    layout_options: {
      mapgrid: {
        cameraTracking: 'off',
        map: { geometryField: 'location' },
        zoomOnClick: false,
        ...options,
      },
    },
    layout_query: {
      mapgrid: {
        fields: ['name', 'sequence'],
        limit: TRACK_PAGE_SIZE,
        page: 1,
        sort: ['sequence'],
        ...query,
      },
    },
  });
}
