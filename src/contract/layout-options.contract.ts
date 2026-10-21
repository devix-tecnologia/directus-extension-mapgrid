import type { CameraTracking } from './camera-tracking.contract';

/**
 * Where the current record's arrow takes its direction from.
 *
 * - `off` — no arrow;
 * - `field` — a numeric field of the record, in degrees clockwise from north;
 * - `computed` — the bearing from the record visited before to the current one.
 */
export type HeadingSource = 'off' | 'field' | 'computed';

/**
 * How long playback waits between records.
 *
 * - `fixed` — the same `playbackInterval` for every step;
 * - `realtime` — the time between the records' own instants, sped up by `playbackSpeed`.
 */
export type PlaybackTiming = 'fixed' | 'realtime';

/** What the MapGrid stores in the Directus preset. */
export interface LayoutOptions {
  /** The embedded tabular layout's configuration; the content is Directus'. */
  tabular?: Record<string, unknown>;
  /** The embedded map layout's configuration; the content is Directus'. */
  map?: Record<string, unknown>;
  /** Zoom the map in when a record is focused, instead of keeping the zoom. */
  zoomOnClick?: boolean;
  /** How much the camera chases the current record. */
  cameraTracking?: CameraTracking;
  /** Seconds between records during playback. */
  playbackInterval?: number;
  /** Fixed beat, or the data's own clock. */
  playbackTiming?: PlaybackTiming;
  /** How many times faster than the data's clock, in `realtime`. */
  playbackSpeed?: number;
  /** The date/time field the data's clock is read from; empty, the sort's is suggested. */
  playbackTimeField?: string;
  /** Where the current record's arrow takes its direction from. */
  headingSource?: HeadingSource;
  /** The numeric field read when `headingSource` is `field`. */
  headingField?: string;
  /** How many visited records the trail joins; `0` turns it off. */
  trailLength?: number;
  /** Shows the focused record in a card over the map. */
  showCard?: boolean;
  /** The file field whose image the card shows and enlarges. */
  cardImageField?: string;
  /** The fields the card lists; empty, it lists the grid's columns. */
  cardFields?: string[];
}
