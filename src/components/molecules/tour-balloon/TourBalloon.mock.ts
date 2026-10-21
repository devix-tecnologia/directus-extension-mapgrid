import type { TourBalloonType } from './TourBalloon.types';

export const generateMockData = (): TourBalloonType => ({
  props: {
    stepId: 'measure',
    title: 'Measure distances',
    body: 'Turn the ruler on and click the map: near a reading, the point snaps to it. It shows the last leg and the total.',
    number: 3,
    total: 9,
    anchor: { top: 120, left: 260, width: 36, height: 36 },
  },
  models: {},
  emits: { next: [], previous: [], close: [] },
});
