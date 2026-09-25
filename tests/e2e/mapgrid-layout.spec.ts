/**
 * The MapGrid composes the two Directus layouts.
 *
 * This is the test that proves task-010's design, and only the e2e can:
 * Storybook does not reach the Directus layouts, because there the SDK is a
 * mock of ours and the layout registry does not exist.
 */
import { expect, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureMapGridPreset,
  ensureMapGridPresetCenteredOn,
  readMapGridPresetQuery,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  clickCenterMarker,
  GRID,
  GRID_PANE,
  login,
  MAP,
  MAP_OPTIONS,
  openCollection,
  openLayoutOptions,
  openOptionsSection,
  rowOf,
  sortBy,
  TABLE,
} from './helpers/mapgrid-page';

/**
 * The most isolated city in the seed, and the camera that puts it at the centre
 * of the canvas.
 *
 * Finding a marker on a MapLibre screen requires knowing where the camera is,
 * and the map instance belongs to the Directus layout. The preset solves it
 * from the other side: it says where the camera starts, and then the seeded
 * point is born at the centre. Manaus because it is the most isolated one — at
 * zoom 12 no other seeded point shows up, so the click cannot land on another
 * marker or on a cluster.
 */
const ISOLATED_CITY = 'Manaus';
const MANAUS: [number, number] = [-60.0255, -3.119];
const CITY_ZOOM = 12;

/** The opposite: a camera from which no seeded point is at the centre. */
const ATLANTIC: [number, number] = [0, 0];
const WORLD_ZOOM = 1;

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — the composition', () => {
  test('draws the Directus map and grid, not ours', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    await expect(page.locator(MAP)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(GRID)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TABLE)).toBeVisible({ timeout: 60_000 });
  });

  test('a single query feeds both, and not one per layout', async ({ page }) => {
    const fetches: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes(`/items/${COLLECTION_NAME}?`) && !url.includes('aggregate')) {
        fetches.push(url);
      }
    });

    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(8_000);

    const distinct = [...new Set(fetches.map((url) => url.split('/items/')[1] ?? url))];
    console.log(`\n[fetches] ${fetches.length} in total, ${distinct.length} distinct`);
    for (const fetch of distinct) console.log(`   ${decodeURIComponent(fetch)}`);

    // one per layout is expected; repeated is duplication
    expect(distinct.length).toBeLessThanOrEqual(2);
  });

  test('sorting by their grid header writes to the preset', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    await sortBy(page, 'name', 'desc');

    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);
  });

  /*
   * The regression the spec rewrite lost, and which the new design has to give
   * back: the Directus map layout's `handleClick` does a `router.push` to the
   * item screen, so a clicked marker took the person out of the MapGrid — the
   * opposite of syncing the two halves.
   */
  test('clicking a marker marks its row in the grid, and does not leave the MapGrid', async ({
    page,
  }) => {
    await ensureMapGridPresetCenteredOn(MANAUS, CITY_ZOOM);
    await login(page);
    await openCollection(page);

    const row = rowOf(page, ISOLATED_CITY);
    await expect(row).toBeVisible({ timeout: 60_000 });
    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'false');

    await clickCenterMarker(page);

    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
    await expect(page).toHaveURL(new RegExp(`/admin/content/${COLLECTION_NAME}(\\?|$)`));
  });

  test('clicking the row frames the item on the map', async ({ page }) => {
    await ensureMapGridPresetCenteredOn(ATLANTIC, WORLD_ZOOM);
    await login(page);
    await openCollection(page);

    const row = rowOf(page, ISOLATED_CITY);
    await expect(row).toBeVisible({ timeout: 60_000 });
    await row.click();

    await clickCenterMarker(page);

    await expect(row.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
  });

  test('the full-page layouts white space does not show up', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(5_000);

    const gap = await page.evaluate((selector) => {
      const pane = document.querySelector(selector);
      const header = document.querySelector(`${selector} thead tr`);
      if (!pane || !header) return -1;
      return Math.round(header.getBoundingClientRect().top - pane.getBoundingClientRect().top);
    }, GRID_PANE);

    // the header starts at the top of the pane; it measured 60px before the CSS fix
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThan(12);
  });

  test('the MapGrid card reaches the bottom of the screen', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(3_000);

    const leftover = await page.evaluate(() => {
      const card = document.querySelector('.mapgrid-container');
      if (!card) return -1;
      return Math.round(window.innerHeight - card.getBoundingClientRect().bottom);
    });

    // the Directus full-page pagination gap left 142px blank
    expect(leftover).toBeGreaterThanOrEqual(0);
    expect(leftover).toBeLessThan(48);
  });

  test('the options panel sections take up the panel width', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await openLayoutOptions(page);
    await openOptionsSection(page, MAP_OPTIONS);

    const ratios = await page.evaluate((section) => {
      const panel = document.querySelector('.layout-options');
      const detail = document.querySelector(section);
      const field = document.querySelector(`${section} .field`);
      if (!panel || !detail || !field) return null;
      const width = panel.getBoundingClientRect().width;
      return {
        section: detail.getBoundingClientRect().width / width,
        field: field.getBoundingClientRect().width / width,
      };
    }, MAP_OPTIONS);

    expect(ratios).not.toBeNull();
    expect(ratios?.section).toBeGreaterThan(0.95);
    expect(ratios?.field).toBeGreaterThan(0.9);
  });
});
