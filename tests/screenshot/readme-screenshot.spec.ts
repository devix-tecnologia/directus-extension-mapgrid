import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import { apiRequest } from '../helpers/directus-api';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * Regenerates the screenshot the README shows at the top (`docs/tela.jpg`).
 *
 * It exists so that refreshing the image is a command and not a chore: the
 * project requires the screenshot to be updated whenever a component changes
 * how it looks, and an image that has to be produced by hand is an image that
 * silently goes stale — which is exactly what happened when the options panel
 * lost its five numbered column selects.
 */

/*
 * Wide on purpose. Below roughly 1200px Directus turns the right sidebar into an
 * overlay drawer that dims the content behind it, so a narrower shot hides the
 * very thing it is meant to show.
 */
const VIEWPORT = { width: 1600, height: 900 };

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

/** Opens the layout options panel, so the shot shows how the layout is configured. */
async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();

  const columns = page.getByText(/table columns|colunas da grade/i).first();
  await expect(columns).toBeVisible({ timeout: 30_000 });
  await columns.click();
}

test('captures the README screenshot', async ({ page }) => {
  await setupTestEnvironment();

  // the shot should show the layout doing its job, so the preset names the
  // geolocation field, a popup template and a few columns
  await ensureMapGridPreset();
  await apiRequest('POST', '/presets', {
    collection: COLLECTION_NAME,
    layout: 'mapgrid',
    layout_query: { mapgrid: { page: 1, limit: 25, sort: ['name'] } },
    layout_options: {
      mapgrid: {
        geolocation: 'location',
        title: '{{name}}',
        fields: ['name', 'status'],
        zoomOnClick: false,
      },
    },
  });

  await page.setViewportSize(VIEWPORT);
  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

  await openLayoutOptions(page);

  // let the map settle: tiles, clustering and the initial framing all animate
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(6_000);

  await page.screenshot({
    path: 'docs/tela.jpg',
    type: 'jpeg',
    quality: 90,
    animations: 'disabled',
  });
});
