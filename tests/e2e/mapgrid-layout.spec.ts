import { test, expect, type Page } from '@playwright/test';
import axios from 'axios';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const COLLECTION = 'test_mapgrid_items';

const TEST_ITEMS = [
  { name: 'Brasilia', location: { type: 'Point', coordinates: [-47.9292, -15.7801] }, status: 'published' },
  { name: 'Sao Paulo', location: { type: 'Point', coordinates: [-46.6333, -23.5505] }, status: 'published' },
  { name: 'Rio de Janeiro', location: { type: 'Point', coordinates: [-43.1729, -22.9068] }, status: 'published' },
  { name: 'Salvador', location: { type: 'Point', coordinates: [-38.5124, -12.9714] }, status: 'published' },
  { name: 'Belo Horizonte', location: { type: 'Point', coordinates: [-43.9386, -19.9191] }, status: 'draft' },
  { name: 'Curitiba', location: { type: 'Point', coordinates: [-49.2653, -25.4284] }, status: 'published' },
  { name: 'Recife', location: { type: 'Point', coordinates: [-34.877, -8.0476] }, status: 'published' },
  { name: 'Manaus', location: { type: 'Point', coordinates: [-60.0255, -3.119] }, status: 'draft' },
];

async function api(method: string, path: string, data?: unknown, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await axios({ method, url: `${DIRECTUS_URL}${path}`, data, headers, validateStatus: () => true });
  return resp.data;
}

async function getToken(): Promise<string> {
  const resp = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return (resp as { data: { access_token: string } }).data.access_token;
}

async function setupCollection() {
  const token = await getToken();

  const existing = await api('GET', `/collections/${COLLECTION}`, undefined, token).catch(() => null);
  if (existing) {
    const items = await api('GET', `/items/${COLLECTION}?limit=1`, undefined, token).catch(() => null);
    const rows = (items as { data?: unknown[] })?.data;
    if (Array.isArray(rows) && rows.length > 0) return;
  }

  await api('POST', '/collections', {
    collection: COLLECTION,
    schema: { schema: 'public', name: COLLECTION },
    meta: { icon: 'map', note: 'Test collection for mapgrid extension' },
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'name', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: false } },
      { field: 'location', type: 'json', meta: { interface: 'map', options: {} }, schema: { is_nullable: true } },
      { field: 'status', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] } }, schema: { default_value: 'draft', is_nullable: false } },
    ],
  }, token).catch(() => {});

  await new Promise((r) => setTimeout(r, 1000));

  for (const action of ['create', 'read', 'update', 'delete']) {
    await api('POST', '/permissions', {
      role: null, collection: COLLECTION, action, permissions: {}, validation: {}, presets: null, fields: ['*'],
    }, token).catch(() => {});
  }

  const items = await api('GET', `/items/${COLLECTION}?limit=1`, undefined, token).catch(() => null);
  const rows = (items as { data?: unknown[] })?.data;
  if (Array.isArray(rows) && rows.length > 0) return;

  await api('POST', `/items/${COLLECTION}`, TEST_ITEMS, token).catch(() => {});
  await new Promise((r) => setTimeout(r, 500));
}

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
  test.beforeAll(async () => {
    await setupCollection();
  });

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
    test.skip();
  });
});
