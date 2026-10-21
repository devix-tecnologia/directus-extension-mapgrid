/** The timers the clock runs on — the global ones in production, fake ones in a test. */
export interface ClockTimers {
  set(task: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

/**
 * The playback's beat.
 *
 * A chain of timeouts and not an interval: an interval cannot change its
 * period, and the data's clock asks for a different wait at every step. The
 * wait is read when each beat is scheduled, so it always measures from the
 * record just reached to the next one.
 */
export interface IPlaybackClock {
  readonly running: boolean;
  start(): void;
  stop(): void;
  /** Schedules the next beat from now, with a fresh wait — where a turned page lands. */
  restart(): void;
}
