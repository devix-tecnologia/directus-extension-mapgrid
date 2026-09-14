import { DEFAULT_KIND_ID, layoutOptionsFor, mappableKind } from '../../../mocks/mappable-mocks.js';
import type { MapComponentType } from './MapComponent.types';

/**
 * As props do mapa para uma das coleções do catálogo. Uma story por coleção
 * cobre um comportamento diferente do mesmo componente: pontos espalhados,
 * aglomerados, dos dois lados da linha de data e itens sem ponto.
 */
export const mapPropsFor = (kindId: string = DEFAULT_KIND_ID): MapComponentType['props'] => {
  const kind = mappableKind(kindId);
  const options = layoutOptionsFor(kindId);

  return {
    items: kind.items,
    geolocation: kind.geolocationField,
    title: kind.titleTemplate,
    zoomOnClick: options.zoomOnClick,
    mapCenterLng: options.mapCenterLng,
    mapCenterLat: options.mapCenterLat,
    mapZoom: options.mapZoom,
  };
};

export const generateMockData = (): MapComponentType => ({
  props: mapPropsFor(),
  models: {},
  emits: { 'select-item': [1] },
});
