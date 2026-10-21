/**
 * Evidence for tasks 019, 020, 022, 025 and 026, over the LPR collection and in
 * Portuguese, as the people the collection is for read it.
 *
 * Each capture belongs to one task and only runs when `EVIDENCE_TASK` names
 * it — several tasks may be named at once, comma-separated. The "antes" comes from running this same spec against the extension
 * built before the change: there the new controls do not exist, so each
 * interaction that needs one is skipped and the screen is shot as it is.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../scripts/screenshot/index';
import { cameraOn, pagePointOf, waitForMarkerAt } from '../e2e/helpers/lpr-page';
import { control, login, MAP_CANVAS, MAP_PANE, ROWS } from '../e2e/helpers/mapgrid-page';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  LPR_COLLECTION,
  setAdminLanguage,
} from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { shootTheSettledMap } from './helpers/frame-strip';

type LprPreset = Parameters<typeof ensureLprMapGrid>[0];

/** `EVIDENCE_TASK` may name several tasks here, comma-separated: one stack, every capture. */
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

/** The file for a label, or `undefined` when this task's evidence was not asked for. */
const evidenceFor = (task: string, label: string): string | undefined => {
  const moment = process.env.EVIDENCE_MOMENT;
  if (!askedTasks().includes(task) || (moment !== 'antes' && moment !== 'depois')) return undefined;

  const name = evidenceName({ moment: moment as EvidenceMoment, label, task });
  const path = `${EVIDENCE_DIRECTORY}/${name.replace(/\.png$/, '.jpg')}`;
  mkdirSync(dirname(path), { recursive: true });
  return path;
};

const shootPage = async (page: Page, path: string): Promise<void> => {
  await page.screenshot({ path, quality: 80, type: 'jpeg', animations: 'disabled' });
};

const shootMap = async (page: Page, path: string): Promise<void> => {
  writeFileSync(path, await shootTheSettledMap(page));
};

/** Clicks a control of the MapGrid toolbar only when this build has it. */
const pressIfThere = async (page: Page, name: string): Promise<boolean> => {
  const button = control(page, name);
  if ((await button.count()) === 0) return false;
  await button.click();
  return true;
};

const open = async (page: Page, preset: LprPreset): Promise<void> => {
  await ensureLprMapGrid(preset);
  await login(page);
  await page.goto(`/admin/content/${LPR_COLLECTION}`);
  await expect(page.locator(MAP_CANVAS)).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(ROWS).first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(3_000);
};

const steps = async (page: Page, count: number): Promise<void> => {
  for (let step = 0; step < count; step += 1) {
    await control(page, 'next').click();
    await page.waitForTimeout(1_200);
  }
};

/** Over the start of the first trip: Itaparica to the Terceira Ponte. */
const VILA_VELHA = cameraOn('LPR-22283', 13);

/** The first five readings, Itaparica to the Enseada do Suá, all in the frame. */
const FIRST_FIVE: { center: [number, number]; zoom: number } = {
  center: [-40.294, -20.335],
  zoom: 12.6,
};

/*
 * Set here because the project's `Desktop Chrome` device brings its own
 * 1280×720, which wins over the config's viewport — and at that size the
 * map pane is a strip and the card does not fit.
 */
test.use({ viewport: { width: 1600, height: 1000 } });

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
  await setAdminLanguage('pt-BR');
});

test.afterAll(async () => {
  await setAdminLanguage('en-US');
});

test('019 — the arrow on the current record', async ({ page }) => {
  const path = evidenceFor('019', 'sentido');
  test.skip(!path, 'only runs when EVIDENCE_TASK=019');
  if (!path) return;

  await open(page, {
    options: {
      cameraTracking: 'off',
      headingSource: 'computed',
      trailLength: 0,
      map: { geometryField: 'location', cameraOptions: cameraOn('LPR-22283', 15) },
    },
  });
  await steps(page, 2);
  await shootMap(page, path);
});

test('020 — the trail of the visited records', async ({ page }) => {
  const path = evidenceFor('020', 'rastro');
  test.skip(!path, 'only runs when EVIDENCE_TASK=020');
  if (!path) return;

  await open(page, {
    options: {
      cameraTracking: 'off',
      headingSource: 'computed',
      trailLength: 20,
      map: { geometryField: 'location', cameraOptions: FIRST_FIVE },
    },
  });
  await steps(page, 5);
  await shootMap(page, path);
});

test('022 — the timeline between the map and the grid', async ({ page }) => {
  const path = evidenceFor('022', 'linha-do-tempo');
  test.skip(!path, 'only runs when EVIDENCE_TASK=022');
  if (!path) return;

  await open(page, {
    options: {
      cameraTracking: 'off',
      trailLength: 0,
      map: { geometryField: 'location', cameraOptions: VILA_VELHA },
    },
  });
  await steps(page, 3);
  await shootPage(page, path);
});

test('025 — the grid with the capture photos', async ({ page }) => {
  const path = evidenceFor('025', 'grade-com-foto');
  test.skip(!path, 'only runs when EVIDENCE_TASK=025');
  if (!path) return;

  await open(page, { options: { map: { geometryField: 'location', cameraOptions: VILA_VELHA } } });
  await expect
    .poll(
      () =>
        page
          .locator(ROWS)
          .first()
          .locator('img')
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      { timeout: 30_000 }
    )
    .toBeGreaterThan(1);
  await shootPage(page, path);
});

test('025 — the capture card, and its photo enlarged', async ({ page }) => {
  const card = evidenceFor('025', 'card-da-captura');
  const enlarged = evidenceFor('025', 'foto-ampliada');
  test.skip(!card || !enlarged, 'only runs when EVIDENCE_TASK=025');
  if (!card || !enlarged) return;

  await open(page, {
    options: {
      cameraTracking: 'off',
      headingSource: 'computed',
      showCard: true,
      cardImageField: 'photo',
      cardFields: [
        'plate',
        'captured_at',
        'vehicle_type',
        'equipment_label',
        'reader_kind',
        'address',
        'neighbourhood',
        'municipality',
      ],
      map: { geometryField: 'location', cameraOptions: VILA_VELHA },
    },
  });
  await steps(page, 3);
  await page.waitForTimeout(1_500);
  await shootPage(page, card);

  const photo = page.locator('[data-capture-photo]');
  if ((await photo.count()) > 0) {
    await photo.click();
    await page.waitForTimeout(800);
  }
  await shootPage(page, enlarged);
});

test('025 — measuring between readings', async ({ page }) => {
  const path = evidenceFor('025', 'medicao');
  test.skip(!path, 'only runs when EVIDENCE_TASK=025');
  if (!path) return;

  const camera = cameraOn('LPR-24035', 11);
  await open(page, {
    options: { cameraTracking: 'off', map: { geometryField: 'location', cameraOptions: camera } },
  });

  const route = ['LPR-24052', 'LPR-24035', 'LPR-24010', 'LPR-23248'];
  const first = await pagePointOf(page, camera, route[0] as string);
  await waitForMarkerAt(page, first);

  if (await pressIfThere(page, 'measure')) {
    for (const key of route) {
      const at = await pagePointOf(page, camera, key);
      await page.mouse.click(at.x, at.y);
      await page.waitForTimeout(300);
    }
  }
  await page.mouse.move(0, 0);
  await page.locator(MAP_PANE).screenshot({ path, quality: 80, type: 'jpeg' });
});

test('025 — editing the selected readings at once', async ({ page }) => {
  const path = evidenceFor('025', 'edicao-em-lote');
  test.skip(!path, 'only runs when EVIDENCE_TASK=025');
  if (!path) return;

  await open(page, { options: { map: { geometryField: 'location', cameraOptions: VILA_VELHA } } });
  for (const row of [0, 1, 2]) {
    await page.locator(ROWS).nth(row).locator('td.select [role="checkbox"]').click();
  }
  await page
    .locator('.header-bar .v-button')
    .filter({ has: page.locator('[data-icon="edit"]') })
    .click();
  await expect(page.locator('.v-drawer')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1_000);
  await shootPage(page, path);
});

test('026 — the tour of the features', async ({ page }) => {
  const start = evidenceFor('026', 'apresentacao');
  const heading = evidenceFor('026', 'apresentacao-sentido');
  test.skip(!start || !heading, 'only runs when EVIDENCE_TASK=026');
  if (!start || !heading) return;

  await open(page, {
    options: {
      cameraTracking: 'off',
      headingSource: 'computed',
      trailLength: 20,
      showCard: true,
      cardImageField: 'photo',
      tourOnFirstVisit: true,
      map: { geometryField: 'location', cameraOptions: cameraOn('LPR-22283', 12) },
    },
  });

  // before the tour existed there is no balloon to wait for: the screen is shot as it is
  const balloon = page.locator('[data-tour-balloon]');
  await balloon.waitFor({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shootPage(page, start);

  for (let guard = 0; guard < 11 && (await balloon.count()) > 0; guard += 1) {
    if ((await balloon.getAttribute('data-tour-step')) === 'heading') break;
    await page.locator('[data-tour-next] button').click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(500);
  await shootPage(page, heading);
});
