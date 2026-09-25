import { expect, test } from '@playwright/test';
import { readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import {
  ensureRouteCollection,
  ensureRouteMapGrid,
  ROUTE_COLLECTION,
} from '../helpers/route-collection';
import { setupTestEnvironment } from '../setup';
import { login, rowOf, waitForMapGrid } from './helpers/mapgrid-page';

type BoundingBox = [number, number, number, number];

const RIO_SAO_PAULO: BoundingBox = [-46.6333, -23.5505, -43.1729, -22.9068];
const MANAUS_BELEM: BoundingBox = [-60.0255, -3.119, -48.5044, -1.4558];
const WHOLE_COLLECTION: BoundingBox = [-60.0255, -23.5505, -43.1729, -1.4558];

const contains = (outer: BoundingBox, inner: BoundingBox): boolean =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3];

async function visibleArea(): Promise<BoundingBox | null> {
  const options = await readMapGridPresetOptions(ROUTE_COLLECTION);
  const bbox = (options.map as { cameraOptions?: { bbox?: unknown } } | undefined)?.cameraOptions
    ?.bbox;
  return Array.isArray(bbox) && bbox.length === 4 ? (bbox as BoundingBox) : null;
}

test.describe('MapGrid — routes with native geometry', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
    await ensureRouteCollection();
  });

  test.beforeEach(async ({ page }) => {
    await ensureRouteMapGrid();
    await login(page);
    await page.goto(`/admin/content/${ROUTE_COLLECTION}`);
    await waitForMapGrid(page);
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('clicking a LineString row frames the whole route, and not its first vertex', async ({
    page,
  }) => {
    await rowOf(page, 'Rio → São Paulo').click();

    await expect
      .poll(
        async () => {
          const visible = await visibleArea();
          return (
            visible !== null && contains(visible, RIO_SAO_PAULO) && visible[2] - visible[0] < 15
          );
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });

  test('resetting the view with native geometry goes back to the whole collection right away', async ({
    page,
  }) => {
    await rowOf(page, 'Rio → São Paulo').click();
    await expect
      .poll(
        async () => {
          const visible = await visibleArea();
          return visible !== null && !contains(visible, WHOLE_COLLECTION);
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    await page.locator('.reset-map-btn').click();

    await expect
      .poll(
        async () => {
          const visible = await visibleArea();
          return visible !== null && contains(visible, WHOLE_COLLECTION);
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });

  test('clicking a row whose route is off screen takes the map to it', async ({ page }) => {
    // with native geometry Directus only fetches what falls in the visible area
    await rowOf(page, 'Rio → São Paulo').click();
    await expect
      .poll(
        async () => {
          const visible = await visibleArea();
          return visible !== null && !contains(visible, MANAUS_BELEM);
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    await rowOf(page, 'Manaus → Belém').click();

    await expect
      .poll(
        async () => {
          const visible = await visibleArea();
          return visible !== null && contains(visible, MANAUS_BELEM);
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });
});
