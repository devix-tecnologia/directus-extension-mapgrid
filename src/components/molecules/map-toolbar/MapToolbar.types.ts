export interface MapToolbarType {
  models: MapToolbarModels;
  props: MapToolbarProps;
  emits: MapToolbarEmits;
}

export type MapToolbarModels = Record<string, never>;

export type MapToolbarProps = Record<string, never>;

export interface MapToolbarEmits {
  reset: [];
}
