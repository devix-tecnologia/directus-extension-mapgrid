import type { MapgridOptionsType } from './MapgridOptions.types';

export const generateMockData = (): MapgridOptionsType => {
  const props: MapgridOptionsType['props'] = {
    collection: 'mapgrid',
    layoutOptions: {},
    fieldsInCollection: [],
    title: '{{nome}}',
    geolocation: 'localizacao',
    coluna1: 'id',
    coluna2: 'nome',
    coluna3: 'localizacao',
    zoomOnClick: true,
  };

  const models: MapgridOptionsType['models'] = {};

  const emits = {} as MapgridOptionsType['emits'];

  return {
    props,
    models,
    emits,
  };
};
