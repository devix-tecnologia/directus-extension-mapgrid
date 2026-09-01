import { mockGeoItems } from '../../../mocks/directus-mocks.js';
import type { MapgridLayoutType } from './MapgridLayout.types';

export const generateMockData = (): MapgridLayoutType => {
  const props: MapgridLayoutType['props'] = {
    items: mockGeoItems,
    loading: false,
    collection: 'mapgrid',
    title: '{{nome}}',
    geolocation: 'localizacao',
    mapCenterLng: -46.6333,
    mapCenterLat: -23.5505,
    mapZoom: 10,
    coluna1: 'id',
    coluna2: 'nome',
    coluna3: 'localizacao',
    zoomOnClick: true,
    selectedItems: mockGeoItems.slice(0, 1),
  };

  const models: MapgridLayoutType['models'] = {};

  const emits: MapgridLayoutType['emits'] = {
    'update:selectedItems': [mockGeoItems],
  };

  return {
    props,
    models,
    emits,
  };
};
