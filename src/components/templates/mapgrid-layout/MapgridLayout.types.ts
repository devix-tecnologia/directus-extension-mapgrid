import type { CameraTracking } from '../../../services/camera-tracking/index';
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
  /** Zoom the map in when a record is focused. Orthogonal to whether the camera moves. */
  zoomOnClick?: boolean;
  /** Fetches collection items by primary key, with only the requested fields. */
  fetchItems?: CollectionSource['fetchItems'];
  /** The page of the shared query. The layout owns it; the template only reads. */
  page?: number;
  /** Asks the layout to move the shared query to another page — the only way to turn it. */
  goToPage?: (page: number) => void;
  /** How much the camera chases the current record. Persisted in the preset. */
  cameraTracking?: CameraTracking;
  /**
   * Persists the tracking state. A callback and not an emit because Directus
   * binds the `setup()` state into this component, and does not route an
   * `update:` back — the options panel's emits work because their slot does.
   */
  setCameraTracking?: (tracking: CameraTracking) => void;
  /** Seconds between records during playback. */
  playbackInterval?: number;
  /**
   * Changes whenever filter, search, sort or limit changed — that is, whenever
   * the sequence became another one and the current record no longer means
   * anything. The layout builds it, because it is the one holding the query.
   */
  queryKey?: string;
}

export type MapgridLayoutEmits = Record<string, never>;

export type MapgridLayoutModels = Record<string, never>;
