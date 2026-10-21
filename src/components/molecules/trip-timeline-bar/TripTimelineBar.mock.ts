import type { TripTimelineBarType } from './TripTimelineBar.types';

export const generateMockData = (): TripTimelineBarType => ({
  props: {
    startLabel: '27/05/2026 14:23',
    endLabel: '23/06/2026 17:28',
    ticks: [0, 4, 9, 15, 22, 31, 40, 52],
    marker: 22,
    markerLabel: '05/06/2026 16:12',
    disabled: false,
  },
  models: {},
  emits: { seek: [50] },
});
