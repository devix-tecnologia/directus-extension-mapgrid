import type { HeadingSource, PlaybackTiming } from '../../../contract/index';
import type { CameraTracking } from '../../../services/camera-tracking/index';
import type { CardRowOption } from '../../../services/card-rows/index';
import type { EmbeddedLayout } from '../../../services/embedded-layout/index';
import type { CollectionSource } from '../../../services/map-centerer/index';
import type { CardField } from '../../../services/record-card/index';

/** A collection field, as `useCollection` lists it. */
export type CollectionField = CardField;

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
  /** Fixed beat, or the data's own clock. */
  playbackTiming?: PlaybackTiming;
  /** How many times faster than the data's clock. */
  playbackSpeed?: number;
  /** The field the data's clock is read from; empty, the sort's date is used. */
  playbackTimeField?: string;
  /** Where the current record's arrow takes its direction from. */
  headingSource?: HeadingSource;
  /** The numeric course field, for `headingSource: 'field'`. */
  headingField?: string;
  /** How many visited records the trail joins; `0` turns it off. */
  trailLength?: number;
  /** Shows the focused record in a card over the map. */
  showCard?: boolean;
  /** The file field whose image the card shows. */
  cardImageField?: string;
  /** The fields the card lists; empty, the grid's columns. */
  cardFields?: string[];
  /** The card's lines, a display template each; `cardFields` is read as lines when this is empty. */
  cardRows?: CardRowOption[];
  /** The grid's columns, `layoutQuery.fields`. */
  gridFields?: string[];
  /** The query's sort, which says which date the clock suggests. */
  sort?: string[];
  /** The collection's fields, for the card's labels and the time field's suggestion. */
  fieldsInCollection?: CollectionField[];
  /** The collection's fields and, one many-to-one away, the related ones, by path (`smartphone.icon`). */
  fieldsWithRelated?: CollectionField[];
  /** The primary key field, to read the records the card and the arrow fetch. */
  primaryKeyField?: { field: string } | null;
  /** The whole query's first and last values of a field, as the server returns them. */
  fetchTimeRange?: (field: string) => Promise<{ first: unknown; last: unknown }>;
  /** The record at or right after an instant and its page, when the query is sorted by that field. */
  locateInstant?: (
    field: string,
    instant: number
  ) => Promise<{ id: string | number; page: number } | null>;
  /** The address of a file of the project. */
  assetUrl?: (id: string) => string;
  /** Opens the tour of the features on the first visit of each browser. */
  tourOnFirstVisit?: boolean;
  /** The collection, which keys what the browser remembers of the tour. */
  collection?: string;
  /** Closes the Directus right sidebar, which the app opens on wide screens. */
  collapseSidebar?: () => void;
  /** The map's share of the height, as stored in the preset. */
  mapShare?: number;
  /** Stores the share — a callback for the same reason as `setCameraTracking`. */
  setMapShare?: (share: number) => void;
}

export type MapgridLayoutEmits = Record<string, never>;

export type MapgridLayoutModels = Record<string, never>;
