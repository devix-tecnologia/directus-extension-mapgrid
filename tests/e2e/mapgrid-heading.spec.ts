/** Task 019: the current record shows where it is heading. */
import { expect, type Page, test } from '@playwright/test';
import {
  bearingBetween,
  ensureLprCollection,
  FIRST_READING_READER,
  lprReadings,
  placeOf,
  SECOND_READING_READER,
} from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { cameraOn, expectCurrent, openLpr } from './helpers/lpr-page';
import { control, MAP_PANE } from './helpers/mapgrid-page';

const MARK = `${MAP_PANE} [data-current-point]`;

const headingShown = async (page: Page): Promise<number | null> => {
  const mark = page.locator(MARK);
  if ((await mark.count()) === 0) return null;
  const degrees = await mark.getAttribute('data-heading-degrees');
  return degrees === null ? null : Number(degrees);
};

/** A camera still over the first two readings: the arrow is drawn once the camera has landed. */
const camera = cameraOn('LPR-22283', 13);

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — the current record heading', () => {
  test('computed: points from the reading visited before to the current one', async ({ page }) => {
    await openLpr(page, {
      options: {
        headingSource: 'computed',
        cameraTracking: 'off',
        map: { geometryField: 'location', cameraOptions: camera },
      },
    });

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_READING_READER);
    await expect(page.locator(`${MARK} [data-heading-cone]`)).toHaveCount(0);

    await control(page, 'next').click();
    await expectCurrent(page, SECOND_READING_READER);

    const expected = bearingBetween(
      placeOf(FIRST_READING_READER).location,
      placeOf(SECOND_READING_READER).location
    );
    await expect.poll(() => headingShown(page), { timeout: 15_000 }).not.toBeNull();
    expect(Math.abs(((await headingShown(page)) ?? 0) - expected)).toBeLessThanOrEqual(1);
    await expect(page.locator(`${MARK} [data-heading-cone]`)).toHaveCount(1);
  });

  test('field: reads the course of the record, normalising a negative one', async ({ page }) => {
    const [first] = [...lprReadings()].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
    if (!first || first.course >= 0) throw new Error('The seed must open with a negative course');

    await openLpr(page, {
      options: {
        headingSource: 'field',
        headingField: 'course',
        cameraTracking: 'off',
        map: { geometryField: 'location', cameraOptions: camera },
      },
    });

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_READING_READER);

    await expect.poll(() => headingShown(page), { timeout: 15_000 }).toBe(first.course + 360);
  });
});
