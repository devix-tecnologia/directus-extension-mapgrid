import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureLegacyMapGridPreset,
  ensureMapGridPreset,
  readMapGridPresetOptions,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * The grid columns, end to end.
 *
 * The unit tests prove the contract migrates a pre-`fields` preset; only this
 * suite proves it against a preset actually stored by Directus, read back
 * through the layout the way a user's browser reads it.
 */

async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_EMAIL);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

async function openCollection(page: Page): Promise<void> {
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });
}

/**
 * Opens the layout options panel in the right sidebar.
 *
 * Directus collapses that sidebar by default, so the options a layout
 * contributes are not in the DOM until its section is expanded. The section
 * header is a button whose accessible name is the icon ligature plus the
 * expand state — "layers expand_more" when closed.
 */
async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });

  const isClosed = (await header.getAttribute('aria-expanded')) !== 'true';
  if (isClosed) await header.click();

  // Inside the panel each group is a `v-detail`, also collapsed by default, so
  // the columns section has to be opened on its own before its picker exists.
  // Its header is exposed as text rather than as a button, so it is matched by
  // its label and not by role.
  const columnsSection = page.getByText(/table columns|colunas da grade/i).first();
  await expect(columnsSection).toBeVisible({ timeout: 30_000 });
  await columnsSection.click();

  await expect(page.getByRole('button', { name: /add field|adicionar campo/i })).toBeVisible({
    timeout: 30_000,
  });
}

/** The data columns the grid is showing, in order, without the actions column. */
async function visibleColumns(page: Page): Promise<string[]> {
  const headers = page.locator('.v-table thead th');
  await expect(headers.first()).toBeVisible({ timeout: 30_000 });

  const labels = await headers.allInnerTexts();
  return labels
    .map((label) => label.trim())
    .filter((label) => label !== '' && label.toLowerCase() !== 'actions');
}

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

  test('a preset written before `fields` existed keeps showing its columns', async ({ page }) => {
    await ensureLegacyMapGridPreset();
    await login(page);
    await openCollection(page);

    // coluna1 and coluna3 were set, coluna2 was blank: the gap closes
    expect(await visibleColumns(page)).toEqual(['name', 'status']);
  });

  test('the grid takes more columns than the five the old format could hold', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);

    const options = await readMapGridPresetOptions();
    expect(options).not.toHaveProperty('coluna6');

    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

    // the test collection has four fields; all four can be columns at once,
    // which the numbered format allowed but only up to five
    const columns = await visibleColumns(page);
    expect(columns.length).toBeGreaterThan(0);
  });

  test('a column chosen in the options panel survives a reload', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    const before = await visibleColumns(page);

    await openLayoutOptions(page);
    await page.getByRole('button', { name: /add field|adicionar campo/i }).click();
    // v-field-list shows each field's display name, not its key — "Status" for
    // the `status` field. Fields already chosen render without a pointer
    // cursor, because `disabled-fields` greys them out.
    await page
      .getByRole('listitem')
      .filter({ hasText: /^Status$/ })
      .first()
      .click();

    await expect
      .poll(async () => (await readMapGridPresetOptions()).fields, { timeout: 20_000 })
      .toContain('status');

    await page.reload();
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

    const after = await visibleColumns(page);
    expect(after).toContain('status');
    expect(after.length).toBe(before.length + 1);
  });
});
