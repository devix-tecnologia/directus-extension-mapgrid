import { expect, test } from '@playwright/test';
import { EMPTY_COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset, ensureMapLayoutPreset } from '../helpers/mapgrid-preset';
import {
  configureProjectBasemap,
  removeProjectBasemaps,
  serveTestTiles,
  TEST_ATTRIBUTION,
  TEST_BASEMAP,
} from '../helpers/project-basemap';
import { setupTestEnvironment } from '../setup';
import {
  login,
  MAP,
  MAP_OPTIONS,
  openCollection,
  openLayoutOptions,
  openOptionsSection,
  pickInSelect,
} from './helpers/mapgrid-page';

const BASEMAP_NAME = new RegExp(TEST_BASEMAP);

test.describe('MapGrid — the basemap configured in the project', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
    await configureProjectBasemap();
  });

  test.afterAll(async () => {
    await removeProjectBasemaps();
  });

  test.beforeEach(async () => {
    await ensureMapGridPreset();
  });

  test('the Project Settings basemap shows up in the MapGrid panel and draws the map', async ({
    page,
  }) => {
    const requestedTiles = await serveTestTiles(page);
    await login(page);
    await openCollection(page);
    await openLayoutOptions(page);
    await openOptionsSection(page, MAP_OPTIONS);

    await pickInSelect(page, MAP_OPTIONS, BASEMAP_NAME);

    await expect.poll(requestedTiles, { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('the basemap attribution shows up in the corner of the map', async ({ page }) => {
    await serveTestTiles(page);
    await login(page);
    await openCollection(page);
    await openLayoutOptions(page);
    await openOptionsSection(page, MAP_OPTIONS);
    await pickInSelect(page, MAP_OPTIONS, BASEMAP_NAME);

    await expect(page.locator(`${MAP} .maplibregl-ctrl-attrib`)).toContainText(TEST_ATTRIBUTION, {
      timeout: 20_000,
    });
  });

  test("the choice is the app's: another collection's plain map layout starts using the same basemap", async ({
    page,
  }) => {
    await ensureMapLayoutPreset(EMPTY_COLLECTION_NAME);
    const requestedTiles = await serveTestTiles(page);
    await login(page);
    await openCollection(page);
    await openLayoutOptions(page);
    await openOptionsSection(page, MAP_OPTIONS);
    await pickInSelect(page, MAP_OPTIONS, BASEMAP_NAME);
    await expect.poll(requestedTiles, { timeout: 20_000 }).toBeGreaterThan(0);

    // in-app navigation, no reload: holds whether the choice is in memory or in the browser
    await page.locator(`a[href$="/content/${EMPTY_COLLECTION_NAME}"]`).first().click();
    // the tiles may come from cache; the attribution only exists in the test basemap
    await expect(page.locator('.layout-map .maplibregl-ctrl-attrib')).toContainText(
      TEST_ATTRIBUTION,
      { timeout: 30_000 }
    );
  });
});
