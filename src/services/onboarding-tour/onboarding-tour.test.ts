import { describe, expect, it } from 'vitest';
import { OnboardingTour, TOUR_STEPS } from './onboarding-tour';
import type { TourStep, TourStepId } from './onboarding-tour.types';

const STEPS: TourStep[] = (['map', 'grid', 'card', 'measure'] as TourStepId[]).map((id) => ({
  id,
  anchor: `#${id}`,
  scope: 'layout',
}));

const everything = (): boolean => true;
const without =
  (...missing: TourStepId[]) =>
  (step: TourStep): boolean =>
    !missing.includes(step.id);

describe('OnboardingTour — walking the steps', () => {
  it('starts at the first step and counts from one', () => {
    const position = new OnboardingTour(STEPS).start(everything);

    expect(position).toMatchObject({ step: { id: 'map' }, number: 1, total: 4 });
  });

  it('goes forward and back', () => {
    const tour = new OnboardingTour(STEPS);
    tour.start(everything);

    expect(tour.next(everything)?.step.id).toBe('grid');
    expect(tour.next(everything)?.step.id).toBe('card');
    expect(tour.previous(everything)?.step.id).toBe('grid');
  });

  it('stays on the first step when asked to go back from it', () => {
    const tour = new OnboardingTour(STEPS);
    tour.start(everything);

    expect(tour.previous(everything)?.step.id).toBe('map');
  });

  it('ends after the last step', () => {
    const tour = new OnboardingTour(STEPS);
    tour.start(everything);
    for (const _ of [1, 2, 3]) tour.next(everything);

    expect(tour.next(everything)).toBeNull();
    expect(tour.current(everything)).toBeNull();
  });
});

describe('OnboardingTour — what is not on screen', () => {
  it('skips a step whose element is missing, and leaves it out of the count', () => {
    const tour = new OnboardingTour(STEPS);
    const canShow = without('card');
    tour.start(canShow);
    tour.next(canShow);

    expect(tour.next(canShow)).toMatchObject({ step: { id: 'measure' }, number: 3, total: 3 });
  });

  it('starts at the first step it can show', () => {
    expect(new OnboardingTour(STEPS).start(without('map'))?.step.id).toBe('grid');
  });

  it('has nothing to show when no element is there', () => {
    expect(new OnboardingTour(STEPS).start(() => false)).toBeNull();
  });

  it('counts a step that appeared during the tour', () => {
    const tour = new OnboardingTour(STEPS);
    tour.start(without('card'));

    expect(tour.current(everything)?.total).toBe(4);
  });
});

describe('OnboardingTour — stopping', () => {
  it('shows nothing once stopped, and moves nowhere', () => {
    const tour = new OnboardingTour(STEPS);
    tour.start(everything);
    tour.stop();

    expect(tour.current(everything)).toBeNull();
    expect(tour.next(everything)).toBeNull();
  });
});

describe('OnboardingTour — the MapGrid steps', () => {
  it('presents every feature once, each with an anchor', () => {
    const ids = TOUR_STEPS.map((step) => step.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(TOUR_STEPS.every((step) => step.anchor.length > 0)).toBe(true);
  });
});
