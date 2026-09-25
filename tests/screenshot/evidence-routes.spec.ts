import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { login, MAP_CANVAS, rowOf, waitForMapGrid } from '../e2e/helpers/mapgrid-page';
import {
  ensureRouteCollection,
  ensureRouteMapGrid,
  ROUTE_COLLECTION,
} from '../helpers/route-collection';
import { setupTestEnvironment } from '../setup';
import { buildStrip, evidencePath, shootTheSettledMap } from './helpers/frame-strip';

/**
 * Task-012's evidence, which is about the map moving again.
 *
 * No new element shows up on screen: what changed is that the composition
 * stopped freezing after the first fetch filtered by the visible area. A still
 * capture would show the world map at both moments, and the "before" would be
 * identical to the first frame of the "after" — no evidence at all. The strip
 * shows the itinerary: the whole world, Rio–São Paulo, and then Manaus–Belém,
 * which is the route **off screen**, the path that depends on fetching the
 * geometry from the API.
 *
 * It runs over the route collection, and not the README one, because the defect
 * only exists with native PostGIS geometry: that is what makes Directus filter
 * the fetch by the camera `bbox` and recount the items on every flight.
 */

const VIEWPORT = { height: 900, width: 1600 };
const ITINERARY = ['Rio → São Paulo', 'Manaus → Belém'];

test('records the row click strip with native geometry', async ({ browser }) => {
  const path = evidencePath('trajetos-geometria-nativa');
  test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');
  if (!path) return;

  await setupTestEnvironment();
  await ensureRouteCollection();
  await ensureRouteMapGrid();

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await login(page);
  await page.goto(`/admin/content/${ROUTE_COLLECTION}`);
  await waitForMapGrid(page);
  await expect(page.locator(MAP_CANVAS)).toBeVisible({ timeout: 30_000 });

  const frames = [await shootTheSettledMap(page)];
  for (const route of ITINERARY) {
    const row = rowOf(page, route);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    frames.push(await shootTheSettledMap(page));
  }

  /*
   * Two identical frames are not evidence, they are the same screen shot twice
   * — and that is exactly what the defect produced. The check only holds in the
   * "after": in the "before" the map really does not move, and that is the
   * point.
   */
  if (process.env.EVIDENCE_MOMENT === 'depois') {
    for (let i = 1; i < frames.length; i++) {
      expect(
        frames[i]?.equals(frames[i - 1] as Buffer),
        `the map did not move to ${ITINERARY[i - 1]}`
      ).toBe(false);
    }
  }

  const strip = await buildStrip(await context.newPage(), frames);
  await context.close();

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, strip);
});
