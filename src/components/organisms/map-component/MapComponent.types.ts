import type { GeoItem, MapCameraOptions } from '../../../contract/index';

export interface MapComponentType {
  models: MapComponentModels;
  props: MapComponentProps;
  emits: MapComponentEmits;
}

export type MapComponentModels = Record<string, never>;

/**
 * The camera fields come from the contract under the same names the preset
 * uses, rather than being renamed here: a second set of names per layer only
 * creates a place where swapping longitude for latitude goes unnoticed.
 */
export interface MapComponentProps extends MapCameraOptions {
  items: GeoItem[];
  /** The geolocation field to read on each item. */
  geolocation: string;
  /** Template for the popup label. */
  title: string;
  zoomOnClick?: boolean;
}

export interface MapComponentEmits {
  'select-item': [id: string | number];
}
