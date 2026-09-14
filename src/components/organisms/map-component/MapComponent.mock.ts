import { DEFAULT_KIND_ID, layoutOptionsFor, mappableKind } from '../../../mocks/mappable-mocks';
import type { MapComponentType } from './MapComponent.types';

/**
 * The map's props for one of the catalogue's collections. One story per
 * collection covers a different behaviour of the same component: scattered
 * points, clustered ones, both sides of the date line, and items with no point.
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
