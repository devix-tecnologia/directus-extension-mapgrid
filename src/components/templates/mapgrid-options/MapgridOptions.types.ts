import type { LayoutEmbutido } from '../../../services/embedded-layout/index';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

/**
 * O painel hospeda a configuração dos dois layouts do Directus e acrescenta o
 * que é só nosso. Os embutidos chegam prontos do `setup()`, que é o mesmo
 * lugar de onde o componente do layout os recebe.
 */
export interface MapgridOptionsProps {
  collection: string;
  grade?: LayoutEmbutido | null;
  mapa?: LayoutEmbutido | null;
  /** Aproximar o mapa ao clicar numa linha. Não existe nos layouts deles. */
  zoomOnClick?: boolean;
}

export interface MapgridOptionsEmits {
  'update:zoomOnClick': [value: boolean];
}
