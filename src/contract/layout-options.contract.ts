/** O que o MapGrid guarda no preset do Directus. */
export interface LayoutOptions {
  /** A configuração do layout tabular embutido; o conteúdo é do Directus. */
  tabular?: Record<string, unknown>;
  /** A configuração do layout de mapa embutido; o conteúdo é do Directus. */
  map?: Record<string, unknown>;
  /** Aproximar o mapa ao clicar numa linha, em vez de manter o zoom. */
  zoomOnClick?: boolean;
}
