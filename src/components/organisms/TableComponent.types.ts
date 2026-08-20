export interface TableComponentType {
  models: TableComponentModels;
  props: TableComponentProps;
  emits: TableComponentEmits;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TableComponentModels = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TableComponentProps = Record<string, never>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TableComponentEmits = Record<string, never>;
