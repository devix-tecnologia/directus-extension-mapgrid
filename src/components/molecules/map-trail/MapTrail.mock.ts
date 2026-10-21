import { TrailPath } from '../../../services/trail-path/index';
import type { MapTrailType } from './MapTrail.types';

export const generateMockData = (): MapTrailType => ({
  props: {
    segments: new TrailPath().segments(
      [
        { x: 30, y: 140 },
        { x: 110, y: 90 },
        { x: 200, y: 110 },
        { x: 290, y: 40 },
      ],
      { height: 180, width: 320 }
    ),
  },
  models: {},
  emits: {},
});
