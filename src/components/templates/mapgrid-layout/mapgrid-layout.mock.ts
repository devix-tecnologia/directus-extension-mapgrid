import type { GeoItem } from '../../../services/geo/geo.types.js';
import type { MapgridLayoutType } from './mapgrid-layout.types';

export const mockLayoutItems: GeoItem[] = [
  { id: 1, nome: 'Praça São Paulo', localizacao: { type: 'Point', coordinates: [-46.6333, -23.5505] } },
  { id: 2, nome: 'Museu do Amanhã', localizacao: { type: 'Point', coordinates: [-43.1943, -22.8942] } },
];

export const generateMockData = (): MapgridLayoutType => {
  const props: MapgridLayoutType['props'] = {
    items: mockLayoutItems,
    loading: false,
    collection: 'mapgrid',
    title: '{{nome}}',
    geolocation: 'localizacao',
    coluna1: 'id',
    coluna2: 'nome',
    coluna3: 'localizacao',
    zoomOnClick: true,
  };

  const models: MapgridLayoutType['models'] = {};

  const emits: MapgridLayoutType['emits'] = {};

  return {
    props,
    models,
    emits,
  };
};
