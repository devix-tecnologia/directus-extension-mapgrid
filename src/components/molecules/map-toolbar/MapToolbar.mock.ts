import type { MapToolbarType } from './MapToolbar.types';

export const generateMockData = (): MapToolbarType => ({
  props: { atStart: false, atEnd: false, playing: false, loading: false, tracking: 'follow' },
  models: {},
  emits: {
    reset: [],
    first: [],
    previous: [],
    next: [],
    last: [],
    play: [],
    stop: [],
    'update:tracking': ['center'],
  },
});
