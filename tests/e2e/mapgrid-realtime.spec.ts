/** Task 021: playback keeps the data's own clock, sped up. */
import { expect, test } from '@playwright/test';
import { ensureLprCollection, FIRST_READING_READER } from '../helpers/lpr-collection';
import { setupTestEnvironment } from '../setup';
import { expectCurrent, openLpr } from './helpers/lpr-page';
import { control, currentRecord } from './helpers/mapgrid-page';

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureLprCollection();
});

test.describe('MapGrid — playback on the data clock', () => {
  test('waits in proportion to the gaps between the readings', async ({ page }) => {
    // the first trip's gaps: 6, 5, 9 and 4 minutes — at 60× that is 6s, 5s, 9s, 4s; long
    // enough that a stall of the browser in the container does not move the ratio
    await openLpr(page, {
      options: {
        cameraTracking: 'off',
        playbackTiming: 'realtime',
        playbackSpeed: 60,
        playbackTimeField: 'captured_at',
      },
    });

    await control(page, 'playback').click();
    // counted from a record known by name: the first step can land before the polling starts,
    // and counting changes from there shifted every wait by one
    await expectCurrent(page, FIRST_READING_READER);

    const changes: number[] = [];
    let last = await currentRecord(page);
    const deadline = Date.now() + 45_000;
    while (changes.length < 4 && Date.now() < deadline) {
      await page.waitForTimeout(25);
      const now = await currentRecord(page);
      if (now !== last) {
        changes.push(Date.now());
        last = now;
      }
    }
    await control(page, 'playback').click();
    expect(changes).toHaveLength(4);

    // the changes are the 2nd to the 5th readings: the waits between them are 5, 9 and 4 minutes
    const waits = changes.slice(1).map((at, index) => at - (changes[index] as number));
    // what is asserted is the ratio, not the absolute value: 9 minutes against 4
    const ratio = (waits[1] as number) / (waits[2] as number);
    expect(ratio).toBeGreaterThan(1.6);
    expect(ratio).toBeLessThan(3);
    // and 5 minutes against 4: close, but the longer is not the shorter
    expect(waits[0] as number).toBeGreaterThan((waits[2] as number) * 1.1);
  });
});
