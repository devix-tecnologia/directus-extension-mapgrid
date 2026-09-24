import { COLLECTION_NAME } from '../helper-collection';
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from './directus-api';

export interface Preset {
  id?: string;
  user?: string | null;
  role?: string | null;
  collection: string;
  layout: 'mapgrid';
  layout_query?: Record<string, Record<string, unknown>>;
  layout_options?: Record<string, Record<string, unknown>>;
}

export const mapGridPresetFor = (collection: string): Omit<Preset, 'id'> => ({
  collection,
  layout: 'mapgrid',
  layout_query: {
    mapgrid: {
      page: 1,
      limit: 25,
      sort: ['name'],
      /*
       * As colunas vao explicitas de proposito.
       *
       * Sem `fields`, quem escolhe e o layout tabular do Directus, que mostra
       * todos os campos visiveis da colecao — inclusive `status`. O spec que
       * acrescenta `status` pelo cabecalho entao comecava com ele ja na tela e
       * media nada. A semente passa a dizer de qual estado todo spec parte, em
       * vez de herda-lo de um padrao deles que pode mudar de versao.
       */
      fields: ['name', 'location'],
    },
  },
  layout_options: {
    mapgrid: {
      zoomOnClick: true,
    },
  },
});

/**
 * O mesmo preset, com a camera do mapa ja apontada para um ponto.
 *
 * Existe porque nao ha como achar um marcador num canvas de MapLibre sem saber
 * onde a camera esta, e a instancia do mapa e do layout do Directus — de fora
 * nao se alcanca. Dizendo de onde a camera parte, a projecao vira conta: o
 * ponto semeado cai no centro do canvas, e o clique tem alvo certo.
 *
 * O caminho de mover a camera pela interface nao serve para isso: escrever
 * `cameraOptions` grava no preset mas nao mexe no mapa desenhado (medido em
 * 2026-09-24, ver task-010).
 */
export const mapGridPresetCentradoEm = (
  collection: string,
  centro: [number, number],
  zoom: number,
  opcoes: Record<string, unknown> = {}
): Omit<Preset, 'id'> => {
  const preset = mapGridPresetFor(collection);
  return {
    ...preset,
    layout_options: {
      mapgrid: {
        ...preset.layout_options?.mapgrid,
        ...opcoes,
        map: { geometryField: 'location', cameraOptions: { center: centro, zoom } },
      },
    },
  };
};

export async function deleteAllPresetsFor(collection: string): Promise<void> {
  const query = `filter[collection][_eq]=${collection}&fields=id&limit=-1`;
  const response = await apiRequest<DirectusCollectionResponse<Pick<Preset, 'id'>>>(
    'GET',
    `/presets?${query}`
  );

  for (const preset of unwrapItems(response)) {
    await apiRequest('DELETE', `/presets/${preset.id}`);
  }
}

export async function ensureMapGridPreset(collection: string = COLLECTION_NAME): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', mapGridPresetFor(collection));
}

/** O layout de mapa puro do Directus, sem o MapGrid, para comparar com ele. */
export async function ensureMapLayoutPreset(collection: string): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', {
    collection,
    layout: 'map',
    layout_options: { map: { geometryField: 'location' } },
    layout_query: { map: {} },
  });
}

/** O preset da semente, com a camera do mapa ja apontada para um ponto. */
export async function ensureMapGridPresetCentradoEm(
  centro: [number, number],
  zoom: number,
  collection: string = COLLECTION_NAME,
  opcoes: Record<string, unknown> = {}
): Promise<void> {
  await deleteAllPresetsFor(collection);
  await apiRequest('POST', '/presets', mapGridPresetCentradoEm(collection, centro, zoom, opcoes));
}

/*
 * Qual preset o Directus realmente le.
 *
 * A semente grava um preset global — sem `user` e sem `role`. Quando alguem
 * muda uma opcao do layout pela interface, o Directus nao edita esse global: ele
 * cria um preset novo, so daquela pessoa. Ler "o primeiro preset da colecao"
 * devolve entao o global, que ficou parado no que a semente escreveu, e o teste
 * conclui que nada foi gravado quando na verdade foi gravado em outra linha.
 *
 * A precedencia e a mesma que o Directus aplica: o da pessoa vence o do papel,
 * que vence o global.
 */
const presetPrecedence = (preset: Preset): number => {
  if (preset.user) return 2;
  if (preset.role) return 1;
  return 0;
};

async function readEffectivePreset(collection: string): Promise<Preset | undefined> {
  const query = `filter[collection][_eq]=${collection}&fields=id,user,role,layout_query,layout_options&limit=-1`;
  const response = await apiRequest<DirectusCollectionResponse<Preset>>('GET', `/presets?${query}`);

  return unwrapItems(response).sort((a, b) => presetPrecedence(b) - presetPrecedence(a))[0];
}

/** The layout query currently stored for a collection, where the columns live. */
export async function readMapGridPresetQuery(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const preset = await readEffectivePreset(collection);
  return preset?.layout_query?.mapgrid ?? {};
}

/** The layout options currently stored for a collection, as the API returns them. */
export async function readMapGridPresetOptions(
  collection: string = COLLECTION_NAME
): Promise<Record<string, unknown>> {
  const preset = await readEffectivePreset(collection);
  return preset?.layout_options?.mapgrid ?? {};
}
