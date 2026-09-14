import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME, EMPTY_COLLECTION_NAME } from '../helper-collection';
import { testEnv } from '../test-env';
import { type CameraState, projectToScreenPoint } from './helpers/map-projection';

const FOCUSED_ZOOM_THRESHOLD = 10;
const CAMERA_SETTLE_POLL_MS = 700;
const CAMERA_SETTLE_TIMEOUT_MS = 30_000;
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
  const deadline = Date.now() + CAMERA_SETTLE_TIMEOUT_MS;
  let previousCamera = await readCamera(page);

  while (Date.now() < deadline) {
    await page.waitForTimeout(CAMERA_SETTLE_POLL_MS);
    const currentCamera = await readCamera(page);
    const cameraIsStable =
      currentCamera.zoom === previousCamera.zoom &&
      currentCamera.center.join(',') === previousCamera.center.join(',');
    if (cameraIsStable) return currentCamera;
    previousCamera = currentCamera;
  }

  throw new Error(`Map camera did not stabilize within ${CAMERA_SETTLE_TIMEOUT_MS}ms`);
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

  test('should enable the delete action when selecting a grid row', async ({ page }) => {
    const targetRow = page.locator('.v-table tbody tr', { hasText: 'Brasilia' }).first();
    await expect(targetRow).toBeVisible({ timeout: 30_000 });

    const checkbox = targetRow.getByRole('checkbox');
    await expect(checkbox).toHaveAttribute('aria-pressed', 'false');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-pressed', 'true');

    const deleteBtn = page
      .locator('.header-bar .delete-btn, [class*="layout-actions"] .delete-btn')
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 15_000 });

    await deleteBtn.click();
    await expect(page.getByText('Delete 1 item(s)?')).toBeVisible();
    await expect(page.getByText('This action cannot be undone.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('should show the empty state message when collection has no items', async ({ page }) => {
    await page.goto(`/admin/content/${EMPTY_COLLECTION_NAME}`);
    await expect(page.locator('.v-info', { hasText: 'No items found' })).toBeVisible({
      timeout: 60_000,
    });
  });
});
