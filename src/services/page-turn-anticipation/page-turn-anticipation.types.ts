/**
 * How early the playback has to ask for the next page so that it arrives with
 * the step that needs it.
 *
 * The playback walks on a beat. Inside a page a step costs nothing — the
 * records are already in hand — but the step that crosses into the next page
 * waits for a fetch, and the beat skips by however long that fetch takes.
 * Firing the page turn ahead of the beat hides the fetch inside the step that
 * precedes it.
 *
 * How far ahead is not a constant: it is what the fetch is expected to take,
 * which is what the fetches before it took.
 */
export interface IPageTurnAnticipation {
  /** Registers how long a page fetch took. Ignores anything that is not a finite, positive number. */
  measure(durationMs: number): void;
  /** What the next page fetch is expected to take. */
  estimateMs(): number;
  /**
   * How long after the current step to fire the page turn, counted from the
   * step that made the page's last record current. Never negative: an estimate
   * as long as the beat, or longer, fires the turn at once.
   */
  delayMs(intervalMs: number): number;
  /** Forgets what was measured — another query, another cost. */
  reset(): void;
}
