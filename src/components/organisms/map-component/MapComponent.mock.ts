import { mockGeoItems } from '../../../mocks/directus-mocks.js';
import type { MapComponentType } from './MapComponent.types';

export const generateMockData = (): MapComponentType => {
  const props: MapComponentType['props'] = {
    items: mockGeoItems,
    geolocation: 'localizacao',
    title: '{{nome}}',
    zoomOnClick: true,
    centerLng: -46.6333,
    centerLat: -23.5505,
    initialZoom: 10,
  };

  const models: MapComponentType['models'] = {};

  const emits: MapComponentType['emits'] = {
    'select-item': [1],
  };

  return {
    props,
    models,
    emits,
  };
};
