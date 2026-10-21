import type { ScreenPoint, ViewportSize } from '../current-point/index';
import type { ITrailPath, TrailSegment } from './trail-path.types';

export const DEFAULT_TRAIL_LENGTH = 20;
export const MAX_TRAIL_LENGTH = 200;

/** In pixels, so the density on screen does not change with the zoom. */
export const ARROW_SPACING_PX = 28;

const OLDEST_OPACITY = 0.3;
/** A leg just outside the pane can still show its halo inside it. */
const OFFSCREEN_MARGIN_PX = 16;

export class TrailPath implements ITrailPath {
  segments(points: readonly (ScreenPoint | null)[], viewport: ViewportSize): TrailSegment[] {
    const legs = points.length - 1;
    const segments: TrailSegment[] = [];

    for (let index = 0; index < legs; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (!from || !to || !this.crosses(from, to, viewport)) continue;

      segments.push({
        points: this.subdivide(from, to),
        opacity: 1 - ((1 - OLDEST_OPACITY) * (legs - index - 1)) / legs,
      });
    }
    return segments;
  }

  lengthFrom(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_TRAIL_LENGTH;
    return Math.min(MAX_TRAIL_LENGTH, Math.max(0, Math.round(value)));
  }

  private crosses(from: ScreenPoint, to: ScreenPoint, viewport: ViewportSize): boolean {
    const left = Math.min(from.x, to.x);
    const right = Math.max(from.x, to.x);
    const top = Math.min(from.y, to.y);
    const bottom = Math.max(from.y, to.y);
    return (
      right >= -OFFSCREEN_MARGIN_PX &&
      bottom >= -OFFSCREEN_MARGIN_PX &&
      left <= viewport.width + OFFSCREEN_MARGIN_PX &&
      top <= viewport.height + OFFSCREEN_MARGIN_PX
    );
  }

  private subdivide(from: ScreenPoint, to: ScreenPoint): ScreenPoint[] {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const pieces = Math.max(1, Math.floor(length / ARROW_SPACING_PX));
    return Array.from({ length: pieces + 1 }, (_, step) => ({
      x: from.x + ((to.x - from.x) * step) / pieces,
      y: from.y + ((to.y - from.y) * step) / pieces,
    }));
  }
}
