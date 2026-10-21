/** Fields one relation away: the device's icon, brand and model on the positions' MapGrid. */
import { expect, test } from '@playwright/test';
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
  menuItem,
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

  test('the card image picker offers the file field of the related device', async ({ page }) => {
    await ensureSmartphoneMapGrid({ options: { cardImageField: '' } });
    await login(page);
    await openCollection(page, TRACKING_COLLECTION);
    await openLayoutOptions(page);
    await openOptionsSection(page, '.mapgrid-option--card');

    await page.locator('.mapgrid-option__card-image').click();
    await expect(menuItem(page, /Smartphone\s*→\s*Icon/i)).toBeVisible({ timeout: 15_000 });
  });
});
