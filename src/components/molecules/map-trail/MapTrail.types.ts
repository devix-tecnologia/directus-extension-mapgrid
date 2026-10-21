import type { TrailSegment } from '../../../services/trail-path/index';

export interface MapTrailType {
  models: MapTrailModels;
  props: MapTrailProps;
  emits: MapTrailEmits;
}

export type MapTrailModels = Record<string, never>;

/** The trail behind the current record, already projected onto the pane. */
export interface MapTrailProps {
  segments: TrailSegment[];
}

export type MapTrailEmits = Record<string, never>;
