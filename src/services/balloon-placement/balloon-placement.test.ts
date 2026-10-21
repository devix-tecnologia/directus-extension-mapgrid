import { describe, expect, it } from 'vitest';
import { BALLOON_GAP_PX, BalloonPlacement, VIEWPORT_MARGIN_PX } from './balloon-placement';

const placement = new BalloonPlacement();
const VIEWPORT = { width: 1600, height: 1000 };
const BALLOON = { width: 320, height: 160 };

describe('BalloonPlacement — the side', () => {
  it('goes below the anchor when there is room', () => {
    const place = placement.place(
      { top: 100, left: 700, width: 40, height: 40 },
      BALLOON,
      VIEWPORT
    );

    expect(place.side).toBe('bottom');
    expect(place.top).toBe(140 + BALLOON_GAP_PX);
    // centred under the anchor, and the arrow at the anchor's middle
    expect(place.left).toBe(720 - 160);
    expect(place.arrow).toBe(160);
  });

  it('goes above when the anchor is at the bottom of the screen', () => {
    const place = placement.place(
      { top: 900, left: 700, width: 40, height: 40 },
      BALLOON,
      VIEWPORT
    );

    expect(place.side).toBe('top');
    expect(place.top).toBe(900 - BALLOON_GAP_PX - 160);
  });

  it('goes to a side when a tall anchor leaves no room above or below', () => {
    const place = placement.place(
      { top: 50, left: 300, width: 600, height: 900 },
      BALLOON,
      VIEWPORT
    );

    expect(place.side).toBe('right');
    expect(place.left).toBe(900 + BALLOON_GAP_PX);
  });

  it('goes where there is the most room when no side fits, still on screen', () => {
    const place = placement.place(
      { top: 0, left: 0, width: 1600, height: 1000 },
      BALLOON,
      VIEWPORT
    );

    expect(place.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN_PX);
    expect(place.top + BALLOON.height).toBeLessThanOrEqual(VIEWPORT.height - VIEWPORT_MARGIN_PX);
  });
});

describe('BalloonPlacement — staying on screen', () => {
  it('slides along the edge for an anchor in the corner, keeping the arrow on it', () => {
    const place = placement.place(
      { top: 100, left: 1560, width: 32, height: 32 },
      BALLOON,
      VIEWPORT
    );

    expect(place.left).toBe(VIEWPORT.width - BALLOON.width - VIEWPORT_MARGIN_PX);
    // the anchor's middle is at 1576; the arrow goes as near as the rounded corner lets it
    expect(place.left + place.arrow).toBe(1592 - 18);
  });

  it('keeps the arrow off the rounded corners', () => {
    const place = placement.place({ top: 100, left: 0, width: 4, height: 4 }, BALLOON, VIEWPORT);

    expect(place.arrow).toBeGreaterThanOrEqual(18);
  });
});
