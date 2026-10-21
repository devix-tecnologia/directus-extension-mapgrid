/** The handle between the map and the grid: dragged, kept, and reset. */
import { expect, type Page, test } from '@playwright/test';
import { ensureLprCollection, LPR_COLLECTION } from '../helpers/lpr-collection';
import { readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { openLpr } from './helpers/lpr-page';
import { GRID_PANE, MAP_PANE, waitForMapGrid } from './helpers/mapgrid-page';

const HANDLE = '[data-pane-splitter]';

const heightOf = async (page: Page, selector: string): Promise<number> =>
  (await page.locator(selector).boundingBox())?.height ?? 0;

/** Drags the handle so it sits at `fraction` of the container's height. */
const dragHandleTo = async (page: Page, fraction: number): Promise<void> => {
  const container = await page.locator('.mapgrid-container').boundingBox();
  const handle = await page.locator(HANDLE).boundingBox();
  if (!container || !handle) throw new Error('The composition is not on screen');
  const x = handle.x + handle.width / 2;
  await page.mouse.move(x, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, container.y + container.height * fraction, { steps: 10 });
  await page.mouse.up();
};

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — sharing the height between map and grid', () => {
  test('dragging the handle gives the grid more room, and it is still there after a reload', async ({
    page,
  }) => {
    await openLpr(page, { options: { cameraTracking: 'off' } });
    const gridBefore = await heightOf(page, GRID_PANE);
    const mapBefore = await heightOf(page, MAP_PANE);

    await dragHandleTo(page, 0.35);

    await expect.poll(() => heightOf(page, GRID_PANE)).toBeGreaterThan(gridBefore * 1.3);
    expect(await heightOf(page, MAP_PANE)).toBeLessThan(mapBefore);
    await expect
      .poll(async () => (await readMapGridPresetOptions(LPR_COLLECTION)).mapShare)
      .toBeCloseTo(0.35, 1);

    const gridAfterDrag = await heightOf(page, GRID_PANE);
    await page.reload();
    await waitForMapGrid(page);
    await expect.poll(() => heightOf(page, GRID_PANE)).toBeCloseTo(gridAfterDrag, -1);
  });

  test('a double click puts the default back', async ({ page }) => {
    await openLpr(page, { options: { cameraTracking: 'off', mapShare: 0.3 } });

    await page.locator(HANDLE).dblclick();

    await expect
      .poll(async () => (await readMapGridPresetOptions(LPR_COLLECTION)).mapShare)
      .toBe(0.6);
  });
});
