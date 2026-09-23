import type { LayoutEmbutido } from '../../../services/embedded-layout/index';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

/**
 * O layout desenha os dois layouts do Directus lado a lado. Ele não busca
 * itens nem guarda estado: recebe os dois embutidos prontos do `setup()`, que é
 * onde eles nascem para alcançarem também o painel de opções.
 */
export interface MapgridLayoutProps {
  grade?: LayoutEmbutido | null;
  mapa?: LayoutEmbutido | null;
  /** Aproximar o mapa ao clicar numa linha. */
  zoomOnClick?: boolean;
}

export type MapgridLayoutEmits = Record<string, never>;

export type MapgridLayoutModels = Record<string, never>;
