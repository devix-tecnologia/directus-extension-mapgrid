import type { CameraTracking } from './camera-tracking.contract';

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
}
