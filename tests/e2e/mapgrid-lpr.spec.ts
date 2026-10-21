/**
 * The GeoHub tracking requests, over a licence plate recognition collection:
 * each test is one item of "Pontos de melhoria para o módulo de tracking" that
 * the MapGrid answers once configured on such a collection.
 */
import { expect, test } from '@playwright/test';
import { DistanceMeasure } from '../../src/services/distance-measure/index';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from '../helpers/directus-api';
import {
  ensureLprCollection,
  FIRST_READING_READER,
  LPR_COLLECTION,
  LPR_FIELDS,
  type LprReading,
  lprReadings,
  placeOf,
  readingsWith,
  SECOND_READING_READER,
} from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { cameraOn, expectCurrent, openLpr, pagePointOf, waitForMarkerAt } from './helpers/lpr-page';
import {
  columnCell,
  control,
  currentRecord,
  ROWS,
  sortBy,
  visibleColumns,
} from './helpers/mapgrid-page';

const readingsWhere = (field: keyof LprReading, value: string): number =>
  lprReadings().filter((reading) => reading[field] === value).length;

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid on LPR — list panel', () => {
  test('the grid shows the columns chosen for the investigation layout', async ({ page }) => {
    await openLpr(page);

    expect(await visibleColumns(page)).toEqual(LPR_FIELDS.map((field) => field.replace(/_/g, ' ')));
  });

  test('each reading shows its capture photo in the grid', async ({ page }) => {
    await openLpr(page);

    const thumbnail = page.locator(ROWS).first().locator('img');
    await expect
      .poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth), {
        timeout: 30_000,
      })
      .toBeGreaterThan(1);
  });

  const filters: { name: string; filter: Record<string, unknown>; expected: number }[] = [
    {
      name: 'alert status',
      filter: { alert_status: { _eq: 'theft' } },
      expected: readingsWith('theft'),
    },
    {
      name: 'municipality',
      filter: { municipality: { _eq: 'Serra' } },
      expected: readingsWhere('municipality', 'Serra'),
    },
    {
      name: 'neighbourhood',
      filter: { neighbourhood: { _eq: 'Jardim Camburi' } },
      expected: readingsWhere('neighbourhood', 'Jardim Camburi'),
    },
    {
      name: 'capture address',
      filter: { address: { _contains: 'Reta da Penha' } },
      expected: readingsWhere('address', 'Av. Reta da Penha'),
    },
    {
      name: 'reader on a patrol car',
      filter: { reader_kind: { _eq: 'patrol' } },
      expected: readingsWhere('reader_kind', 'patrol'),
    },
  ];

  for (const { name, filter, expected } of filters) {
    test(`a filter on the ${name} narrows the readings`, async ({ page }) => {
      await openLpr(page, { filter });

      await expect(page.locator(ROWS)).toHaveCount(expected, { timeout: 30_000 });
    });
  }

  test('sorts by alert status', async ({ page }) => {
    await openLpr(page, { query: { sort: ['alert_status', 'captured_at'] } });

    await expect(await columnCell(page, 'alert status')).toHaveText(/fraud/i, {
      timeout: 30_000,
    });
  });

  test('sorts by municipality from the column header', async ({ page }) => {
    await openLpr(page);

    await sortBy(page, 'municipality', 'desc');

    await expect(await columnCell(page, 'municipality')).toHaveText('Vitória', {
      timeout: 30_000,
    });
  });

  test('edits the selected readings at once', async ({ page }) => {
    const firstTwo = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: number; vehicle_type: string }>>(
        'GET',
        `/items/${LPR_COLLECTION}?fields=id,vehicle_type&sort=captured_at&limit=2`
      )
    );

    try {
      await openLpr(page);
      for (const row of [0, 1]) {
        await page.locator(ROWS).nth(row).locator('td.select [role="checkbox"]').click();
      }

      await page
        .locator('.header-bar .v-button')
        .filter({ has: page.locator('[data-icon="edit"]') })
        .click();
      const drawer = page.locator('.v-drawer');
      await expect(drawer).toContainText(/batch edit/i, { timeout: 20_000 });

      // in batch editing a field stays disabled until its own checkbox says it is to be changed
      const field = drawer.locator('.field', { hasText: /vehicle type/i });
      await field.locator('[role="checkbox"]').first().click();
      await field.locator('.v-select').click();
      await page
        .getByRole('listitem')
        .filter({ hasText: /^Truck$/ })
        .first()
        .click();
      await drawer
        .locator('.header-bar .v-button')
        .filter({ has: page.locator('[data-icon="check"]') })
        .click();

      await expect
        .poll(
          async () => {
            const edited = unwrapItems(
              await apiRequest<DirectusCollectionResponse<{ vehicle_type: string }>>(
                'GET',
                `/items/${LPR_COLLECTION}?fields=vehicle_type&filter[id][_in]=${firstTwo.map((row) => row.id).join(',')}`
              )
            );
            return edited.map((row) => row.vehicle_type);
          },
          { timeout: 30_000 }
        )
        .toEqual(['truck', 'truck']);
    } finally {
      for (const row of firstTwo) {
        await apiRequest('PATCH', `/items/${LPR_COLLECTION}/${row.id}`, {
          vehicle_type: row.vehicle_type,
        });
      }
    }
  });
});

test.describe('MapGrid on LPR — map panel', () => {
  test('previous and next walk the readings in the order they happened', async ({ page }) => {
    await openLpr(page);

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_READING_READER);

    await control(page, 'next').click();
    await expectCurrent(page, SECOND_READING_READER);

    await control(page, 'previous').click();
    await expectCurrent(page, FIRST_READING_READER);
  });

  test('playback drives the route on its own and stop pauses it', async ({ page }) => {
    await openLpr(page, { options: { playbackInterval: 3 } });

    await control(page, 'playback').click();
    await expectCurrent(page, FIRST_READING_READER);

    await control(page, 'playback').click();
    const stoppedAt = await currentRecord(page);

    await page.waitForTimeout(9_000);
    expect(await currentRecord(page)).toBe(stoppedAt);
  });

  test('clicking a capture on the map marks its reading in the grid', async ({ page }) => {
    const camera = cameraOn('LPR-24052', 14);
    // one trip only, so a single reading sits under the camera's point
    await openLpr(page, {
      filter: { alert_status: { _eq: 'robbery' } },
      options: { map: { geometryField: 'location', cameraOptions: camera } },
    });

    const at = await pagePointOf(page, camera, 'LPR-24052');
    await waitForMarkerAt(page, at);
    await page.mouse.click(at.x, at.y);

    await expectCurrent(page, 'LPR-24052');
  });

  test('the focused capture opens in a card, with the photo that enlarges', async ({ page }) => {
    await openLpr(page, {
      options: { showCard: true, cardImageField: 'photo', cameraTracking: 'off' },
    });

    await control(page, 'next').click();

    const card = page.locator('[data-capture-card]');
    await expect(card.locator('[data-capture-title]')).toHaveText('RQP4C58', { timeout: 30_000 });
    await expect(card.locator('[data-capture-field="equipment_label"]')).toHaveText(
      FIRST_READING_READER
    );
    await expect(card.locator('[data-capture-field="coordinates"]')).toContainText('-20.35400');

    const photo = card.locator('[data-capture-photo] img');
    await expect
      .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth), {
        timeout: 30_000,
      })
      .toBeGreaterThan(1);

    await card.locator('[data-capture-photo]').click();
    const enlarged = page.locator('[data-capture-photo-enlarged] img');
    await expect(enlarged).toBeVisible();
    const sizes = await Promise.all([photo.boundingBox(), enlarged.boundingBox()]);
    expect(sizes[1]?.width ?? 0).toBeGreaterThan((sizes[0]?.width ?? 0) * 3);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-capture-photo-enlarged]')).toHaveCount(0);
  });

  test('measures the distance between two readings, snapping the clicks to them', async ({
    page,
  }) => {
    const camera = cameraOn('LPR-24035', 11);
    await openLpr(page, {
      options: { map: { geometryField: 'location', cameraOptions: camera }, cameraTracking: 'off' },
    });

    const laranjeiras = await pagePointOf(page, camera, 'LPR-24035');
    const carapina = await pagePointOf(page, camera, 'LPR-24010');
    await waitForMarkerAt(page, laranjeiras);

    await control(page, 'measure').click();
    // a few pixels off each reading: the point goes to the reading, not beside it
    await page.mouse.click(laranjeiras.x + 4, laranjeiras.y - 3);
    await page.mouse.click(carapina.x - 3, carapina.y + 4);

    const expected = new DistanceMeasure().format(
      new DistanceMeasure().between(placeOf('LPR-24035').location, placeOf('LPR-24010').location),
      'en-US'
    );
    await expect(page.locator('[data-measure-total]')).toHaveText(expected, { timeout: 15_000 });
    await expect(page.locator('[data-measure-last-leg]')).toHaveText(expected);
    // measuring picks no record
    expect(await currentRecord(page)).toBe('');
  });
});
