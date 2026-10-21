/**
 * Evidence for tasks 029 (a native geometry with a camera that has no bbox)
 * and 030 (fields of a related collection), in Portuguese.
 *
 * Each capture runs only when `EVIDENCE_TASK` names its task, comma-separated
 * for several. The "antes" comes from this same spec against the extension
 * built before the change: there the screen may be blank or the field missing,
 * and the capture shows it as it is.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { type Page, test } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../scripts/screenshot/index';
import {
  control,
  login,
  MAP_CANVAS,
  openLayoutOptions,
  openOptionsSection,
} from '../e2e/helpers/mapgrid-page';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  LPR_COLLECTION,
  setAdminLanguage,
} from '../helpers/lpr-collection';
import {
  ensureSmartphoneCollections,
  ensureSmartphoneMapGrid,
  TRACKING_COLLECTION,
} from '../helpers/smartphone-collection';
import { setupTestEnvironment } from '../setup';

const askedTasks = (): string[] =>
  (process.env.EVIDENCE_TASK ?? '')
    .split(',')
    .map((task) =>
      task
        .trim()
        .replace(/^task-/i, '')
        .padStart(3, '0')
    )
    .filter((task) => task !== '000');

const evidenceFor = (task: string, label: string): string | undefined => {
  const moment = process.env.EVIDENCE_MOMENT;
  if (!askedTasks().includes(task) || (moment !== 'antes' && moment !== 'depois')) return undefined;
  const name = evidenceName({ moment: moment as EvidenceMoment, label, task });
  const path = `${EVIDENCE_DIRECTORY}/${name.replace(/\.png$/, '.jpg')}`;
  mkdirSync(dirname(path), { recursive: true });
  return path;
};

const shoot = (page: Page, path: string) =>
  page.screenshot({ path, quality: 80, type: 'jpeg', animations: 'disabled' });

/** Opens a collection and waits for the map, or for as long as a broken build would need to show it. */
const open = async (page: Page, collection: string): Promise<void> => {
  await login(page);
  await page.goto(`/admin/content/${collection}`);
  await page
    .locator(MAP_CANVAS)
    .waitFor({ timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(4_000);
  await page.keyboard.press('Escape');
};

test.beforeAll(async () => {
  if (askedTasks().length === 0) return;
  await setupTestEnvironment();
  await setAdminLanguage('pt-BR');
  await ensureLprCollection();
  await ensureSmartphoneCollections();
});

test.use({ viewport: { width: 1600, height: 1000 } });

test('029 — the readings on a native geometry, with a camera that has no bbox', async ({
  page,
}) => {
  const path = evidenceFor('029', 'geometria-nativa');
  test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');

  await ensureLprMapGrid({
    options: {
      tourOnFirstVisit: false,
      showCard: true,
      cardImageField: 'photo',
      cameraTracking: 'off',
      map: { geometryField: 'location', cameraOptions: { center: [-40.29, -20.3], zoom: 12 } },
    },
  });
  await open(page, LPR_COLLECTION);
  if ((await control(page, 'next').count()) > 0) await control(page, 'next').click();
  await page.waitForTimeout(3_000);
  await shoot(page, path as string);
});

test('030 — the card shows the icon of the related device', async ({ page }) => {
  const path = evidenceFor('030', 'icone-do-aparelho-no-card');
  test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');

  await ensureSmartphoneMapGrid({
    options: {
      tourOnFirstVisit: false,
      cameraTracking: 'off',
      map: { cameraOptions: { center: [-40.31, -20.322], zoom: 13 } },
    },
  });
  await open(page, TRACKING_COLLECTION);
  if ((await control(page, 'next').count()) > 0) await control(page, 'next').click();
  await page.waitForTimeout(3_000);
  await shoot(page, path as string);
});

test('030 — the card image picker lists the related device icon', async ({ page }) => {
  const path = evidenceFor('030', 'seletor-com-campo-relacionado');
  test.skip(!path, 'only runs when the evidence is asked for by EVIDENCE_TASK/EVIDENCE_MOMENT');

  await ensureSmartphoneMapGrid({ options: { tourOnFirstVisit: false, cardImageField: '' } });
  await open(page, TRACKING_COLLECTION);
  await openLayoutOptions(page);
  await openOptionsSection(page, '.mapgrid-option--card');
  const picker = page.locator('.mapgrid-option__card-image');
  const tree = page.locator('.v-menu-content');
  // the "antes" build has a plain select: open it as it is
  if ((await picker.locator('[data-field-path-activator]').count()) > 0) {
    await picker.locator('[data-field-path-activator]').click();
    await tree.getByText('Smartphone', { exact: true }).click();
  } else {
    await picker.click();
  }
  await page.waitForTimeout(1_000);
  await shoot(page, path as string);
});
