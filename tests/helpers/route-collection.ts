import type { DirectusCollectionResponse } from './directus-api';
import { apiRequest, resourceExists, unwrapItems } from './directus-api';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const ROUTE_COLLECTION = 'test_mapgrid_routes';

type LngLat = [number, number];

export const ROUTES: { name: string; route: { type: 'LineString'; coordinates: LngLat[] } }[] = [
  {
    name: 'Rio → São Paulo',
    route: {
      coordinates: [
        [-43.1729, -22.9068],
        [-44.5, -23.0],
        [-46.6333, -23.5505],
      ],
      type: 'LineString',
    },
  },
  {
    name: 'Manaus → Belém',
    route: {
      coordinates: [
        [-60.0255, -3.119],
        [-55.0, -2.5],
        [-48.5044, -1.4558],
      ],
      type: 'LineString',
    },
  },
];

/** A collection with native PostGIS geometry, which the map layout treats differently from json. */
export async function ensureRouteCollection(): Promise<void> {
  if (!(await resourceExists(`/collections/${ROUTE_COLLECTION}`))) {
    await apiRequest('POST', '/collections', {
      collection: ROUTE_COLLECTION,
      fields: [
        {
          field: 'id',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { has_auto_increment: true, is_primary_key: true },
          type: 'integer',
        },
        { field: 'name', meta: { interface: 'input' }, schema: {}, type: 'string' },
        { field: 'route', meta: { interface: 'map' }, schema: {}, type: 'geometry.LineString' },
      ],
      meta: { icon: 'route' },
      schema: {},
    });
  }

  const existing = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: number }>>(
      'GET',
      `/items/${ROUTE_COLLECTION}?fields=id&limit=-1`
    )
  );
  if (existing.length < ROUTES.length) {
    await apiRequest('POST', `/items/${ROUTE_COLLECTION}`, ROUTES);
  }
}

/**
 * The MapGrid over the routes, without zooming in on click. No seeded camera:
 * with native geometry Directus reads `cameraOptions.bbox` to filter by the
 * visible area, and a camera with no `bbox` takes the layout down.
 */
export async function ensureRouteMapGrid(): Promise<void> {
  await deleteAllPresetsFor(ROUTE_COLLECTION);
  await apiRequest('POST', '/presets', {
    collection: ROUTE_COLLECTION,
    layout: 'mapgrid',
    layout_options: {
      mapgrid: {
        map: { geometryField: 'route' },
        zoomOnClick: false,
      },
    },
    layout_query: { mapgrid: { fields: ['name'], limit: 25, page: 1, sort: ['name'] } },
  });
}
