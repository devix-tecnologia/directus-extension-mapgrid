import type {
  BalloonPlace,
  BalloonSide,
  Box,
  IBalloonPlacement,
  Size,
} from './balloon-placement.types';

/** Between the anchor and the balloon, where the arrow is. */
export const BALLOON_GAP_PX = 14;
/** Kept free between the balloon and the viewport's edges. */
export const VIEWPORT_MARGIN_PX = 8;
/** The arrow never sits on the rounded corner. */
const ARROW_INSET_PX = 18;

const SIDES: readonly BalloonSide[] = ['bottom', 'top', 'right', 'left'];

const clamp = (value: number, low: number, high: number): number =>
  high < low ? low : Math.min(high, Math.max(low, value));

export class BalloonPlacement implements IBalloonPlacement {
  place(anchor: Box, balloon: Size, viewport: Size): BalloonPlace {
    const room: Record<BalloonSide, number> = {
      bottom: viewport.height - (anchor.top + anchor.height) - BALLOON_GAP_PX - VIEWPORT_MARGIN_PX,
      top: anchor.top - BALLOON_GAP_PX - VIEWPORT_MARGIN_PX,
      right: viewport.width - (anchor.left + anchor.width) - BALLOON_GAP_PX - VIEWPORT_MARGIN_PX,
      left: anchor.left - BALLOON_GAP_PX - VIEWPORT_MARGIN_PX,
    };
    const needs = (side: BalloonSide): number =>
      side === 'bottom' || side === 'top' ? balloon.height : balloon.width;

    const side =
      SIDES.find((candidate) => room[candidate] >= needs(candidate)) ??
      [...SIDES].sort((a, b) => room[b] - needs(b) - (room[a] - needs(a)))[0] ??
      'bottom';

    return side === 'bottom' || side === 'top'
      ? this.vertical(side, anchor, balloon, viewport)
      : this.horizontal(side, anchor, balloon, viewport);
  }

  private vertical(
    side: 'bottom' | 'top',
    anchor: Box,
    balloon: Size,
    viewport: Size
  ): BalloonPlace {
    const centre = anchor.left + anchor.width / 2;
    const left = clamp(
      centre - balloon.width / 2,
      VIEWPORT_MARGIN_PX,
      viewport.width - balloon.width - VIEWPORT_MARGIN_PX
    );
    const top =
      side === 'bottom'
        ? anchor.top + anchor.height + BALLOON_GAP_PX
        : anchor.top - BALLOON_GAP_PX - balloon.height;
    return {
      side,
      top: clamp(top, VIEWPORT_MARGIN_PX, viewport.height - balloon.height - VIEWPORT_MARGIN_PX),
      left,
      arrow: clamp(centre - left, ARROW_INSET_PX, balloon.width - ARROW_INSET_PX),
    };
  }

  private horizontal(
    side: 'right' | 'left',
    anchor: Box,
    balloon: Size,
    viewport: Size
  ): BalloonPlace {
    const centre = anchor.top + anchor.height / 2;
    const top = clamp(
      centre - balloon.height / 2,
      VIEWPORT_MARGIN_PX,
      viewport.height - balloon.height - VIEWPORT_MARGIN_PX
    );
    const left =
      side === 'right'
        ? anchor.left + anchor.width + BALLOON_GAP_PX
        : anchor.left - BALLOON_GAP_PX - balloon.width;
    return {
      side,
      top,
      left: clamp(left, VIEWPORT_MARGIN_PX, viewport.width - balloon.width - VIEWPORT_MARGIN_PX),
      arrow: clamp(centre - top, ARROW_INSET_PX, balloon.height - ARROW_INSET_PX),
    };
  }
}
