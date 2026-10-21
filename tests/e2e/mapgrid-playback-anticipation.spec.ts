/** The gap between consecutive current records, with a fixed latency injected on the collection. */
import { expect, type Page, test } from '@playwright/test';
import {
  ensureTrackCollection,
  ensureTrackMapGrid,
  TRACK_COLLECTION,
} from '../helpers/track-collection';
import { setupTestEnvironment } from '../setup';
import { control, login, openCollection, ROWS } from './helpers/mapgrid-page';

/** Short on purpose: the measurement is about the turns, and a short page turns often. */
const PAGE_SIZE = 5;
const INTERVAL_SECONDS = 1;
/** The network this measurement stands for. */
const LATENCY_MS = 600;
const STEPS = 10;
const SETTLING_MS = 3_000;
/** Timer drift, rendering and the browser's own noise, over a one second beat. */
const TOLERANCE_MS = 250;

interface Mark {
  at: number;
  sequence: number;
}

const observeCurrentRecord = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const marks: { at: number; sequence: number }[] = [];
    (window as unknown as { __marks: typeof marks }).__marks = marks;

    const sequenceOf = (): number | null => {
      const row = document.querySelector('.mapgrid-pane--grid tbody tr.mapgrid-current-row');
      // four digits, and not `\\d+`: the row's text is the name cell glued to the sequence one
      const found = /Point\s+(\d{4})/.exec(row?.textContent ?? '');
      return found?.[1] === undefined ? null : Number(found[1]);
    };

    let last = sequenceOf();
    const observer = new MutationObserver(() => {
      const sequence = sequenceOf();
      if (sequence === null || sequence === last) return;
      last = sequence;
      marks.push({ at: performance.now(), sequence });
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  });
};

const marksOf = (page: Page): Promise<Mark[]> =>
  page.evaluate(() => (window as unknown as { __marks: Mark[] }).__marks);

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? (low + high) / 2 : high;
};

test.beforeAll(async () => {
  await setupTestEnvironment();
  await ensureTrackCollection();
});

test.describe('MapGrid — the playback and the next page', () => {
  test('lands the first record of the next page on the beat, as it does inside a page', async ({
    page,
  }) => {
    await ensureTrackMapGrid({ playbackInterval: INTERVAL_SECONDS }, { limit: PAGE_SIZE });
    await login(page);
    await openCollection(page, TRACK_COLLECTION);

    await page.route(`**/items/${TRACK_COLLECTION}**`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
      await route.continue();
    });

    await page.locator(ROWS).first().click();
    await observeCurrentRecord(page);

    await control(page, 'playback').click();
    await page.waitForTimeout(STEPS * INTERVAL_SECONDS * 1_000 + SETTLING_MS);
    await control(page, 'playback').click();

    const marks = await marksOf(page);
    expect(marks.length, 'the playback walked').toBeGreaterThan(STEPS - 2);

    const gaps = marks.slice(1).map((mark, index) => ({
      /** The first record of a page is the one the turn had to fetch. */
      turn: mark.sequence % PAGE_SIZE === 1,
      ms: Math.round(mark.at - (marks[index]?.at ?? 0)),
      sequence: mark.sequence,
    }));
    const insideAPage = gaps.filter((gap) => !gap.turn).map((gap) => gap.ms);
    const turns = gaps.filter((gap) => gap.turn);

    const beat = median(insideAPage);
    const measurement = [
      `route: ${PAGE_SIZE} per page, ${INTERVAL_SECONDS}s between steps, ${LATENCY_MS}ms of injected latency`,
      `walked: ${marks.map((mark) => mark.sequence).join(', ')}`,
      `every step: ${gaps.map((gap) => `${gap.sequence}${gap.turn ? '*' : ''} ${gap.ms}`).join(', ')} ms — * is a page turn`,
      `inside a page: ${insideAPage.join(', ')} ms — beat ${beat} ms`,
      `page turns: ${turns.map((turn) => `into ${turn.sequence}: ${turn.ms} ms (${turn.ms - beat >= 0 ? '+' : ''}${turn.ms - beat})`).join(', ')}`,
    ].join('\n');
    // the measurement is the point of this spec: it is read from the run's output
    console.log(`\n[playback anticipation]\n${measurement}\n`);
    test.info().annotations.push({ description: measurement, type: 'measurement' });

    expect(turns.length, 'the playback crossed more than one page').toBeGreaterThan(1);

    // the last turn: the first one runs on the default guess
    const last = turns[turns.length - 1];
    expect(
      Math.abs((last?.ms ?? 0) - beat),
      'a page turn takes as long as a step inside the page'
    ).toBeLessThan(TOLERANCE_MS);
  });
});
