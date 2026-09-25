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
  /** Zoom the map in when a record is focused. Does not exist in their layouts. */
  zoomOnClick?: boolean;
  /** Seconds between records during playback. Does not exist in their layouts. */
  playbackInterval?: number;
}

export interface MapgridOptionsEmits {
  'update:zoomOnClick': [value: boolean];
  'update:playbackInterval': [value: number];
}
