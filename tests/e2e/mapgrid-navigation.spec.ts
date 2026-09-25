/**
 * Walking and playing back the records.
 *
 * Only the e2e can prove this. Storybook does not reach the Directus layouts —
 * there the SDK is a mock of ours and the layout registry does not exist — so
 * what the unit tests cover is the sequence and the toolbar, and what is left
 * for here is the composition against the real grid, the real map and the real
 * preset.
 *
 * The page size is seeded at three, against eight seeded cities, so the query
 * has three pages: turning the page is a step like any other, not a scenario
 * that needs a collection of its own.
 */
import { expect, type Page, test } from '@playwright/test';
import { ensureMapGridPreset, readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  clickCenterMarker,
  control,
  currentRecord,
  login,
  openCollection,
  rowOf,
} from './helpers/mapgrid-page';

/** Sorted by `name`, which is what the seeded preset asks for. */
const PAGE_ONE = ['Belo Horizonte', 'Brasilia', 'Curitiba'];
const FIRST_OF_PAGE_TWO = 'Manaus';
const LAST_RECORD = 'Sao Paulo';
const PAGE_SIZE = 3;

/** The most isolated seeded city, and a camera that puts it at the centre. */
const MANAUS: [number, number] = [-60.0255, -3.119];
const CITY_ZOOM = 12;

const openWith = async (
  page: Page,
  options: Record<string, unknown> = {},
  query: Record<string, unknown> = {}
): Promise<void> => {
  await ensureMapGridPreset(undefined, {
    options,
    query: { limit: PAGE_SIZE, ...query },
  });
  await login(page);
  await openCollection(page);
};

const expectCurrent = async (page: Page, name: string): Promise<void> => {
  await expect.poll(() => currentRecord(page), { timeout: 30_000 }).toContain(name);
};

/** Where the Directus map layout says its camera is — it writes it to the preset on `moveend`. */
const cameraCenter = async (): Promise<number[] | undefined> => {
  const map = (await readMapGridPresetOptions()).map as
    | { cameraOptions?: { center?: number[] } }
    | undefined;
  return map?.cameraOptions?.center;
};

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — walking the records', () => {
  test('next advances one record and the mark follows it', async ({ page }) => {
    await openWith(page);

    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[0] as string);

    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[1] as string);
  });

  test('previous undoes the step', async ({ page }) => {
    await openWith(page);

    await control(page, 'next').click();
    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[1] as string);

    await control(page, 'previous').click();
    await expectCurrent(page, PAGE_ONE[0] as string);
  });

  test('first and last land on the ends of the query, not of the page', async ({ page }) => {
    await openWith(page);

    await control(page, 'last').click();
    await expectCurrent(page, LAST_RECORD);
    await expect(control(page, 'last')).toBeDisabled();

    await control(page, 'first').click();
    await expectCurrent(page, PAGE_ONE[0] as string);
    await expect(control(page, 'first')).toBeDisabled();
  });

  test('the page turns in both directions, landing on the right end of it', async ({ page }) => {
    await openWith(page);

    await rowOf(page, PAGE_ONE[2] as string).click();
    await expectCurrent(page, PAGE_ONE[2] as string);

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_OF_PAGE_TWO);

    await control(page, 'previous').click();
    await expectCurrent(page, PAGE_ONE[2] as string);
  });
});

test.describe('MapGrid — the current record', () => {
  test('clicking a marker sets it, and does not leave the MapGrid', async ({ page }) => {
    await openWith(
      page,
      { map: { geometryField: 'location', cameraOptions: { center: MANAUS, zoom: CITY_ZOOM } } },
      { page: 2 }
    );

    await clickCenterMarker(page);

    await expectCurrent(page, FIRST_OF_PAGE_TWO);
    await expect(page).toHaveURL(/\/admin\/content\/test_mapgrid_items(\?|$)/);
  });

  test('it is not the selection, so the bulk actions stay disarmed', async ({ page }) => {
    await openWith(page);

    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[0] as string);

    const marked = rowOf(page, PAGE_ONE[0] as string).getByRole('checkbox');
    await expect(marked).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('MapGrid — playback', () => {
  test('walks on its own and stops where it was told to', async ({ page }) => {
    await openWith(page, { playbackInterval: 1 });

    await control(page, 'playback').click();
    await expectCurrent(page, PAGE_ONE[1] as string);

    await control(page, 'playback').click();
    const stoppedAt = await currentRecord(page);

    await page.waitForTimeout(4_000);
    expect(await currentRecord(page)).toBe(stoppedAt);
  });
});

test.describe('MapGrid — the camera tracking', () => {
  test('leaves the camera where it is when tracking is off', async ({ page }) => {
    await openWith(page, { cameraTracking: 'off' });

    // the map writes its camera once it settles; the step is measured from there
    await page.waitForTimeout(5_000);
    const before = await cameraCenter();

    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[0] as string);
    await page.waitForTimeout(4_000);

    expect(await cameraCenter()).toEqual(before);
  });

  test('moves at every step when the record is to be kept centred', async ({ page }) => {
    await openWith(page, { cameraTracking: 'center' });

    await page.waitForTimeout(5_000);
    const before = await cameraCenter();

    await control(page, 'next').click();
    await expectCurrent(page, PAGE_ONE[0] as string);

    await expect.poll(cameraCenter, { timeout: 30_000 }).not.toEqual(before);
  });
});
