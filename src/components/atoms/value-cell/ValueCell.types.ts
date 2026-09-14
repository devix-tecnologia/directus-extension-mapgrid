export interface ValueCellType {
  models: ValueCellModels;
  props: ValueCellProps;
  emits: ValueCellEmits;
}

export type ValueCellModels = Record<string, never>;

export interface ValueCellProps {
  value: unknown;
}

export type ValueCellEmits = Record<string, never>;
