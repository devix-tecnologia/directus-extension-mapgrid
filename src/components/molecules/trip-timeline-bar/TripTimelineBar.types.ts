export interface TripTimelineBarType {
  models: TripTimelineBarModels;
  props: TripTimelineBarProps;
  emits: TripTimelineBarEmits;
}

export type TripTimelineBarModels = Record<string, never>;

/** The trip on a time axis. It draws positions; what a position means is the layout's. */
export interface TripTimelineBarProps {
  /** The first instant, already formatted for the person's locale. */
  startLabel: string;
  endLabel: string;
  /** The loaded page's records, as positions in `[0, 100]`. */
  ticks: number[];
  /** The current record's position; no marker when `null`. */
  marker: number | null;
  /** The current record's instant, formatted. */
  markerLabel?: string;
  disabled?: boolean;
}

export interface TripTimelineBarEmits {
  /** A position the person released the marker at, in `[0, 100]`. */
  seek: [position: number];
}
