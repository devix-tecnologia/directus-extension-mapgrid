/** The features the tour presents, one balloon each. */
export type TourStepId =
  | 'map'
  | 'grid'
  | 'filters'
  | 'navigation'
  | 'playback'
  | 'tracking'
  | 'heading'
  | 'card'
  | 'timeline'
  | 'measure'
  | 'reset';

/** A balloon of the tour and what it points at. */
export interface TourStep {
  id: TourStepId;
  /** A CSS selector of the element the balloon points at. */
  anchor: string;
  /** `layout` looks inside the MapGrid; `page` in the whole app, for the Directus header. */
  scope: 'layout' | 'page';
}

/** Where the tour is: the step, and its place among the steps that can be shown. */
export interface TourPosition {
  step: TourStep;
  /** From 1, as the person reads it. */
  number: number;
  total: number;
}

/**
 * The tour across the MapGrid's features.
 *
 * A step whose element is not on screen — the card with the card off, the
 * timeline without a date — is skipped rather than pointing at nothing, and
 * the count follows: the person reads "3 of 7", not "3 of 11" with holes.
 */
export interface IOnboardingTour {
  /** Starts at the first step that can be shown; `null` when none can. */
  start(canShow: (step: TourStep) => boolean): TourPosition | null;
  /** The next step that can be shown; `null` when the tour is over. */
  next(canShow: (step: TourStep) => boolean): TourPosition | null;
  /** The step before that can be shown; stays put at the first one. */
  previous(canShow: (step: TourStep) => boolean): TourPosition | null;
  /** The step being shown, counted against what can be shown now. */
  current(canShow: (step: TourStep) => boolean): TourPosition | null;
  stop(): void;
}
