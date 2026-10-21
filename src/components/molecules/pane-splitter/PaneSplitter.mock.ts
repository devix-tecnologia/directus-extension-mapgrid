import type { PaneSplitterType } from './PaneSplitter.types';

export const generateMockData = (): PaneSplitterType => ({
  props: { share: 0.6 },
  models: {},
  emits: { preview: [0.5], commit: [0.5], reset: [] },
});
