import type { GeoItem } from '../../../services/geo/geo.types.js';
import type { Header } from '../../../services/table/table.types.js';
import type { TableComponentType } from './TableComponent.types';

export const mockTableItems: GeoItem[] = [
  { id: 1, nome: 'Praça São Paulo', localizacao: { type: 'Point', coordinates: [-46.6333, -23.5505] } },
  { id: 2, nome: 'Museu do Amanhã', localizacao: { type: 'Point', coordinates: [-43.1943, -22.8942] } },
  { id: 3, nome: 'Parque Ibirapuera', localizacao: { type: 'Point', coordinates: [-46.6598, -23.5874] } },
];

export const mockTableHeaders: Header[] = [
  { text: 'ID', value: 'id' },
  { text: 'Nome', value: 'nome' },
  { text: 'Localização', value: 'localizacao' },
];

export const generateMockData = (): TableComponentType => {
  const props: TableComponentType['props'] = {
    items: mockTableItems,
    headers: mockTableHeaders,
    collection: 'mapgrid',
  };

  const models: TableComponentType['models'] = {};

  const emits = {} as TableComponentType['emits'];

  return {
    props,
    models,
    emits,
  };
};
