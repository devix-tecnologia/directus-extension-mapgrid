/** A box on the page, in pixels from the top-left corner of the viewport. */
export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Which side of the anchor the balloon sits on. */
export type BalloonSide = 'bottom' | 'top' | 'right' | 'left';

export interface BalloonPlace {
  side: BalloonSide;
  top: number;
  left: number;
  /** Where the arrow meets the balloon's edge, in pixels along it, pointing at the anchor's middle. */
  arrow: number;
}

/** Where a balloon goes so it points at its anchor and stays on screen. */
export interface IBalloonPlacement {
  /**
   * The first side with room — below, above, right, left — and the position
   * along it clamped to the viewport. When no side has room the balloon goes
   * where there is the most of it, still clamped.
   */
  place(anchor: Box, balloon: Size, viewport: Size): BalloonPlace;
}
