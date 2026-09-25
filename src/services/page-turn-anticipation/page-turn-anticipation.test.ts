import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE_FETCH_MS,
  MEASUREMENT_WINDOW,
  PageTurnAnticipation,
} from './page-turn-anticipation';

describe('PageTurnAnticipation — what the next fetch is expected to take', () => {
  it('assumes a fast fetch while nothing has been measured', () => {
    expect(new PageTurnAnticipation().estimateMs()).toBe(DEFAULT_PAGE_FETCH_MS);
  });

  it('takes the measurement over the guess as soon as there is one', () => {
    const anticipation = new PageTurnAnticipation();

    anticipation.measure(700);

    expect(anticipation.estimateMs()).toBe(700);
  });

  it('widens with the slowest of the recent fetches, so one slow page is enough', () => {
    const anticipation = new PageTurnAnticipation();

    anticipation.measure(100);
    anticipation.measure(900);
    anticipation.measure(120);

    expect(anticipation.estimateMs()).toBe(900);
  });

  it('forgets a slow fetch once it is out of the window, instead of pessimism for good', () => {
    const anticipation = new PageTurnAnticipation();

    anticipation.measure(900);
    for (let fetch = 0; fetch < MEASUREMENT_WINDOW; fetch++) anticipation.measure(100);

    expect(anticipation.estimateMs()).toBe(100);
  });

  it('ignores what is not a duration, rather than anticipating by a NaN', () => {
    const anticipation = new PageTurnAnticipation();

    anticipation.measure(Number.NaN);
    anticipation.measure(-30);
    anticipation.measure(Number.POSITIVE_INFINITY);

    expect(anticipation.estimateMs()).toBe(DEFAULT_PAGE_FETCH_MS);
  });

  it('goes back to the guess when the query changes, because the cost is another one', () => {
    const anticipation = new PageTurnAnticipation();

    anticipation.measure(900);
    anticipation.reset();

    expect(anticipation.estimateMs()).toBe(DEFAULT_PAGE_FETCH_MS);
  });
});

describe('PageTurnAnticipation — when to fire the page turn', () => {
  it('fires it early by what the fetch is expected to take', () => {
    const anticipation = new PageTurnAnticipation();
    anticipation.measure(600);

    expect(anticipation.delayMs(2_000)).toBe(1_400);
  });

  /*
   * The cap: earlier than this the page turn would land while records of the
   * outgoing page are still to be walked, and those records would lose their
   * point on the map — the map layout only holds the page it is showing.
   */
  it('fires it at once when the fetch is expected to take a whole beat or more', () => {
    const anticipation = new PageTurnAnticipation();
    anticipation.measure(3_000);

    expect(anticipation.delayMs(2_000)).toBe(0);
  });

  it('never asks to have fired it in the past', () => {
    const anticipation = new PageTurnAnticipation();
    anticipation.measure(2_000);

    expect(anticipation.delayMs(2_000)).toBe(0);
  });
});
