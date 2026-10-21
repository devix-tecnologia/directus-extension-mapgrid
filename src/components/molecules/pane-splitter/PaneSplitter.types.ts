export interface PaneSplitterType {
  models: PaneSplitterModels;
  props: PaneSplitterProps;
  emits: PaneSplitterEmits;
}

export type PaneSplitterModels = Record<string, never>;

/**
 * The handle between the map and the grid. It measures against its parent —
 * the container both panes share — and decides nothing about what the share
 * means: the layout applies and stores it.
 */
export interface PaneSplitterProps {
  /** The map's share of the height, in `[0, 1]`. */
  share: number;
}

export interface PaneSplitterEmits {
  /** While dragging: to draw, not to store. */
  preview: [share: number];
  /** On release, or a key: the share to keep. */
  commit: [share: number];
  /** A double click: back to the default. */
  reset: [];
}
