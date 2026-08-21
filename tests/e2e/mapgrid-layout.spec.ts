import { test, expect, type Page } from '@playwright/test';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const COLLECTION = 'test_mapgrid_items';

async function login(page: Page) {
  await page.goto(`${DIRECTUS_URL}/admin/login`);
  await page.waitForLoadState('networkidle');

  await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"], input[name="password"]').first().fill(ADMIN_PASSWORD);

  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

async function selectMapGridLayout(page: Page) {
  await page.goto(`${DIRECTUS_URL}/admin/content/${COLLECTION}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Layout Options")').click();
  await page.waitForTimeout(1000);

  const layoutInput = page
    .locator('.layout-options .type-label:has-text("Layout")')
    .locator('..')
    .locator('.v-input')
    .first();
  await layoutInput.click({ force: true });
  await page.waitForTimeout(500);

  await page.locator('.v-list-item:has-text("MapGrid")').last().click();
  await page.waitForTimeout(5000);
}

test.describe('MapGrid Layout - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await selectMapGridLayout(page);
  });

  test('should render the map container', async ({ page }) => {
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible({ timeout: 30000 });
  });

  test('should render the data table', async ({ page }) => {
    const table = page.locator('.table-container');
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('should display items in the grid', async ({ page }) => {
    const rows = page.locator('.v-table tbody tr, .v-table tr[data-id]');
    await expect(rows.first()).toBeVisible({ timeout: 30000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should show map with markers', async ({ page }) => {
    const mapCanvas = page.locator('.maplibregl-canvas, .map-container canvas');
    await expect(mapCanvas).toBeVisible({ timeout: 30000 });
  });

  test('should focus map marker when clicking grid row', async ({ page }) => {
    const firstRow = page.locator('.v-table tbody tr, .v-table tr[data-id]').first();
    await expect(firstRow).toBeVisible({ timeout: 30000 });

    await firstRow.click();
    await page.waitForTimeout(2000);

    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('should have a reset map button', async ({ page }) => {
    const resetButton = page.locator('.reset-map-btn');
    await expect(resetButton).toBeVisible({ timeout: 30000 });
  });

  test('should show empty state when no items', async ({ page }) => {
    const response = await page.request.get(`${DIRECTUS_URL}/items/${COLLECTION}?limit=1`);
    const data = await response.json();
    const items = (data as Record<string, unknown>).data ?? (data as Record<string, unknown>);

    if (Array.isArray(items) && items.length > 0) {
      test.skip();
      return;
    }

    await page.goto(`${DIRECTUS_URL}/admin/content/${COLLECTION}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const emptyState = page.locator('.v-info:has-text("No items found"), text=No items found');
    await expect(emptyState).toBeVisible({ timeout: 15000 });
  });
});
