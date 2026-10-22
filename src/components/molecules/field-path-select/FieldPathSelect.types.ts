import type { FieldTreeNode } from '../../../services/field-tree/index';

/** A field as the picker reads it: its path from the collection, and the name to show. */
export interface FieldPathOption {
  field: string;
  name?: string | null;
  type: string;
  meta?: { special?: string[] | null; interface?: string | null } | null;
  schema?: { foreign_key_table?: string | null } | null;
}

export interface FieldPathSelectType {
  models: FieldPathSelectModels;
  props: FieldPathSelectProps;
  emits: FieldPathSelectEmits;
}

export type FieldPathSelectModels = Record<string, never>;

/**
 * Picks a field in a tree of the collection's fields, where a relation opens
 * into the related collection's and only a field of the kind asked for is
 * chosen. The value is the path, `smartphone.icon`.
 */
export interface FieldPathSelectProps {
  collection: string;
  /**
   * The rows under `parent` (the collection's own when absent), already
   * filtered to what this picker accepts: see `FieldTree`.
   */
  nodesOf: (collection: string, parent?: FieldTreeNode) => FieldTreeNode[];
  /** The path chosen. */
  modelValue: string | null;
  /** Where the chosen paths get their names (`Smartphone → Icon`); the path when absent. */
  fields?: FieldPathOption[];
  placeholder?: string;
  /** Lets the single choice be cleared. */
  clearable?: boolean;
}

export interface FieldPathSelectEmits {
  'update:modelValue': [value: string | null];
}
