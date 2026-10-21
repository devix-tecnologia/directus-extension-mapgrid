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
 * Picks a field the way Directus does: its own field tree, where every
 * relation opens the related collection's fields, as deep as they go. The
 * value is the path, `smartphone.icon`.
 */
export interface FieldPathSelectProps {
  collection: string;
  /** One path, or the paths in order when `multiple`. */
  modelValue: string | string[] | null;
  multiple?: boolean;
  /** Which fields may be chosen; relations always show, to be opened. */
  accept?: (field: FieldPathOption) => boolean;
  /** Whether a relation itself may be chosen, as a file field is. */
  relationalSelectable?: boolean;
  /** Where the chosen paths get their names (`Smartphone → Icon`); the path when absent. */
  fields?: FieldPathOption[];
  placeholder?: string;
  /** Lets the single choice be cleared. */
  clearable?: boolean;
}

export interface FieldPathSelectEmits {
  'update:modelValue': [value: string | string[] | null];
}
