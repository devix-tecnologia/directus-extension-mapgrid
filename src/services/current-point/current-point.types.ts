import type { ViewportSize } from '../map-centerer/index';

export type { ViewportSize };

/** A position, in pixels, from the top-left corner of the map pane. */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Where the current record's own point goes on top of the map.
 *
 * It exists because of the clustering: with `clusterData` on, the record's
 * point is swallowed by the cluster and the playback becomes invisible. The
 * cluster is an option of the Directus map, stored in the preset, so it is not
 * turned off — the point is drawn beside the map instead.
 */
export interface ICurrentPoint {
  /** `null` when the item has no readable geometry, or the map has not said where its camera is. */
  screenPointOf(item: Record<string, unknown>): ScreenPoint | null;
}
