import { describe, expect, it } from 'vitest';
import { ARROW_SPACING_PX, DEFAULT_TRAIL_LENGTH, MAX_TRAIL_LENGTH, TrailPath } from './trail-path';

const trail = new TrailPath();
const VIEWPORT = { height: 400, width: 800 };

describe('TrailPath — the legs', () => {
  it('draws one leg between each pair of visits', () => {
    const segments = trail.segments(
      [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 100 },
      ],
      VIEWPORT
    );

    expect(segments).toHaveLength(2);
  });

  it('fades the older legs and keeps the newest one solid', () => {
    const segments = trail.segments(
      [
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      VIEWPORT
    );

    const opacities = segments.map((segment) => segment.opacity);
    expect(opacities[2]).toBe(1);
    expect(opacities[0]).toBeLessThan(opacities[1] ?? 0);
  });

  it('breaks the line at a visit that could not be placed', () => {
    const segments = trail.segments(
      [{ x: 10, y: 10 }, null, { x: 100, y: 100 }, { x: 200, y: 100 }],
      VIEWPORT
    );

    expect(segments).toHaveLength(1);
  });

  it('drops a leg that is wholly outside the pane', () => {
    const segments = trail.segments(
      [
        { x: -500, y: -500 },
        { x: -400, y: -450 },
        { x: 100, y: 100 },
      ],
      VIEWPORT
    );

    expect(segments).toHaveLength(1);
  });

  it('cuts a long leg into vertices for the arrows to sit on', () => {
    const [segment] = trail.segments(
      [
        { x: 0, y: 0 },
        { x: ARROW_SPACING_PX * 4, y: 0 },
      ],
      VIEWPORT
    );

    expect(segment?.points).toHaveLength(5);
    expect(segment?.points[4]).toEqual({ x: ARROW_SPACING_PX * 4, y: 0 });
  });

  it('draws nothing with fewer than two visits', () => {
    expect(trail.segments([{ x: 1, y: 1 }], VIEWPORT)).toEqual([]);
    expect(trail.segments([], VIEWPORT)).toEqual([]);
  });
});

describe('TrailPath — the length the preset asks for', () => {
  it('defaults, turns off at zero and stops at the ceiling', () => {
    expect(trail.lengthFrom(undefined)).toBe(DEFAULT_TRAIL_LENGTH);
    expect(trail.lengthFrom(0)).toBe(0);
    expect(trail.lengthFrom(5000)).toBe(MAX_TRAIL_LENGTH);
    expect(trail.lengthFrom(-3)).toBe(0);
    expect(trail.lengthFrom(7.6)).toBe(8);
  });
});
