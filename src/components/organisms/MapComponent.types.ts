export interface MapComponentType {
  models: MapComponentModels;
  props: MapComponentProps;
  emits: MapComponentEmits;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MapComponentModels = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MapComponentProps = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MapComponentEmits = Record<string, never>;
