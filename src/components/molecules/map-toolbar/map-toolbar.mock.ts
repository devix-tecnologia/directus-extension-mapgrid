import type { MapToolbarType } from './map-toolbar.types';

export const generateMockData = (): MapToolbarType => {
  const props: MapToolbarType['props'] = {};

  const models: MapToolbarType['models'] = {};

  const emits = {} as MapToolbarType['emits'];

  return {
    props,
    models,
    emits,
  };
};
