import type { ITripTimeline, TimelineRange } from './trip-timeline.types';

/** Shorter trips would make a bar without resolution. */
export const MIN_TIMELINE_DURATION_MS = 5 * 60_000;

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

export class TripTimeline implements ITripTimeline {
  private furthest: number | null = null;

  range(first: number | null, last: number | null): TimelineRange | null {
    if (first === null || last === null || !Number.isFinite(first) || !Number.isFinite(last)) {
      return null;
    }
    const start = Math.min(first, last);
    const end = Math.max(first, last);
    return { start, end: Math.max(end, start + MIN_TIMELINE_DURATION_MS) };
  }

  positionOf(instant: number | null, range: TimelineRange | null): number | null {
    if (instant === null || !range || !Number.isFinite(instant)) return null;
    const span = range.end - range.start;
    if (!(span > 0)) return null;
    const position = ((instant - range.start) / span) * 100;
    return Number.isFinite(position) ? clampPercent(position) : null;
  }

  instantAt(position: number, range: TimelineRange): number {
    return range.start + ((range.end - range.start) * clampPercent(position)) / 100;
  }

  advance(position: number): number {
    this.furthest = this.furthest === null ? position : Math.max(this.furthest, position);
    return this.furthest;
  }

  reset(): void {
    this.furthest = null;
  }
}
