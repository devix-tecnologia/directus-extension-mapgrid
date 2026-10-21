import type { CurrentMarkType } from './CurrentMark.types';

export const generateMockData = (): CurrentMarkType => ({
  props: { x: 120, y: 80, screenAngle: 45, heading: 45 },
  models: {},
  emits: {},
});
