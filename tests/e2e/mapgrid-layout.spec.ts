import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection.js';
import { testEnv } from '../test-env.js';
import { type CameraState, projectToScreenPoint } from './helpers/map-projection.js';

const EMPTY_COLLECTION_NAME = 'test_mapgrid_empty';
const FOCUSED_ZOOM_THRESHOLD = 10;
const OVERVIEW_ZOOM_THRESHOLD = 8;
const CAMERA_SETTLE_POLL_MS = 700;
const BRASILIA: [number, number] = [-47.9292, -15.7801];

async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(testEnv.DIRECTUS_ADMIN_EMAIL);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

async function readCamera(page: Page): Promise<CameraState> {
  const container = page.locator('.map-container');
  await expect(container).toHaveAttribute('data-zoom', /-?\d/, { timeout: 30_000 });
  await expect(container).toHaveAttribute('data-center', /-?\d/, { timeout: 30_000 });

  const rawCenter = (await container.getAttribute('data-center')) ?? '';
  const zoom = Number(await container.getAttribute('data-zoom'));
  const center = rawCenter.split(',').map(Number) as [number, number];
  return { center, zoom };
}

async function waitForCameraToSettle(page: Page): Promise<CameraState> {
  let previousCamera = await readCamera(page);

  for (;;) {
    await page.waitForTimeout(CAMERA_SETTLE_POLL_MS);
    const currentCamera = await readCamera(page);
    const cameraIsStable =
      currentCamera.zoom === previousCamera.zoom &&
      currentCamera.center.join(',') === previousCamera.center.join(',');
    if (cameraIsStable) return currentCamera;
    previousCamera = currentCamera;
  }
}

async function openMapGridCollection(page: Page, collection = COLLECTION_NAME): Promise<void> {
  await page.goto(`/admin/content/${collection}`);
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });
}

async function clickCanvasAt(page: Page, point: { x: number; y: number }): Promise<void> {
  const canvas = page.locator('.maplibregl-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Map canvas has no bounding box');

  await page.mouse.click(box.x + point.x, box.y + point.y);
}

test.describe('MapGrid Layout - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openMapGridCollection(page);
  });

  test('should render the map container', async ({ page }) => {
    await expect(page.locator('.map-container')).toBeVisible();
  });

  test('should render the data table container', async ({ page }) => {
    await expect(page.locator('.table-container')).toBeVisible();
  });

  test('should display the seeded items in the grid', async ({ page }) => {
    for (const itemName of ['Brasilia', 'Sao Paulo', 'Recife']) {
      await expect(page.locator('.table-container').getByText(itemName).first()).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test('should render the map canvas with markers layer', async ({ page }) => {
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.map-container')).toHaveAttribute('data-zoom', /.+/, {
      timeout: 30_000,
    });
  });

  test('should focus and fly to the marker when clicking a grid row', async ({ page }) => {
    const targetRow = page.locator('.v-table tbody tr', { hasText: 'Brasilia' }).first();
    await expect(targetRow).toBeVisible({ timeout: 30_000 });

    await targetRow.click();

    await expect(page.locator('.maplibregl-popup')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.maplibregl-popup strong')).toHaveText('Brasilia');

    await expect
      .poll(async () => (await readCamera(page)).zoom, { timeout: 20_000 })
      .toBeGreaterThan(FOCUSED_ZOOM_THRESHOLD);

    const cameraAfterFocus = await readCamera(page);
    expect(cameraAfterFocus.center[0]).toBeCloseTo(BRASILIA[0], 1);
    expect(cameraAfterFocus.center[1]).toBeCloseTo(BRASILIA[1], 1);

    await expect(targetRow.locator('.selected-row')).toBeVisible();
  });

  test('should select the matching grid row when clicking a map marker', async ({ page }) => {
    const camera = await waitForCameraToSettle(page);
    const canvas = page.locator('.maplibregl-canvas');
    const viewport = await canvas.boundingBox();
    if (!viewport) throw new Error('Map canvas has no bounding box');

    const markerScreenPoint = projectToScreenPoint(camera, viewport, BRASILIA);

    await clickCanvasAt(page, markerScreenPoint);

    await expect(page.locator('.maplibregl-popup strong')).toHaveText('Brasilia', {
      timeout: 15_000,
    });

    const selectedRow = page.locator('.v-table tbody tr', { hasText: 'Brasilia' }).first();
    await expect(selectedRow.locator('.selected-row')).toBeVisible({ timeout: 15_000 });
  });

  test('should restore the overview camera when clicking the reset button', async ({ page }) => {
    const targetRow = page.locator('.v-table tbody tr', { hasText: 'Brasilia' }).first();
    await expect(targetRow).toBeVisible({ timeout: 30_000 });
    await targetRow.click();

    await expect
      .poll(async () => (await readCamera(page)).zoom, { timeout: 20_000 })
      .toBeGreaterThan(FOCUSED_ZOOM_THRESHOLD);

    await page.locator('.reset-map-btn').click();

    await expect
      .poll(async () => (await readCamera(page)).zoom, { timeout: 20_000 })
      .toBeLessThan(OVERVIEW_ZOOM_THRESHOLD);
  });

  test('should show the empty state message when collection has no items', async ({ page }) => {
    await page.goto(`/admin/content/${EMPTY_COLLECTION_NAME}`);
    await expect(page.locator('.v-info', { hasText: 'No items found' })).toBeVisible({
      timeout: 60_000,
    });
  });
});
