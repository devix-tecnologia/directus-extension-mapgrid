/**
 * Does the options panel write to the preset?
 *
 * Task-009 concluded it does not, but the measurement behind that conclusion
 * read the collection's first `/presets` row — the global one, written by the
 * seed. Directus does not edit the global one when somebody changes an option
 * through the interface: it creates a preset of that person's own. The helper
 * was fixed in `tests/helpers/mapgrid-preset.ts` to apply the same precedence
 * Directus does (person > role > global), and this is the measurement redone.
 *
 * If it passes, task-009's defect was a measurement error.
 */
import { expect, type Page, test } from '@playwright/test';
import { ensureMapGridPreset, readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  GRID_OPTIONS,
  login,
  MAP_OPTIONS,
  openCollection,
  openLayoutOptions,
  openOptionsSection,
  pickInSelect,
  ZOOM_OPTIONS,
} from './helpers/mapgrid-page';

/** The sidebar comes collapsed, and the layout options only exist in the DOM afterwards. */
async function openZoomOptions(page: Page): Promise<void> {
  await openLayoutOptions(page);
  await openOptionsSection(page, ZOOM_OPTIONS);
}

/** The preset sections each embedded layout writes. */
const section = (options: Record<string, unknown>, name: 'map' | 'tabular') =>
  (options[name] ?? {}) as Record<string, unknown>;

test.beforeAll(async () => {
  await setupTestEnvironment();
});

// two full loads, and the map is slow: the 180s default does not cover it
test.setTimeout(300_000);

test('an option changed in the panel survives the reload', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);

  await openCollection(page);

  const before = await readMapGridPresetOptions();
  console.log(`[before] effective layout_options: ${JSON.stringify(before)}`);

  await openZoomOptions(page);

  // by our section, not by the label: the label is translated text
  const checkbox = page.locator(`${ZOOM_OPTIONS} .v-checkbox`).first();
  await expect(checkbox).toBeVisible({ timeout: 30_000 });
  const target = !(before.zoomOnClick ?? false);
  await checkbox.click();

  /*
   * The Directus write is debounced: reading right after the click gets there
   * before it happens, and the test would report as lost what had merely not
   * been stored yet.
   */
  await expect
    .poll(async () => (await readMapGridPresetOptions()).zoomOnClick, { timeout: 20_000 })
    .toBe(target);

  const after = await readMapGridPresetOptions();
  console.log(`[after] effective layout_options: ${JSON.stringify(after)}`);

  /*
   * The reload is not for re-reading the screen — the value is already in the
   * database. It is to prove that mounting the layout again does not overwrite
   * the choice with the detected default, which is the real risk on this path.
   */
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(15_000);

  const afterReload = await readMapGridPresetOptions();
  console.log(`[after reload] effective layout_options: ${JSON.stringify(afterReload)}`);
  expect(afterReload.zoomOnClick).toBe(target);
});

/**
 * The regression task-010 asks for: one option from EACH embedded layout,
 * written by the panel, present in the effective preset after a reload.
 *
 * What it reaches and `zoomOnClick` does not: `layoutOptions.map` and
 * `layoutOptions.tabular` are two sections of the same object, and each layout
 * writes the whole object to change one key. Touching a single option would
 * never prove the other section survived — it did not even exist in the preset.
 *
 * **What it does not distinguish, and it is measured**: this spec passes the
 * same with and without `useOptimisticWrite`. It was run both ways, and the
 * final preset is the same. That is, it proves the two sections coexist, and
 * does not prove the same-tick write defect — that one lives in
 * `src/index.test.ts`, where the test double delays the prop the way Vue does.
 * Between two clicks of a person the prop always came back.
 *
 * The two controls were not picked by taste, but for being the only ones in
 * both panels that store and can be changed here:
 *
 * - from the grid, "Spacing" is their whole panel, and `cozy` is the default,
 *   so `comfortable` is a real change;
 * - from the map, "Basemap" lives in the app store and not in the preset;
 *   "Geospatial Field" has a single item in this collection, already the chosen
 *   one; and "Cluster Nearby Data" starts disabled, because the seed's
 *   `location` field is `json` with no `geometryType` and they disable the box
 *   when the type is not `Point`. What is left is the display template, filled
 *   in by their field menu.
 */
async function pickFieldInTemplate(page: Page, field: RegExp): Promise<void> {
  /*
   * By role, and not by class: `add_box` is the button that opens the field
   * menu of their template control, and the `.system-display-template` class
   * the package declares does not reach the DOM Playwright sees.
   */
  const openFields = page.locator(MAP_OPTIONS).getByRole('button', { name: 'add_box' });
  await expect(openFields).toBeVisible({ timeout: 30_000 });
  await openFields.click();

  const item = page.getByRole('listitem').filter({ hasText: field }).first();
  await expect(item).toBeVisible({ timeout: 30_000 });
  await item.click();
}

test('both embedded layouts options survive the reload together', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);
  await openCollection(page);

  await openLayoutOptions(page);

  await openOptionsSection(page, GRID_OPTIONS);
  await pickInSelect(page, GRID_OPTIONS, /comfortable|confortável/i);

  await openOptionsSection(page, MAP_OPTIONS);
  await pickFieldInTemplate(page, /^\s*name\s*$/i);

  /* The Directus write is debounced: reading right after the click gets there first. */
  await expect
    .poll(async () => section(await readMapGridPresetOptions(), 'tabular').spacing, {
      timeout: 30_000,
    })
    .toBe('comfortable');

  await expect
    .poll(async () => section(await readMapGridPresetOptions(), 'map').displayTemplate, {
      timeout: 30_000,
    })
    .toBeTruthy();

  const before = await readMapGridPresetOptions();
  console.log(`[before reload] effective layout_options: ${JSON.stringify(before)}`);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(15_000);

  const after = await readMapGridPresetOptions();
  console.log(`[after reload] effective layout_options: ${JSON.stringify(after)}`);

  /*
   * The three together, and it is the sum that matters: the grid's, the map's
   * and the composition's. If any write erases the whole object instead of
   * replacing its own section, one of these disappears.
   */
  expect(section(after, 'tabular').spacing).toBe('comfortable');
  expect(section(after, 'map').displayTemplate).toBe(section(before, 'map').displayTemplate);
  expect(after.zoomOnClick).toBe(true);
});
