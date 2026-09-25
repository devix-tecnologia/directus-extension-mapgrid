import { expect, type Page, test } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../scripts/screenshot/index';
import { waitForMapGrid } from '../e2e/helpers/mapgrid-page';
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

/**
 * The same capture also becomes task evidence, when asked for.
 *
 * The naming convention comes from geohub:
 * `TASKS/assets/task-NNN-<label>-<moment>.png`, with the moment in the name and
 * not in a subfolder, so the before/after pair shows up side by side when the
 * folder is opened.
 *
 * The "before" is obtained by running this same script against the
 * `dist/index.js` built from an earlier revision: both images then come from
 * the same environment, same collection and same viewport, and the only
 * difference between them is the extension. Capturing the "before" after the
 * change would be too late — only git still has that state.
 */
const evidence = (): string | undefined => {
  const moment = process.env.EVIDENCE_MOMENT;
  const task = process.env.EVIDENCE_TASK;
  if (!moment || !task) return undefined;

  if (moment !== 'antes' && moment !== 'depois') {
    throw new Error(
      `EVIDENCE_MOMENT must be "antes" or "depois", and it came as ${JSON.stringify(moment)}`
    );
  }

  return `${EVIDENCE_DIRECTORY}/${evidenceName({
    task,
    // `||`, and not `??`: compose hands an undefined variable over as an empty
    // string, and `??` accepted it — the script then died on "invalid label"
    label: process.env.EVIDENCE_LABEL || 'tela',
    moment: moment as EvidenceMoment,
  })}`;
};

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

/**
 * Opens the layout options panel, so the shot shows how the layout is
 * configured.
 *
 * The section it opens is the map one. It used to be the popup template one,
 * and that does not exist any more: after task-010 the panel hosts the Directus
 * layouts' own configuration, in two sections — map and grid. The script went
 * on looking for "Popup Pin Map" and failed after 30s of waiting, so
 * `pnpm screenshot` stopped producing the README image without anyone noticing.
 */
async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();

  const mapSection = page.getByText(/^(map|mapa)$/i).first();
  await expect(mapSection).toBeVisible({ timeout: 30_000 });
  await mapSection.click();
}

test('captures the README screenshot', async ({ page }) => {
  await setupTestEnvironment();

  // the shot should show the layout doing its job, so the preset names the
  // geolocation field, a popup template and a few columns
  await ensureMapGridPreset();
  await apiRequest('POST', '/presets', {
    collection: COLLECTION_NAME,
    layout: 'mapgrid',
    // the columns live in the query, and not in the options: that is where
    // Directus keeps them, and where the grid reads them from since task-005
    layout_query: { mapgrid: { page: 1, limit: 25, sort: ['name'], fields: ['name', 'status'] } },
    layout_options: {
      mapgrid: {
        geolocation: 'location',
        title: '{{name}}',
        zoomOnClick: false,
      },
    },
  });

  await page.setViewportSize(VIEWPORT);
  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await waitForMapGrid(page);

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

  const evidencePath = evidence();
  if (evidencePath) {
    await page.screenshot({ path: evidencePath, animations: 'disabled' });
  }
});
