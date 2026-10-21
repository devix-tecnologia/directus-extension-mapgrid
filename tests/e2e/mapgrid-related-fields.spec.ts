/** Fields one relation away: the device's icon, brand and model on the positions' MapGrid. */
import { expect, type Page, test } from '@playwright/test';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from '../helpers/directus-api';
import {
  ensureSmartphoneCollections,
  ensureSmartphoneMapGrid,
  SMARTPHONES,
  TRACKING_COLLECTION,
} from '../helpers/smartphone-collection';
import { setupTestEnvironment } from '../setup';
import {
  control,
  login,
  openCollection,
  openLayoutOptions,
  openOptionsSection,
  ROWS,
} from './helpers/mapgrid-page';

const FIRST = SMARTPHONES[0] as (typeof SMARTPHONES)[number];

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureSmartphoneCollections();
});

test.describe('MapGrid — fields of a related collection', () => {
  test('the grid shows the device each position belongs to', async ({ page }) => {
    await ensureSmartphoneMapGrid();
    await login(page);
    await openCollection(page, TRACKING_COLLECTION);

    await expect(page.locator(ROWS).first()).toContainText(FIRST.brand, { timeout: 30_000 });
    await expect(page.locator(ROWS).first()).toContainText(FIRST.model);
  });

  test('the card shows the icon of the related device, and its brand and model', async ({
    page,
  }) => {
    await ensureSmartphoneMapGrid({ options: { cameraTracking: 'off' } });
    await login(page);
    await openCollection(page, TRACKING_COLLECTION);

    await control(page, 'next').click();

    const card = page.locator('[data-capture-card]');
    await expect(card.locator('[data-capture-field="smartphone.model"]')).toHaveText(FIRST.model, {
      timeout: 30_000,
    });
    const icon = card.locator('[data-capture-photo] img');
    await expect
      .poll(() => icon.evaluate((image: HTMLImageElement) => image.naturalWidth), {
        timeout: 30_000,
      })
      .toBeGreaterThan(1);
  });

  test('the card image is picked in the field tree, opening the relation', async ({ page }) => {
    await ensureSmartphoneMapGrid({ options: { cardImageField: '' } });
    await login(page);
    await openCollection(page, TRACKING_COLLECTION);
    await openLayoutOptions(page);
    await openOptionsSection(page, '.mapgrid-option--card');

    const picker = page.locator('.mapgrid-option__card-image');
    await picker.locator('[data-field-path-activator]').click();
    const tree = page.locator('.v-menu-content');
    await tree.getByText('Smartphone', { exact: true }).click();
    await tree.getByText('Icon', { exact: true }).click();

    await expect(picker.locator('[data-field-path-activator]')).toContainText(
      /Smartphone\s*→\s*Icon/,
      { timeout: 15_000 }
    );
  });
});

test.describe('MapGrid — editing the selected positions', () => {
  type Position = { id: number; battery_percent: number };

  const firstPositions = async (count: number): Promise<Position[]> =>
    unwrapItems(
      await apiRequest<DirectusCollectionResponse<Position>>(
        'GET',
        `/items/${TRACKING_COLLECTION}?fields=id,battery_percent&sort=tracked_at&limit=${count}`
      )
    );

  const batteryOf = async (ids: number[]): Promise<number[]> =>
    unwrapItems(
      await apiRequest<DirectusCollectionResponse<Position>>(
        'GET',
        `/items/${TRACKING_COLLECTION}?fields=battery_percent&sort=tracked_at&filter[id][_in]=${ids.join(',')}`
      )
    ).map((row) => row.battery_percent);

  /** Selects the first rows, presses the header's edit button and sets the battery. */
  const editBattery = async (page: Page, rows: number, value: string): Promise<void> => {
    await ensureSmartphoneMapGrid();
    await login(page);
    await openCollection(page, TRACKING_COLLECTION);
    for (let row = 0; row < rows; row += 1) {
      await page.locator(ROWS).nth(row).locator('td.select [role="checkbox"]').click();
    }
    await page
      .locator('.header-bar .v-button')
      .filter({ has: page.locator('[data-icon="edit"]') })
      .click();

    const drawer = page.locator('.v-drawer');
    const field = drawer.locator('.field', { hasText: /battery percent/i });
    await expect(field).toBeVisible({ timeout: 20_000 });
    // in batch editing a field stays disabled until its own checkbox says it is to be changed
    await field.locator('[role="checkbox"]').first().click();
    await field.locator('input').fill(value);
    await drawer
      .locator('.header-bar .v-button')
      .filter({ has: page.locator('[data-icon="check"]') })
      .click();
  };

  for (const rows of [1, 2]) {
    test(`edits ${rows === 1 ? 'one selected position' : 'several selected positions at once'}`, async ({
      page,
    }) => {
      const before = await firstPositions(rows);
      const ids = before.map((row) => row.id);
      try {
        await editBattery(page, rows, '7');
        await expect.poll(() => batteryOf(ids), { timeout: 30_000 }).toEqual(ids.map(() => 7));
      } finally {
        for (const row of before) {
          await apiRequest('PATCH', `/items/${TRACKING_COLLECTION}/${row.id}`, {
            battery_percent: row.battery_percent,
          });
        }
      }
    });
  }
});
