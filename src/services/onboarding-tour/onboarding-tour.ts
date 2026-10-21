import type { IOnboardingTour, TourPosition, TourStep } from './onboarding-tour.types';

/** The order the features are presented in: what is on screen first, then what it does. */
export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'map', anchor: '.mapgrid-pane--map', scope: 'layout' },
  { id: 'grid', anchor: '.mapgrid-pane--grid', scope: 'layout' },
  { id: 'filters', anchor: '.header-bar .search-input', scope: 'page' },
  { id: 'navigation', anchor: '[data-control="next"]', scope: 'layout' },
  { id: 'playback', anchor: '[data-control="playback"]', scope: 'layout' },
  { id: 'tracking', anchor: '[data-control="tracking"]', scope: 'layout' },
  { id: 'heading', anchor: '[data-current-point]', scope: 'layout' },
  { id: 'card', anchor: '[data-capture-card]', scope: 'layout' },
  { id: 'timeline', anchor: '[data-timeline]', scope: 'layout' },
  { id: 'measure', anchor: '[data-control="measure"]', scope: 'layout' },
  { id: 'reset', anchor: '[data-control="reset"]', scope: 'layout' },
];

export class OnboardingTour implements IOnboardingTour {
  /** Where the tour stands in `steps`; `null` while it is not running. */
  private at: number | null = null;

  constructor(private readonly steps: readonly TourStep[] = TOUR_STEPS) {}

  start(canShow: (step: TourStep) => boolean): TourPosition | null {
    this.at = this.find(0, 1, canShow);
    return this.current(canShow);
  }

  next(canShow: (step: TourStep) => boolean): TourPosition | null {
    if (this.at === null) return null;
    this.at = this.find(this.at + 1, 1, canShow);
    return this.current(canShow);
  }

  previous(canShow: (step: TourStep) => boolean): TourPosition | null {
    if (this.at === null) return null;
    const before = this.find(this.at - 1, -1, canShow);
    if (before !== null) this.at = before;
    return this.current(canShow);
  }

  current(canShow: (step: TourStep) => boolean): TourPosition | null {
    if (this.at === null) return null;
    const step = this.steps[this.at];
    if (!step) return null;

    const shown = this.steps.filter((candidate) => candidate === step || canShow(candidate));
    return { step, number: shown.indexOf(step) + 1, total: shown.length };
  }

  stop(): void {
    this.at = null;
  }

  private find(
    from: number,
    direction: 1 | -1,
    canShow: (step: TourStep) => boolean
  ): number | null {
    for (let index = from; index >= 0 && index < this.steps.length; index += direction) {
      const step = this.steps[index];
      if (step && canShow(step)) return index;
    }
    return null;
  }
}
