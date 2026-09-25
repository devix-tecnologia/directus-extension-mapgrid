import type { EmbeddedLayout } from '../../../services/embedded-layout/index';
import type { CollectionSource } from '../../../services/map-centerer/index';

export interface MapgridLayoutType {
  models: MapgridLayoutModels;
  props: MapgridLayoutProps;
  emits: MapgridLayoutEmits;
}

/**
 * The layout draws the two Directus layouts side by side. It neither fetches
 * items nor holds state: it receives both embedded layouts ready from
 * `setup()`, which is where they are born so they also reach the options panel.
 */
export interface MapgridLayoutProps {
  grid?: EmbeddedLayout | null;
  map?: EmbeddedLayout | null;
  /** Zoom the map in when a row is clicked. */
  zoomOnClick?: boolean;
  /** Fetches collection items by primary key, with only the requested fields. */
  fetchItems?: CollectionSource['fetchItems'];
}

export type MapgridLayoutEmits = Record<string, never>;

export type MapgridLayoutModels = Record<string, never>;
