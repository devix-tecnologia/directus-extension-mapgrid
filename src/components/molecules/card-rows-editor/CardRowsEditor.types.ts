import type { CardRowOption } from '../../../services/card-rows/index';

export interface CardRowsEditorType {
  models: CardRowsEditorModels;
  props: CardRowsEditorProps;
  emits: CardRowsEditorEmits;
}

export type CardRowsEditorModels = Record<string, never>;

/**
 * The card's lines in the options: each a Directus display template, which
 * opens the collection's fields and their relations, with a label of its own if
 * wanted. Lines are added, removed and moved up and down.
 */
export interface CardRowsEditorProps {
  collection: string;
  modelValue: CardRowOption[];
  /** The label a line gets when none is written: its first field's name. */
  labelFor?: (template: string) => string;
}

export interface CardRowsEditorEmits {
  'update:modelValue': [rows: CardRowOption[]];
}
