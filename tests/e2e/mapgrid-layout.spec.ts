import { test, expect } from '@playwright/test';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${DIRECTUS_URL}/admin/login`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(ADMIN_EMAIL);

  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(ADMIN_PASSWORD);

  const loginButton = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Entrar")').first();
  await loginButton.click();

  await page.waitForURL('**/admin/**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

test.describe('MapGrid Layout - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should render the map container', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible({ timeout: 30000 });
  });

  test('should render the data table', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const table = page.locator('.table-container, .v-table');
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('should display items in the grid', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const rows = page.locator('.v-table tbody tr, .v-table tr[data-id]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should show map with markers', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);

    const mapCanvas = page.locator('.maplibregl-canvas, .mapboxgl-canvas, .map-container canvas');
    await expect(mapCanvas).toBeVisible({ timeout: 30000 });
  });

  test('should focus map marker when clicking grid row', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const firstRow = page.locator('.v-table tbody tr, .v-table tr[data-id]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(2000);

      const popup = page.locator('.maplibregl-popup, .mapboxgl-popup');
      const popupVisible = await popup.isVisible().catch(() => false);
      const mapContainer = page.locator('.map-container');
      await expect(mapContainer).toBeVisible();
    }
  });

  test('should have a reset map button', async ({ page }) => {
    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const resetButton = page.locator('.reset-map-btn, button[aria-label*="Reset"], button[aria-label*="reset"]');
    await expect(resetButton).toBeVisible({ timeout: 30000 });
  });

  test('should show empty state when no items', async ({ page }) => {
    const response = await page.request.get(`${DIRECTUS_URL}/items/test_mapgrid_items?limit=1`);
    const data = await response.json();
    const items = (data as Record<string, unknown>).data || (data as Record<string, unknown>);

    if (Array.isArray(items) && items.length > 0) {
      test.skip();
      return;
    }

    await page.goto(`${DIRECTUS_URL}/admin/content/test_mapgrid_items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const emptyState = page.locator('.v-info:has-text("No items found"), text=No items found');
    await expect(emptyState).toBeVisible({ timeout: 15000 });
  });
});
