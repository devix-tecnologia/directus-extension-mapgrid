import { describe, expect, it } from 'vitest';
import { MIN_TIMELINE_DURATION_MS, TripTimeline } from './trip-timeline';

const HOUR = 3_600_000;

describe('TripTimeline — the span', () => {
  it('goes from the first instant to the last, in either order', () => {
    const timeline = new TripTimeline();

    expect(timeline.range(0, HOUR)).toEqual({ start: 0, end: HOUR });
    expect(timeline.range(HOUR, 0)).toEqual({ start: 0, end: HOUR });
  });

  it('stretches a short trip to the minimum duration', () => {
    expect(new TripTimeline().range(1_000, 2_000)).toEqual({
      start: 1_000,
      end: 1_000 + MIN_TIMELINE_DURATION_MS,
    });
  });

  it('has no span without both ends', () => {
    expect(new TripTimeline().range(null, HOUR)).toBeNull();
    expect(new TripTimeline().range(0, Number.NaN)).toBeNull();
  });
});

describe('TripTimeline — positions', () => {
  const timeline = new TripTimeline();
  const range = { start: 0, end: 4 * HOUR };

  it('places an instant as a percentage of the bar', () => {
    expect(timeline.positionOf(HOUR, range)).toBe(25);
  });

  it('keeps what falls outside on the bar instead of off it', () => {
    expect(timeline.positionOf(-HOUR, range)).toBe(0);
    expect(timeline.positionOf(5 * HOUR, range)).toBe(100);
  });

  it('places nothing it cannot read, instead of a NaN left', () => {
    expect(timeline.positionOf(null, range)).toBeNull();
    expect(timeline.positionOf(Number.NaN, range)).toBeNull();
    expect(timeline.positionOf(HOUR, { start: HOUR, end: HOUR })).toBeNull();
  });

  it('turns a position back into an instant', () => {
    expect(timeline.instantAt(50, range)).toBe(2 * HOUR);
    expect(timeline.instantAt(150, range)).toBe(4 * HOUR);
  });
});

describe('TripTimeline — the marker during playback', () => {
  it('never walks backwards', () => {
    const timeline = new TripTimeline();

    expect(timeline.advance(30)).toBe(30);
    expect(timeline.advance(20)).toBe(30);
    expect(timeline.advance(45)).toBe(45);
  });

  it('goes back when reset, as a jump the person asked for does', () => {
    const timeline = new TripTimeline();
    timeline.advance(80);
    timeline.reset();

    expect(timeline.advance(10)).toBe(10);
  });
});
