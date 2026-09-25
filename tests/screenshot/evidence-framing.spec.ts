import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { login, rowOf, waitForMapGrid } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCenteredOn } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { buildStrip, evidencePath, shootTheSettledMap } from './helpers/frame-strip';

const BRASILIA: [number, number] = [-47.9292, -15.7801];
const CITY_ZOOM = 9;
const ITINERARY = ['Manaus', 'Recife', 'Curitiba'];
const VIEWPORT = { width: 1600, height: 900 };

const CASES = [
  { label: 'enquadramento-mantendo-o-zoom', zoomOnClick: false },
  { label: 'enquadramento-aproximando', zoomOnClick: true },
];

for (const { label, zoomOnClick } of CASES) {
  test(`records the row click strip — ${label}`, async ({ browser }) => {
    const path = evidencePath(label);
    test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');
    if (!path) return;

    await setupTestEnvironment();
    await ensureMapGridPresetCenteredOn(BRASILIA, CITY_ZOOM, COLLECTION_NAME, { zoomOnClick });

    const context = await browser.newContext({
      recordVideo: { dir: 'test-results/video-evidencia', size: VIEWPORT },
      viewport: VIEWPORT,
    });
    const page = await context.newPage();

    await login(page);
    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await waitForMapGrid(page);
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const frames = [await shootTheSettledMap(page)];
    for (const city of ITINERARY) {
      const row = rowOf(page, city);
      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.click();
      await page.waitForTimeout(1_000);
      frames.push(await shootTheSettledMap(page));
    }

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
}
