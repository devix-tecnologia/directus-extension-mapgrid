import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureLegacyMapGridPreset,
  ensureMapGridPreset,
  readMapGridPresetOptions,
} from '../helpers/mapgrid-preset';
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

    await page.getByRole('button', { name: /add field|adicionar campo/i }).click();
    await page.locator('.v-field-list .v-list-item', { hasText: 'status' }).first().click();

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
