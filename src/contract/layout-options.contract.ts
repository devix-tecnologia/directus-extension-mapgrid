/**
 * O que o layout MapGrid guarda no preset do Directus. É a única declaração
 * dessa forma no projeto: os componentes derivam as props daqui com `Pick`, em
 * vez de repetir a lista de campos, para que acrescentar uma opção seja uma
 * edição num arquivo só.
 */

/** Id do layout — o que o `layout` de um preset aponta. */
export const MAPGRID_LAYOUT_ID = 'mapgrid';

/**
 * As colunas da grade são campos numerados em vez de uma lista porque é assim
 * que o preset do Directus já as guarda; mudar para `columns: string[]` quebra
 * os presets existentes. A tupla mantém os nomes num lugar só.
 */
export const COLUMN_KEYS = ['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5'] as const;

export type ColumnKey = (typeof COLUMN_KEYS)[number];

export interface LayoutOptions {
  /** Template do popup do marcador, sobre os campos do item. Vazio → o id. */
  title?: string;
  /** Campo de geolocalização da coleção. Vazio → detectado da coleção. */
  geolocation?: string;
  /** Aproximar o mapa ao clicar numa linha, em vez de só deslocar. */
  zoomOnClick?: boolean;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
}

/**
 * Os campos que descrevem a câmera do mapa. Quem só posiciona o mapa recebe
 * este recorte, e não o preset inteiro.
 */
export type MapCameraOptions = Pick<LayoutOptions, 'mapCenterLng' | 'mapCenterLat' | 'mapZoom'>;

/** Os campos de coluna, sem o resto do preset. */
export type ColumnOptions = Pick<LayoutOptions, ColumnKey>;

const toTrimmedText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

/**
 * O preset chega do Directus como dado do banco, não como `LayoutOptions`: um
 * campo numérico editado na interface pode voltar como string, e um preset
 * antigo pode trazer chaves que não existem mais. Converte cada campo e
 * descarta o que não serve, em vez de asseverar a forma com `as`.
 */
export const normalizeLayoutOptions = (raw: unknown): LayoutOptions => {
  const source: Record<string, unknown> =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const options: LayoutOptions = {
    title: toTrimmedText(source.title),
    geolocation: toTrimmedText(source.geolocation),
    zoomOnClick: toBoolean(source.zoomOnClick),
    mapCenterLng: toFiniteNumber(source.mapCenterLng),
    mapCenterLat: toFiniteNumber(source.mapCenterLat),
    mapZoom: toFiniteNumber(source.mapZoom),
  };

  for (const key of COLUMN_KEYS) {
    options[key] = toTrimmedText(source[key]);
  }

  return options;
};

/**
 * As colunas configuradas, na ordem, sem os espaços vazios. Um usuário pode
 * deixar a coluna 2 em branco e preencher a 3, e a grade não deve abrir uma
 * coluna sem cabeçalho por causa disso.
 */
export const configuredColumns = (options: ColumnOptions): string[] =>
  COLUMN_KEYS.map((key) => options[key]).filter(
    (column): column is string => typeof column === 'string' && column !== ''
  );
