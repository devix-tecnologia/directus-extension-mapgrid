/** Task 022: the trip as a timeline, which navigates when dragged. */
import { expect, type Page, test } from '@playwright/test';
import { ensureLprCollection, FIRST_READING_READER, lprReadings } from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { expectCurrent, openLpr } from './helpers/lpr-page';
import { control } from './helpers/mapgrid-page';

const TIMELINE = '[data-timeline]';

/** Drags the marker from wherever the press lands to a position of the bar, in percent. */
const dragTo = async (page: Page, percent: number): Promise<void> => {
  const track = page.locator(`${TIMELINE} [role="slider"]`);
  const box = await track.boundingBox();
  if (!box) throw new Error('The timeline has no bounding box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + (box.width * percent) / 100, y, { steps: 8 });
  await page.mouse.up();
};

const lastReading = () => {
  const readings = [...lprReadings()].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  return readings[readings.length - 1];
};

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — the timeline', () => {
  test('shows the whole trip, a tick per loaded reading and the current one', async ({ page }) => {
    await openLpr(page, { options: { cameraTracking: 'off' } });

    const timeline = page.locator(TIMELINE);
    await expect(timeline).toBeVisible({ timeout: 30_000 });
    await expect(timeline.locator('[data-timeline-tick]')).toHaveCount(25);
    await expect(timeline.locator('[data-timeline-marker]')).toHaveCount(0);

    await control(page, 'next').click();
    await expectCurrent(page, FIRST_READING_READER);
    await expect(timeline.locator('[data-timeline-marker]')).toHaveAttribute(
      'data-position',
      '0.00'
    );
  });

  test('dragging to the end lands on the last reading, on its own page', async ({ page }) => {
    await openLpr(page, { options: { cameraTracking: 'off' } });
    await expect(page.locator(TIMELINE)).toBeVisible({ timeout: 30_000 });

    await dragTo(page, 100);

    const last = lastReading();
    if (!last) throw new Error('The seed has no readings');
    await expectCurrent(page, last.equipment_label);
    await expect(page.locator(`${TIMELINE} [data-timeline-marker]`)).toHaveAttribute(
      'data-position',
      '100.00'
    );
  });

  test('dragging back to the start goes to the first reading', async ({ page }) => {
    await openLpr(page, { options: { cameraTracking: 'off' } });
    await expect(page.locator(TIMELINE)).toBeVisible({ timeout: 30_000 });

    await dragTo(page, 100);
    await dragTo(page, 0);

    await expectCurrent(page, FIRST_READING_READER);
  });

  test('is not there when the sort holds no date and none was chosen', async ({ page }) => {
    await openLpr(page, { query: { sort: ['plate'] } });

    await page.waitForTimeout(3_000);
    await expect(page.locator(TIMELINE)).toHaveCount(0);
  });
});
