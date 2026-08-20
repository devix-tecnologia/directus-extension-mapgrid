import type { GeoItem } from '../../../services/geo/geo.types.js';
import type { MapComponentType } from './map-component.types';

export const mockGeoItems: GeoItem[] = [
  {
    id: 1,
    nome: 'Praça São Paulo',
    localizacao: { type: 'Point', coordinates: [-46.6333, -23.5505] },
  },
  {
    id: 2,
    nome: 'Museu do Amanhã',
    localizacao: { type: 'Point', coordinates: [-43.1943, -22.8942] },
  },
];

export const generateMockData = (): MapComponentType => {
  const props: MapComponentType['props'] = {
    items: mockGeoItems,
    geolocation: 'localizacao',
    title: '{{nome}}',
    zoomOnClick: true,
  };

  const models: MapComponentType['models'] = {};

  const emits = {} as MapComponentType['emits'];

  return {
    props,
    models,
    emits,
  };
};
