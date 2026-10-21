/** The tour of the features: a balloon per feature, on the first visit and on demand. */
import { expect, type Page, test } from '@playwright/test';
import { ensureLprCollection } from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { cameraOn, openLpr } from './helpers/lpr-page';
import { control } from './helpers/mapgrid-page';

const BALLOON = '[data-tour-balloon]';

const TOURED = {
  options: {
    tourOnFirstVisit: true,
    showCard: true,
    cardImageField: 'photo',
    headingSource: 'computed',
    cameraTracking: 'off',
    // a camera of its own: until the map publishes one, the record's mark — and its
    // balloon — have nowhere to be drawn
    map: { geometryField: 'location', cameraOptions: cameraOn('LPR-22283', 12) },
  },
};

/** Clicks Next until the tour ends, and returns the steps it went through. */
const walkTheTour = async (page: Page): Promise<string[]> => {
  const steps: string[] = [];
  for (let guard = 0; guard < 20; guard += 1) {
    const balloon = page.locator(BALLOON);
    if ((await balloon.count()) === 0) break;
    steps.push((await balloon.getAttribute('data-tour-step')) ?? '');
    await page.locator('[data-tour-next] button').click();
    await page.waitForTimeout(300);
  }
  return steps;
};

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — the tour', () => {
  test('opens by itself on the first visit and presents every feature', async ({ page }) => {
    await openLpr(page, TOURED);

    await expect(page.locator(BALLOON)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(`${BALLOON} [data-tour-count]`)).toHaveText(/^1 (of|de) 11$/i);

    expect(await walkTheTour(page)).toEqual([
      'map',
      'grid',
      'filters',
      'navigation',
      'playback',
      'tracking',
      'heading',
      'card',
      'timeline',
      'measure',
      'reset',
    ]);
  });

  test('does not open again once seen, and the help button brings it back', async ({ page }) => {
    await openLpr(page, TOURED);
    await expect(page.locator(BALLOON)).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator(BALLOON)).toHaveCount(0);

    await page.reload();
    await page.waitForTimeout(5_000);
    await expect(page.locator(BALLOON)).toHaveCount(0);

    await control(page, 'tour').click();
    await expect(page.locator(BALLOON)).toHaveAttribute('data-tour-step', 'map', {
      timeout: 15_000,
    });
  });

  test('stays closed when the preset does not ask for it', async ({ page }) => {
    await openLpr(page, { options: { cameraTracking: 'off' } });

    await page.waitForTimeout(5_000);
    await expect(page.locator(BALLOON)).toHaveCount(0);
  });
});
