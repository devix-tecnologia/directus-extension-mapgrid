import { mockGeoItems, mockHeaders } from '../../../mocks/directus-mocks.js';
import type { GeoItem } from '../../../services/geo/index.js';
import type { TableComponentType } from './TableComponent.types';

const firstItem: GeoItem = {
  id: 1,
  nome: 'Praça São Paulo',
  localizacao: { type: 'Point', coordinates: [-46.6333, -23.5505] },
};

export const generateMockData = (): TableComponentType => {
  const props: TableComponentType['props'] = {
    items: mockGeoItems,
    headers: mockHeaders,
    collection: 'mapgrid',
    selectedItems: [firstItem],
  };

  const models: TableComponentType['models'] = {};

  const emits: TableComponentType['emits'] = {
    'focus-on-item': [firstItem],
    'edit-item': [firstItem],
    'update:selectedItems': [mockGeoItems],
  };

  return {
    props,
    models,
    emits,
  };
};
