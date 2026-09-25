import type { EmbeddedLayout } from '../../../services/embedded-layout/index';

export interface MapgridOptionsType {
  models: MapgridOptionsModels;
  props: MapgridOptionsProps;
  emits: MapgridOptionsEmits;
}

export type MapgridOptionsModels = Record<string, never>;

/**
 * The panel hosts the configuration of both Directus layouts and adds what is
 * only ours. The embedded layouts arrive ready from `setup()`, the same place
 * the layout component receives them from.
 */
export interface MapgridOptionsProps {
  collection: string;
  grid?: EmbeddedLayout | null;
  map?: EmbeddedLayout | null;
  /** Zoom the map in when a row is clicked. Does not exist in their layouts. */
  zoomOnClick?: boolean;
}

export interface MapgridOptionsEmits {
  'update:zoomOnClick': [value: boolean];
}
