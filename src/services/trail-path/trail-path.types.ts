import type { ScreenPoint, ViewportSize } from '../current-point/index';

/** One leg of the trail, from a visited record to the next, ready to draw. */
export interface TrailSegment {
  /** The leg cut into vertices every few pixels, so `marker-mid` repeats the arrow along it. */
  points: ScreenPoint[];
  /** Older legs fade: `1` is the leg that reaches the current record. */
  opacity: number;
}

/**
 * The trail behind the current record.
 *
 * It joins the records that were visited, not the road travelled between them:
 * clicking a row far away draws a long straight leg. It is faithful to what the
 * extension knows.
 */
export interface ITrailPath {
  /** The legs between consecutive visits, oldest first; a `null` breaks the line. */
  segments(points: readonly (ScreenPoint | null)[], viewport: ViewportSize): TrailSegment[];
  /** Reads the length back from the preset: `0` is off, and it never passes the ceiling. */
  lengthFrom(value: unknown): number;
}
