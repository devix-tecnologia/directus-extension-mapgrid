import type { MeasureOverlayType } from './MeasureOverlay.types';

export const generateMockData = (): MeasureOverlayType => ({
  props: {
    points: [
      { x: 40, y: 200 },
      { x: 120, y: 120 },
      { x: 200, y: 150 },
    ],
    lastLeg: '2.45 km',
    total: '23.68 km',
  },
  models: {},
  emits: { clear: [], close: [] },
});
