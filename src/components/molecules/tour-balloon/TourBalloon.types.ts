import type { Box } from '../../../services/balloon-placement/index';

export interface TourBalloonType {
  models: TourBalloonModels;
  props: TourBalloonProps;
  emits: TourBalloonEmits;
}

export type TourBalloonModels = Record<string, never>;

/** One balloon of the tour, pointing at a feature. The tour itself is the layout's. */
export interface TourBalloonProps {
  /** Which feature, for the e2e and the analytics of whoever embeds it. */
  stepId: string;
  title: string;
  body: string;
  /** From 1. */
  number: number;
  total: number;
  /** The feature's box on the page; the balloon waits for it. */
  anchor: Box | null;
}

export interface TourBalloonEmits {
  next: [];
  previous: [];
  close: [];
}
