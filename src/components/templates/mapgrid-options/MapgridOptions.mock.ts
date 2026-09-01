import type { MapgridOptionsType } from './MapgridOptions.types';

export const generateMockData = (): MapgridOptionsType => {
  const props: MapgridOptionsType['props'] = {
    collection: 'mapgrid',
    layoutOptions: {},
    fieldsInCollection: [
      { name: 'Nome', field: 'nome' },
      { name: 'Localização', field: 'localizacao', meta: { interface: 'map' } },
    ],
    title: '{{nome}}',
    geolocation: 'localizacao',
    coluna1: 'id',
    coluna2: 'nome',
    coluna3: 'localizacao',
    zoomOnClick: true,
    mapCenterLng: -47.9292,
    mapCenterLat: -15.7801,
    mapZoom: 4,
  };

  const models: MapgridOptionsType['models'] = {};

  const emits = {} as MapgridOptionsType['emits'];

  return {
    props,
    models,
    emits,
  };
};
