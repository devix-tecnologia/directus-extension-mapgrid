export interface CurrentMarkType {
  models: CurrentMarkModels;
  props: CurrentMarkProps;
  emits: CurrentMarkEmits;
}

export type CurrentMarkModels = Record<string, never>;

/** The current record over the map: a ring, and a cone when there is a direction to show. */
export interface CurrentMarkProps {
  /** Pixels from the left of the map pane. */
  x: number;
  /** Pixels from the top of the map pane. */
  y: number;
  /** The angle the cone is drawn at, clockwise from the top of the pane; no cone when `null`. */
  screenAngle?: number | null;
  /** The geographic heading, in degrees from north — what the record says, before the camera's rotation. */
  heading?: number | null;
}

export type CurrentMarkEmits = Record<string, never>;
