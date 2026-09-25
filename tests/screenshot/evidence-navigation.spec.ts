/**
 * The evidence for task-006: the controls exist on screen, and walking the
 * records moves both halves.
 *
 * Two captures, because one image cannot say both things. The first is the
 * whole composition, where the toolbar and the marked row are readable. The
 * second is a strip of the map pane at each step — a camera flight does not fit
 * in a single frame.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { control, currentRecord, login, waitForMapGrid } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { buildStrip, evidencePath, shootTheSettledMap } from './helpers/frame-strip';

const VIEWPORT = { width: 1600, height: 900 };
const STEPS = 3;

const write = (path: string, image: Buffer): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, image);
};

test('records the navigation controls and the walk', async ({ browser }) => {
  const composition = evidencePath('composicao');
  const walk = evidencePath('percurso');
  test.skip(
    !composition,
    'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT'
  );
  if (!composition || !walk) return;

  await setupTestEnvironment();
  await ensureMapGridPreset(COLLECTION_NAME, {
    options: { cameraTracking: 'center', zoomOnClick: true },
    query: { limit: 3 },
  });

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await waitForMapGrid(page);
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const frames = [await shootTheSettledMap(page)];
  for (let step = 0; step < STEPS; step++) {
    await control(page, 'next').click();
    await expect.poll(() => currentRecord(page), { timeout: 30_000 }).not.toBe('');
    await page.waitForTimeout(1_000);
    frames.push(await shootTheSettledMap(page));
  }

  write(composition, await page.screenshot({ quality: 80, type: 'jpeg' }));

  if (process.env.EVIDENCE_MOMENT === 'depois') {
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]?.equals(frames[i - 1] as Buffer), `step ${i} did not move the map`).toBe(
        false
      );
    }
  }

  write(walk, await buildStrip(await context.newPage(), frames));
  await context.close();
});
