import type { CameraTracking } from '../../../services/camera-tracking/index';

export interface MapToolbarType {
  models: MapToolbarModels;
  props: MapToolbarProps;
  emits: MapToolbarEmits;
}

export type MapToolbarModels = Record<string, never>;

/** The toolbar draws state; it decides nothing. Who is the current record is the template's. */
export interface MapToolbarProps {
  /** The current record is the query's first one: there is nothing to go back to. */
  atStart?: boolean;
  /** The current record is the query's last one: there is nothing to go forward to. */
  atEnd?: boolean;
  playing?: boolean;
  /** The page is still being fetched, so a step would run over the old list. */
  loading?: boolean;
  tracking?: CameraTracking;
}

export interface MapToolbarEmits {
  reset: [];
  first: [];
  previous: [];
  next: [];
  last: [];
  play: [];
  stop: [];
  'update:tracking': [CameraTracking];
}
