/**
 * Task-015's evidence: the current record visible on the map with the
 * clustering on.
 *
 * The camera is seeded wide on purpose. Fitting the collection spreads the
 * eight cities across the pane and no cluster forms — the very thing the
 * evidence is about would not be on screen. At zoom 3 the southeast cities
 * fall inside the 50px the MapLibre clustering groups by.
 *
 * The camera tracking is `off` for the same reason: the cluster has to stay
 * where it is between frames, so what moves in the strip is the mark and not
 * the map.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  control,
  currentRecord,
  login,
  MAP_CANVAS,
  waitForMapGrid,
} from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { buildStrip, evidencePath, shootTheSettledMap } from './helpers/frame-strip';

const VIEWPORT = { height: 900, width: 1600 };
const SOUTHEAST: [number, number] = [-47, -20];
const WIDE_ZOOM = 3;
const STEPS = 3;

const write = (path: string, image: Buffer): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, image);
};

test('records the current record standing out of the cluster', async ({ browser }) => {
  const composition = evidencePath('agrupamento');
  const walk = evidencePath('agrupamento-percurso');
  test.skip(
    !composition,
    'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT'
  );
  if (!composition || !walk) return;

  await setupTestEnvironment();
  await ensureMapGridPreset(COLLECTION_NAME, {
    options: {
      cameraTracking: 'off',
      map: {
        cameraOptions: { center: SOUTHEAST, zoom: WIDE_ZOOM },
        clusterData: true,
        geometryField: 'location',
      },
      zoomOnClick: false,
    },
    query: { limit: 8 },
  });

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await waitForMapGrid(page);
  await expect(page.locator(MAP_CANVAS)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3_000);

  // the first frame has no current record: the cluster alone, which is what used to swallow it
  const frames = [await shootTheSettledMap(page)];
  for (let step = 0; step < STEPS; step++) {
    await control(page, 'next').click();
    await expect.poll(() => currentRecord(page), { timeout: 30_000 }).not.toBe('');
    await page.waitForTimeout(1_000);
    frames.push(await shootTheSettledMap(page));
  }

  write(composition, await page.screenshot({ quality: 80, type: 'jpeg' }));

  if (process.env.EVIDENCE_MOMENT === 'depois') {
    for (let frame = 1; frame < frames.length; frame++) {
      expect(
        frames[frame]?.equals(frames[frame - 1] as Buffer),
        `step ${frame} drew the same map as the one before it`
      ).toBe(false);
    }
  }

  write(walk, await buildStrip(await context.newPage(), frames));
  await context.close();
});
