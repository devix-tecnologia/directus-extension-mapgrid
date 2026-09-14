import type { GeoItem, MapCameraOptions } from '../../../contract/index.js';

export interface MapComponentType {
  models: MapComponentModels;
  props: MapComponentProps;
  emits: MapComponentEmits;
}

export type MapComponentModels = Record<string, never>;

/**
 * Os campos de câmera vêm do contrato com os mesmos nomes que o preset usa, em
 * vez de serem rebatizados aqui: um par de nomes por camada só cria um ponto
 * onde trocar longitude por latitude passa despercebido.
 */
export interface MapComponentProps extends MapCameraOptions {
  items: GeoItem[];
  /** Campo de geolocalização a ler em cada item. */
  geolocation: string;
  /** Template do rótulo do popup. */
  title: string;
  zoomOnClick?: boolean;
}

export interface MapComponentEmits {
  'select-item': [id: string | number];
}
