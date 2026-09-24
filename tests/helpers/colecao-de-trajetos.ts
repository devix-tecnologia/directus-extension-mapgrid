import type { DirectusCollectionResponse } from './directus-api';
import { apiRequest, resourceExists, unwrapItems } from './directus-api';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const COLECAO_DE_TRAJETOS = 'test_mapgrid_trajetos';

type LngLat = [number, number];

export const TRAJETOS: { name: string; trajeto: { type: 'LineString'; coordinates: LngLat[] } }[] =
  [
    {
      name: 'Rio → São Paulo',
      trajeto: {
        coordinates: [
          [-43.1729, -22.9068],
          [-44.5, -23.0],
          [-46.6333, -23.5505],
        ],
        type: 'LineString',
      },
    },
    {
      name: 'Manaus → Belém',
      trajeto: {
        coordinates: [
          [-60.0255, -3.119],
          [-55.0, -2.5],
          [-48.5044, -1.4558],
        ],
        type: 'LineString',
      },
    },
  ];

/** Uma coleção com geometria nativa do PostGIS, que o layout de mapa trata diferente do json. */
export async function garantirColecaoDeTrajetos(): Promise<void> {
  if (!(await resourceExists(`/collections/${COLECAO_DE_TRAJETOS}`))) {
    await apiRequest('POST', '/collections', {
      collection: COLECAO_DE_TRAJETOS,
      fields: [
        {
          field: 'id',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { has_auto_increment: true, is_primary_key: true },
          type: 'integer',
        },
        { field: 'name', meta: { interface: 'input' }, schema: {}, type: 'string' },
        { field: 'trajeto', meta: { interface: 'map' }, schema: {}, type: 'geometry.LineString' },
      ],
      meta: { icon: 'route' },
      schema: {},
    });
  }

  const existentes = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: number }>>(
      'GET',
      `/items/${COLECAO_DE_TRAJETOS}?fields=id&limit=-1`
    )
  );
  if (existentes.length < TRAJETOS.length) {
    await apiRequest('POST', `/items/${COLECAO_DE_TRAJETOS}`, TRAJETOS);
  }
}

/** O MapGrid sobre os trajetos, com a câmera no Brasil inteiro e sem aproximar ao clicar. */
export async function garantirMapGridDosTrajetos(): Promise<void> {
  await deleteAllPresetsFor(COLECAO_DE_TRAJETOS);
  await apiRequest('POST', '/presets', {
    collection: COLECAO_DE_TRAJETOS,
    layout: 'mapgrid',
    layout_options: {
      mapgrid: {
        map: { cameraOptions: { center: [-50, -15], zoom: 3 }, geometryField: 'trajeto' },
        zoomOnClick: false,
      },
    },
    layout_query: { mapgrid: { fields: ['name'], limit: 25, page: 1, sort: ['name'] } },
  });
}
