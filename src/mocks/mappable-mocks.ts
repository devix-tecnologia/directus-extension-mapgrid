/**
 * O catálogo de coleções mapeáveis usado por stories e testes.
 *
 * Cada entrada é uma coleção coerente — itens, campos, template do popup,
 * colunas e câmera — e não uma lista solta de pontos. O conjunto existe para
 * demonstrar o que a extensão é: pontos espalhados, pontos aglomerados, pontos
 * dos dois lados da linha de data e uma coleção meio preenchida, todos no mesmo
 * componente. Uma story por tipo cobre o comportamento que cada um exercita.
 */

import type { CollectionFieldSummary } from '../components/templates/mapgrid-options/MapgridOptions.types';
import type { GeoItem, MapCameraOptions, PointCoordinates } from '../contract/index';
import type { Header } from '../services/table/table.types';

export interface MappableKind {
  /** Nome da coleção no Directus. */
  id: string;
  label: string;
  geolocationField: string;
  titleTemplate: string;
  columns: string[];
  camera: MapCameraOptions;
  items: GeoItem[];
}

const pointAt = (coordinates: PointCoordinates) => ({ type: 'Point' as const, coordinates });

const BRASIL: MapCameraOptions = { mapCenterLng: -47.9292, mapCenterLat: -15.7801, mapZoom: 4 };

export const MAPPABLE_KINDS: MappableKind[] = [
  {
    id: 'pontos_turisticos',
    label: 'Pontos espalhados',
    geolocationField: 'localizacao',
    titleTemplate: '{{nome}}',
    columns: ['nome', 'cidade', 'localizacao'],
    camera: BRASIL,
    items: [
      {
        id: 1,
        nome: 'Praça da Sé',
        cidade: 'São Paulo',
        localizacao: pointAt([-46.6333, -23.5505]),
      },
      {
        id: 2,
        nome: 'Museu do Amanhã',
        cidade: 'Rio de Janeiro',
        localizacao: pointAt([-43.1943, -22.8942]),
      },
      {
        id: 3,
        nome: 'Parque Ibirapuera',
        cidade: 'São Paulo',
        localizacao: pointAt([-46.6598, -23.5874]),
      },
      {
        id: 4,
        nome: 'Cristo Redentor',
        cidade: 'Rio de Janeiro',
        localizacao: pointAt([-43.2105, -22.9519]),
      },
      {
        id: 5,
        nome: 'Elevador Lacerda',
        cidade: 'Salvador',
        localizacao: pointAt([-38.5133, -12.9742]),
      },
      {
        id: 6,
        nome: 'Teatro Amazonas',
        cidade: 'Manaus',
        localizacao: pointAt([-60.0234, -3.1301]),
      },
    ],
  },
  {
    id: 'unidades',
    label: 'Pontos aglomerados',
    geolocationField: 'position',
    titleTemplate: '{{codigo}} — {{bairro}}',
    columns: ['codigo', 'bairro', 'status'],
    camera: { mapCenterLng: -46.64, mapCenterLat: -23.55, mapZoom: 12 },
    // doze pontos dentro de poucos quarteirões: é o que faz o agrupamento
    // aparecer, e portanto o único jeito de a story mostrar um cluster
    items: Array.from({ length: 12 }, (_, index) => ({
      id: 100 + index,
      codigo: `UN-${String(index + 1).padStart(3, '0')}`,
      bairro: index % 2 === 0 ? 'Centro' : 'Bela Vista',
      status: index % 3 === 0 ? 'ativo' : 'manutenção',
      position: pointAt([-46.64 + index * 0.004, -23.55 + (index % 4) * 0.004]),
    })),
  },
  {
    id: 'sensores',
    label: 'Pontos dos dois lados da linha de data',
    geolocationField: 'coord',
    titleTemplate: '{{estacao}}',
    columns: ['estacao', 'coord'],
    camera: { mapCenterLng: 179, mapCenterLat: 0, mapZoom: 3 },
    // os dois lados do meridiano 180: exercita o ajuste de volta inteira, sem
    // o qual o popup abre numa cópia do mundo que não está à vista
    items: [
      { id: 'S-1', estacao: 'Taveuni', coord: pointAt([179.97, -16.85]) },
      { id: 'S-2', estacao: 'Vava’u', coord: pointAt([-174.0, -18.65]) },
      { id: 'S-3', estacao: 'Apia', coord: pointAt([-171.76, -13.83]) },
    ],
  },
  {
    id: 'obras',
    label: 'Coleção meio preenchida',
    geolocationField: 'local',
    titleTemplate: '{{titulo}}',
    columns: ['titulo', 'responsavel', 'local'],
    camera: BRASIL,
    // metade dos itens sem ponto: aparecem na grade e não no mapa, que é o
    // comportamento que buildPointFeatureCollection garante
    items: [
      {
        id: 10,
        titulo: 'Ponte do Rio Negro',
        responsavel: 'Equipe Norte',
        local: pointAt([-60.02, -3.13]),
      },
      { id: 11, titulo: 'Viaduto Central', responsavel: 'Equipe Sul', local: null },
      {
        id: 12,
        titulo: 'Contorno Leste',
        responsavel: 'Equipe Leste',
        local: pointAt([-49.27, -25.43]),
      },
      { id: 13, titulo: 'Sem local definido', responsavel: 'Equipe Oeste' },
    ],
  },
];

/** Uma coleção do catálogo pelo nome. Lança para um nome que não existe, para a story falhar alto. */
export const mappableKind = (id: string): MappableKind => {
  const kind = MAPPABLE_KINDS.find((candidate) => candidate.id === id);
  if (!kind) throw new Error(`Coleção mapeável desconhecida: ${id}`);
  return kind;
};

/** A coleção de exemplo padrão. */
export const DEFAULT_KIND_ID = 'pontos_turisticos';

const titleCase = (field: string): string =>
  field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');

/** Os cabeçalhos da grade para as colunas configuradas da coleção. */
export const headersFor = (kindId: string = DEFAULT_KIND_ID): Header[] =>
  mappableKind(kindId).columns.map((column) => ({ text: titleCase(column), value: column }));

/** Os campos da coleção como o painel de opções os enxerga. */
export const fieldsFor = (kindId: string = DEFAULT_KIND_ID): CollectionFieldSummary[] => {
  const kind = mappableKind(kindId);
  const firstItem = kind.items[0] ?? {};

  return Object.keys(firstItem).map((field) => ({
    name: titleCase(field),
    field,
    meta: field === kind.geolocationField ? { interface: 'map' } : null,
  }));
};

/** As opções do preset que essa coleção representa, prontas para espalhar em props. */
export const layoutOptionsFor = (kindId: string = DEFAULT_KIND_ID) => {
  const kind = mappableKind(kindId);
  const [coluna1, coluna2, coluna3, coluna4, coluna5] = kind.columns;

  return {
    title: kind.titleTemplate,
    geolocation: kind.geolocationField,
    zoomOnClick: false,
    ...kind.camera,
    coluna1,
    coluna2,
    coluna3,
    coluna4,
    coluna5,
  };
};

/** Os itens da coleção padrão. Atalho para os mocks que só precisam de uma lista. */
export const mockGeoItems: GeoItem[] = mappableKind(DEFAULT_KIND_ID).items;

/** Os cabeçalhos da coleção padrão. */
export const mockHeaders: Header[] = headersFor();
