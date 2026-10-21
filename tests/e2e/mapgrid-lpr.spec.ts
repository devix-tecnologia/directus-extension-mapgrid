/**
 * The GeoHub tracking requests, over a licence plate recognition collection:
 * each test is one item of "Pontos de melhoria para o módulo de tracking" that
 * the MapGrid answers once configured on such a collection.
 */
import { expect, type Page, test } from '@playwright/test';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  FIRST_READING_CAMERA,
  LPR_CAMERAS,
  LPR_COLLECTION,
  LPR_FIELDS,
  lprReadings,
  readingsWith,
  SECOND_READING_CAMERA,
} from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import {
  clickCenterMarker,
  columnCell,
  control,
  currentRecord,
  login,
  openCollection,
  ROWS,
  sortBy,
  visibleColumns,
} from './helpers/mapgrid-page';

const open = async (
  page: Page,
  overrides: Parameters<typeof ensureLprMapGrid>[0] = {}
): Promise<void> => {
  await ensureLprMapGrid(overrides);
  await login(page);
  await openCollection(page, LPR_COLLECTION);
};

const expectCurrent = async (page: Page, text: string): Promise<void> => {
  await expect.poll(() => currentRecord(page), { timeout: 30_000 }).toContain(text);
};

const readingsWhere = (field: string, value: string): number =>
  lprReadings().filter((reading) => reading[field] === value).length;

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid on LPR — list panel', () => {
  test('the grid shows the columns chosen for the investigation layout', async ({ page }) => {
    await open(page);

    expect(await visibleColumns(page)).toEqual(
      LPR_FIELDS.map((field) => field.replace(/_/g, ' '))
    );
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
  ];

  for (const { name, filter, expected } of filters) {
    test(`a filter on the ${name} narrows the readings`, async ({ page }) => {
      await open(page, { filter });

      await expect(page.locator(ROWS)).toHaveCount(expected, { timeout: 30_000 });
    });
  }

  test('sorts by alert status', async ({ page }) => {
    await open(page, { query: { sort: ['alert_status', 'captured_at'] } });

    await expect(await columnCell(page, 'alert status')).toHaveText(/fraud/i, {
      timeout: 30_000,
    });
  });

  test('sorts by municipality from the column header', async ({ page }) => {
    await open(page);

    await sortBy(page, 'municipality', 'desc');

    await expect(await columnCell(page, 'municipality')).toHaveText('Vitória', {
      timeout: 30_000,
    });
  });
});

test.describe('MapGrid on LPR — map panel', () => {
  test('previous and next walk the readings in the order they happened', async ({ page }) => {
    await open(page);

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_READING_CAMERA);

    await control(page, 'next').click();
    await expectCurrent(page, SECOND_READING_CAMERA);

    await control(page, 'previous').click();
    await expectCurrent(page, FIRST_READING_CAMERA);
  });

  test('playback drives the route on its own and stop pauses it', async ({ page }) => {
    await open(page, { options: { playbackInterval: 3 } });

    await control(page, 'playback').click();
    await expectCurrent(page, FIRST_READING_CAMERA);

    await control(page, 'playback').click();
    const stoppedAt = await currentRecord(page);

    await page.waitForTimeout(9_000);
    expect(await currentRecord(page)).toBe(stoppedAt);
  });

  test('clicking a capture on the map marks its reading in the grid', async ({ page }) => {
    // one trip only, so a single reading sits under the camera's point
    const manguinhos = LPR_CAMERAS.find((camera) => camera.label === 'LPR-24052');
    if (!manguinhos) throw new Error('The Manguinhos camera is not seeded');

    await open(page, {
      filter: { alert_status: { _eq: 'robbery' } },
      options: {
        map: {
          geometryField: 'location',
          cameraOptions: { center: manguinhos.location, zoom: 14 },
        },
      },
    });

    await clickCenterMarker(page);
    await expectCurrent(page, manguinhos.label);
  });
});
