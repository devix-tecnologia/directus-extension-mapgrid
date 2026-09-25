import type { IPageTurnAnticipation } from './page-turn-anticipation.types';

/**
 * What a page fetch is assumed to take before any has been measured. Short on
 * purpose: over-guessing turns the page ahead of time, and a playback that
 * crosses a single boundary would pay for the guess with no chance to correct
 * it.
 */
export const DEFAULT_PAGE_FETCH_MS = 250;

/** How many of the recent fetches the estimate looks at. */
export const MEASUREMENT_WINDOW = 3;

export class PageTurnAnticipation implements IPageTurnAnticipation {
  private readonly recent: number[] = [];

  measure(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) return;

    this.recent.push(durationMs);
    if (this.recent.length > MEASUREMENT_WINDOW) this.recent.shift();
  }

  /** The slowest of the window: one slow fetch widens the lead at once, one fast one does not narrow it. */
  estimateMs(): number {
    return this.recent.length === 0 ? DEFAULT_PAGE_FETCH_MS : Math.max(...this.recent);
  }

  delayMs(intervalMs: number): number {
    return Math.max(0, intervalMs - this.estimateMs());
  }

  reset(): void {
    this.recent.length = 0;
  }
}
