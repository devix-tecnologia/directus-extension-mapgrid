import type { PlaybackTiming } from '../../contract/index';

export type { PlaybackTiming };

export interface TempoOptions {
  /** How many times faster than the data's clock. */
  speed: number;
  /** Without a camera to animate the floor drops, since it exists for the animation. */
  cameraMoves: boolean;
}

/** How long playback waits before the next record. */
export interface IPlaybackTempo {
  /**
   * The wait between two records' instants, in milliseconds since the epoch:
   * sped up, never under the floor nor over the ceiling. A zero or unknown
   * delta lands on the floor; a negative one — a descending sort — counts by
   * its size.
   */
  waitMs(from: number | null, to: number | null, options: TempoOptions): number;
  /** The typical delta of a page, for the step whose next instant has not arrived yet. */
  medianDelta(instants: readonly (number | null)[]): number | null;
  timingFrom(value: unknown): PlaybackTiming;
  speedFrom(value: unknown): number;
}
