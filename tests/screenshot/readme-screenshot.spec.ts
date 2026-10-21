import { expect, type Page, test } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../scripts/screenshot/index';
import { control, waitForMapGrid } from '../e2e/helpers/mapgrid-page';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  LPR_COLLECTION,
  setAdminLanguage,
} from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * Regenerates the screenshot the README shows at the top (`docs/tela.jpg`).
 *
 * It exists so that refreshing the image is a command and not a chore: the
 * project requires the screenshot to be updated whenever a component changes
 * how it looks, and an image that has to be produced by hand is an image that
 * silently goes stale.
 *
 * The scene is the licence plate collection with what the MapGrid adds on
 * screen at once: a record in focus with its card and photo, the arrow and the
 * trail behind it, and the timeline between the map and the grid.
 */

/* Wide on purpose: the map, the card and the grid all need the room. */
const VIEWPORT = { width: 1600, height: 900 };

/** The first readings of the first trip, Itaparica to the Enseada do Suá, all in the frame. */
const CAMERA = { center: [-40.294, -20.335], zoom: 12.6 };
const STEPS = 4;

/**
 * The same capture also becomes task evidence, when asked for.
 *
 * The naming convention comes from geohub:
 * `TASKS/assets/task-NNN-<label>-<moment>.png`, with the moment in the name and
 * not in a subfolder, so the before/after pair shows up side by side when the
 * folder is opened.
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

/**
 * Signs in without the e2e helper on purpose: that one marks the sidebar as
 * already collapsed, and here the MapGrid's first-visit collapse is wanted —
 * it is what gives the map its room.
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

test('captures the README screenshot', async ({ browser }) => {
  await setupTestEnvironment();
  await ensureLprCollection();
  await setAdminLanguage('en-US');
  await ensureLprMapGrid({
    options: {
      cameraTracking: 'off',
      headingSource: 'computed',
      trailLength: 20,
      showCard: true,
      cardImageField: 'photo',
      cardFields: [
        'plate',
        'captured_at',
        'alert_status',
        'vehicle_type',
        'equipment_label',
        'address',
        'neighbourhood',
        'municipality',
      ],
      map: { geometryField: 'location', cameraOptions: CAMERA },
    },
  });

  const context = await browser.newContext({ viewport: VIEWPORT });
  // the tour would cover the screen it is meant to show
  await context.addInitScript((collection) => {
    localStorage.setItem(`mapgrid:tour-seen:${collection}`, '1');
  }, LPR_COLLECTION);
  const page = await context.newPage();

  await login(page);
  await page.goto(`/admin/content/${LPR_COLLECTION}`);
  await waitForMapGrid(page);
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-timeline-start]')).not.toHaveText('', { timeout: 30_000 });

  for (let step = 0; step < STEPS; step += 1) {
    await control(page, 'next').click();
    await page.waitForTimeout(1_200);
  }
  await expect(page.locator('[data-capture-photo] img')).toBeVisible({ timeout: 30_000 });
  // tiles, the photo and the trail all settle on their own clocks
  await page.waitForTimeout(4_000);
  await page.mouse.move(0, VIEWPORT.height - 1);

  await page.screenshot({
    path: 'docs/tela.jpg',
    type: 'jpeg',
    quality: 85,
    animations: 'disabled',
  });

  const evidencePath = evidence();
  if (evidencePath) {
    await page.screenshot({ path: evidencePath, animations: 'disabled' });
  }
  await context.close();
});
