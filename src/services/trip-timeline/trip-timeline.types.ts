/** The span the bar covers, in milliseconds since the epoch. */
export interface TimelineRange {
  start: number;
  end: number;
}

/**
 * The trip laid flat on a time axis — time, not distance, as the playback
 * walks it. Positions are percentages of the bar.
 */
export interface ITripTimeline {
  /** The span between the query's first and last instants, stretched to the minimum duration. */
  range(first: number | null, last: number | null): TimelineRange | null;
  /** Where an instant sits on the bar, in `[0, 100]`; `null` when it cannot be placed. */
  positionOf(instant: number | null, range: TimelineRange | null): number | null;
  /** The instant under a position of the bar. */
  instantAt(position: number, range: TimelineRange): number;
  /**
   * The marker's position during playback. It never goes back: a progress bar
   * walking backwards reads as a defect even when the data is right.
   */
  advance(position: number): number;
  /** Lets the marker go back — a jump the person asked for is not progress. */
  reset(): void;
}
