import type { ScreenPoint } from '../../../services/current-point/index';

export interface MeasureOverlayType {
  models: MeasureOverlayModels;
  props: MeasureOverlayProps;
  emits: MeasureOverlayEmits;
}

export type MeasureOverlayModels = Record<string, never>;

/** The marked points, already projected, and their distances, already formatted. */
export interface MeasureOverlayProps {
  /** `null` for a point the camera cannot place right now; the line breaks there. */
  points: (ScreenPoint | null)[];
  /** The leg between the last two points; absent with fewer than two. */
  lastLeg?: string | null;
  total?: string | null;
}

export interface MeasureOverlayEmits {
  clear: [];
  close: [];
}
