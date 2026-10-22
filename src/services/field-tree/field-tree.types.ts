import type { CatalogField, FieldCatalogSource } from '../field-catalog/index';

/** One row of the tree: a field that can be chosen, a relation that can be opened, or both. */
export interface FieldTreeNode {
  /** The path from the collection the tree started at: `smartphone.icon`. */
  path: string;
  /** The field's own name, as the row shows it. */
  name: string;
  field: CatalogField;
  /** The field is of the kind asked for: choosing it ends the picking. */
  selectable: boolean;
  /** The collection the row opens into, when it is a relation leading to something selectable. */
  opensInto: string | null;
}

/** What the picker asks for, and how far it may go. */
export interface FieldTreeQuery {
  accept: (field: CatalogField) => boolean;
  /** How many relations deep; 3 by default, as relations can loop (user → role → users). */
  depth?: number;
}

/**
 * The field tree a picker shows: only the fields of the kind asked for, and the
 * relations that lead to one — a relation with nothing of that kind inside is
 * left out. A row that is both a relation and of the kind asked for, as a file
 * field is for an image, is chosen, not opened.
 */
export interface IFieldTree {
  children(collection: string, query: FieldTreeQuery, parent?: FieldTreeNode): FieldTreeNode[];
}

export type FieldTreeSource = FieldCatalogSource;
