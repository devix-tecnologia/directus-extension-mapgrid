import { expect, type Page, test } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../scripts/screenshot/index';
import { clickCenterMarker, rowOf, waitForMapGrid } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCenteredOn } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * The evidence of the marker click, which no still capture shows.
 *
 * Task-010's change adds no element to the screen: it changes what a click on a
 * marker does. Before, the Directus map layout's `handleClick` took you to the
 * item screen — the "before" evidence is a page that is not even the MapGrid.
 * After, the person stays in the layout and the item's row shows up marked in
 * the grid. Only a before/after pair with the click already made makes that
 * judgeable.
 *
 * It stays out of `readme-screenshot.spec.ts` on purpose: that one produces the
 * image at the top of the README, which has to show the layout at rest.
 */

const ISOLATED_CITY = 'Manaus';
const MANAUS: [number, number] = [-60.0255, -3.119];
const CITY_ZOOM = 12;

const evidence = (): string | undefined => {
  const moment = process.env.EVIDENCE_MOMENT;
  const task = process.env.EVIDENCE_TASK;
  if (!moment || !task) return undefined;

  if (moment !== 'antes' && moment !== 'depois') {
    throw new Error(
      `EVIDENCE_MOMENT must be "antes" or "depois", and it came as ${JSON.stringify(moment)}`
    );
  }

  /*
   * The label is fixed, and not the environment's `EVIDENCE_LABEL`: the README
   * capture reads the same variable, and with both honouring the same label the
   * two scripts write to the SAME file — the second capture erases the first,
   * with no error at all. It happened: this task's "after" ended up being the
   * README screen.
   */
  return `${EVIDENCE_DIRECTORY}/${evidenceName({
    task,
    label: 'clique-no-ponto',
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

test('captures the screen after a click on a marker', async ({ page }) => {
  const path = evidence();
  test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');
  if (!path) return;

  await setupTestEnvironment();

  // the seeded camera puts Manaus at the centre of the canvas: that is what gives the click a target
  await ensureMapGridPresetCenteredOn(MANAUS, CITY_ZOOM);

  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await waitForMapGrid(page);

  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await clickCenterMarker(page);
  await page.waitForTimeout(3_000);

  /*
   * Brings the item's row into the visible grid. Without this the image proves
   * half of it: the marker changes colour and the bulk actions show up in the
   * header, but the marked row stays out of sight. Guarded because in the
   * "before" the click goes to the item screen, and there is no grid there.
   */
  const row = rowOf(page, ISOLATED_CITY);
  if ((await row.count()) > 0) await row.scrollIntoViewIfNeeded();

  await page.screenshot({ path, animations: 'disabled' });
});
