import type { Page } from '@playwright/test';
import { apiRequest } from './directus-api';

export const TEST_BASEMAP = 'MapGrid test map';
export const TEST_ATTRIBUTION = '© MapGrid test tiles';
const TILE_HOST = 'https://tiles.mapgrid.test';

/** A 1×1 PNG: enough for MapLibre to decode the tile. */
const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

/** A raster basemap in Project Settings, served by a host the test intercepts. */
export async function configureProjectBasemap(): Promise<void> {
  await apiRequest('PATCH', '/settings', {
    basemaps: [
      {
        attribution: TEST_ATTRIBUTION,
        name: TEST_BASEMAP,
        tileSize: 256,
        type: 'raster',
        url: `${TILE_HOST}/{z}/{x}/{y}.png`,
      },
    ],
  });
}

export async function removeProjectBasemaps(): Promise<void> {
  await apiRequest('PATCH', '/settings', { basemaps: null });
}

/** Answers the test basemap's tiles and returns how many were requested so far. */
export async function serveTestTiles(page: Page): Promise<() => number> {
  let requests = 0;
  await page.route(`${TILE_HOST}/**`, async (route) => {
    requests += 1;
    await route.fulfill({ body: TILE, contentType: 'image/png' });
  });
  return () => requests;
}
