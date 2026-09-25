/**
 * The grid columns, end to end.
 *
 * After task-010 what draws the grid is the Directus tabular layout, and the
 * columns still come out of `layoutQuery.fields` — the contract task-005
 * established and that they read natively. That is what this suite measures:
 * the choice made in their header reaches the preset and comes back from it.
 *
 * The selectors are the ones in `helpers/mapgrid-page.ts`. No spec talks about
 * `.map-container` or `.v-table` again, which left with our components.
 */
import { expect, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureMapGridPreset,
  readMapGridPresetOptions,
  readMapGridPresetQuery,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  ADD_FIELD,
  columnCell,
  login,
  openCollection,
  sortBy,
  visibleColumns,
  waitForMapGrid,
} from './helpers/mapgrid-page';

test.describe('MapGrid sorting', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await ensureMapGridPreset();
  });

  test('sorting by the header reorders the rows, and the choice is stored', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    // the preset seeds sort by `name` ascending, so the first row is the first
    // one in alphabetical order
    const ascending = (await (await columnCell(page, 'name')).innerText()).trim();

    await sortBy(page, 'name', 'desc');

    await expect
      .poll(async () => (await (await columnCell(page, 'name')).innerText()).trim(), {
        timeout: 20_000,
      })
      .not.toBe(ascending);

    /*
     * Check the preset before reloading. The Directus write is debounced:
     * reloading as soon as the screen changes gets there before it happens, and
     * the test would report as lost what had merely not been stored yet.
     */
    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);

    // and it survives the reload, which is what writing to `layoutQuery` buys
    const descending = (await (await columnCell(page, 'name')).innerText()).trim();
    await page.reload();
    await waitForMapGrid(page);

    expect((await (await columnCell(page, 'name')).innerText()).trim()).toBe(descending);
  });
});

test.describe('MapGrid columns', () => {
  /*
   * The api helpers keep the access token in a module-level variable, and
   * Playwright runs globalSetup in a separate process from the workers — so the
   * token that global setup obtained is not visible here. Any spec that calls
   * the Directus API from inside a test has to authenticate on its own.
   */
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  /*
   * These tests rewrite the collection's preset, which every spec shares — the
   * global setup seeds one and the layout spec depends on it. Without putting it
   * back, the sibling spec runs against whatever preset was left behind and
   * fails for reasons that have nothing to do with it.
   */
  test.afterAll(async () => {
    await ensureMapGridPreset();
  });

  test('the grid takes more columns than the five the old format could hold', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);

    const options = await readMapGridPresetOptions();
    expect(options).not.toHaveProperty('coluna6');

    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await waitForMapGrid(page);

    // the test collection has four fields; all four can be columns at once,
    // which the numbered format allowed but only up to five
    const columns = await visibleColumns(page);
    expect(columns.length).toBeGreaterThan(0);
  });

  test('picking a field in the header changes the grid, and survives the reload', async ({
    page,
  }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    const before = await visibleColumns(page);
    expect(before).not.toContain('status');

    // the header's `+` and the field picker belong to their tabular layout
    await page.locator(ADD_FIELD).first().click();
    await page
      .getByRole('listitem')
      .filter({ hasText: /^Status$/ })
      .first()
      .click();

    await expect.poll(async () => visibleColumns(page), { timeout: 20_000 }).toContain('status');

    /*
     * And here is the gain of the choice living in the header: it is written by
     * the layout component, in `layoutQuery.fields`, and not by the options
     * panel. The preset first, the screen after: if only the second fails, the
     * defect is in the reading, not in the write.
     */
    await expect
      .poll(async () => (await readMapGridPresetQuery()).fields, { timeout: 20_000 })
      .toContain('status');

    await page.reload();
    await waitForMapGrid(page);

    expect(await visibleColumns(page)).toContain('status');
  });
});
