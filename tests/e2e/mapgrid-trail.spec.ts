/** Task 020: the trail of the visited records, with the direction legible along it. */
import { expect, type Page, test } from '@playwright/test';
import { ensureLprCollection } from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { cameraOn, expectCurrent, openLpr, pagePointOf, waitForMarkerAt } from './helpers/lpr-page';
import { control, MAP_PANE, sortBy } from './helpers/mapgrid-page';

const trailSegments = async (page: Page): Promise<number> => {
  const trail = page.locator(`${MAP_PANE} [data-trail]`);
  if ((await trail.count()) === 0) return 0;
  return Number(await trail.getAttribute('data-trail-segments'));
};

/** Over the first trip's start, so its first readings are all on screen. */
const camera = cameraOn('LPR-22283', 13);

const openWithTrail = (page: Page) =>
  openLpr(page, {
    options: {
      trailLength: 20,
      cameraTracking: 'off',
      map: { geometryField: 'location', cameraOptions: camera },
    },
    query: { limit: 3 },
  });

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — the trail', () => {
  test('joins four steps across the page turn', async ({ page }) => {
    await openWithTrail(page);

    for (const _ of [1, 2, 3, 4]) await control(page, 'next').click();
    // the fourth reading is the first of page two: the turn happened
    await expectCurrent(page, 'LPR-22301');

    await expect.poll(() => trailSegments(page), { timeout: 15_000 }).toBe(3);
  });

  test('leaves the markers clickable under it', async ({ page }) => {
    await openWithTrail(page);
    for (const _ of [1, 2, 3]) await control(page, 'next').click();
    await expectCurrent(page, 'VTR-1203');

    const at = await pagePointOf(page, camera, 'LPR-22283');
    await waitForMarkerAt(page, at);
    await page.mouse.click(at.x, at.y);

    await expectCurrent(page, 'LPR-22283');
  });

  test('starts over when the grid is sorted by another column', async ({ page }) => {
    await openWithTrail(page);
    for (const _ of [1, 2, 3]) await control(page, 'next').click();
    await expect.poll(() => trailSegments(page), { timeout: 15_000 }).toBe(2);

    await sortBy(page, 'plate', 'asc');

    await expect.poll(() => trailSegments(page), { timeout: 15_000 }).toBe(0);
  });
});
