/**
 * What a page turn costs during the playback, measured over a thousand-point
 * route — the baseline the task-016 explores anticipating.
 *
 * The seeded eight cities prove the behaviour and measure nothing: the cost
 * only shows up over a route long enough to have pages to turn.
 */
import { expect, type Page, test } from '@playwright/test';
import {
  ensureTrackCollection,
  ensureTrackMapGrid,
  TRACK_COLLECTION,
  TRACK_PAGE_SIZE,
  TRACK_SIZE,
} from '../helpers/track-collection';
import { setupTestEnvironment } from '../setup';
import { control, currentRecord, login, openCollection, ROWS } from './helpers/mapgrid-page';

const STEPS_INSIDE_A_PAGE = 3;
const TURNS_MEASURED = 3;
const PAGES = TRACK_SIZE / TRACK_PAGE_SIZE;

const pointName = (sequence: number): string => `Point ${String(sequence).padStart(4, '0')}`;

const expectCurrent = async (page: Page, sequence: number): Promise<void> => {
  await expect.poll(() => currentRecord(page), { timeout: 30_000 }).toContain(pointName(sequence));
};

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureTrackCollection();
});

test.describe('MapGrid — what the page turn costs', () => {
  test('the steps inside a page fetch nothing, and each turn fetches the same every time', async ({
    page,
  }) => {
    await ensureTrackMapGrid();
    await login(page);
    await openCollection(page, TRACK_COLLECTION);

    /** Every fetch of the collection, by either embedded layout — they share the query, not the request. */
    let fetches: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(`/items/${TRACK_COLLECTION}`)) fetches.push(request.url());
    });
    const counting = (): void => {
      fetches = [];
    };
    /** The fetches that bring records, apart from the `aggregate` ones that only count them. */
    const records = (): number => fetches.filter((url) => !url.includes('aggregate')).length;

    counting();
    for (let step = 0; step < STEPS_INSIDE_A_PAGE; step++) await control(page, 'next').click();
    await expectCurrent(page, STEPS_INSIDE_A_PAGE);
    await page.waitForTimeout(1_000);
    const insideAPage = fetches.length;

    const turns: { aggregates: number; fetches: number; ms: number }[] = [];
    for (let turn = 0; turn < TURNS_MEASURED; turn++) {
      const lastOfPage = (turn + 1) * TRACK_PAGE_SIZE;
      await page
        .locator(ROWS)
        .nth(TRACK_PAGE_SIZE - 1)
        .click();
      await expectCurrent(page, lastOfPage);
      await page.waitForTimeout(1_000);

      counting();
      const started = Date.now();
      await control(page, 'next').click();
      await expectCurrent(page, lastOfPage + 1);
      const ms = Date.now() - started;
      await page.waitForTimeout(1_000);
      turns.push({ aggregates: fetches.length - records(), fetches: records(), ms });
    }

    const perTurn = turns.map((turn) => turn.fetches);
    const slowest = Math.max(...turns.map((turn) => turn.ms));
    const measurement = [
      `route: ${TRACK_SIZE} points, ${TRACK_PAGE_SIZE} per page, ${PAGES} pages`,
      `steps inside a page: ${insideAPage} fetches for ${STEPS_INSIDE_A_PAGE} steps`,
      `page turn: ${perTurn.join(', ')} record fetches, ${turns.map((turn) => turn.aggregates).join(', ')} count queries — ${turns.map((turn) => turn.ms).join(', ')} ms`,
      `a whole playback: ${perTurn[0]} × ${PAGES - 1} turns = ${(perTurn[0] ?? 0) * (PAGES - 1)} fetches`,
    ].join('\n');
    // the measurement is the point of this spec: it is read from the run's output
    console.log(`\n[page-turn cost]\n${measurement}\n`);
    test.info().annotations.push({ description: measurement, type: 'measurement' });

    expect(insideAPage, 'a step inside the loaded page fetches nothing').toBe(0);
    expect(new Set(perTurn).size, 'every turn costs the same').toBe(1);
    // the guard for task-016: one fetch per embedded layout is the measured baseline
    expect(perTurn[0]).toBeGreaterThan(0);
    expect(perTurn[0]).toBeLessThanOrEqual(2);
    expect(slowest).toBeLessThan(10_000);
  });
});
