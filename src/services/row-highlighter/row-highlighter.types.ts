/**
 * Marks which grid row is the current record.
 *
 * It does not go through `selection`: that one also arms the bulk actions, so
 * "I am looking at this" would read as "I marked this to be deleted".
 */
export interface IRowHighlighter {
  /** Marks the row at `index` of the loaded page and scrolls it into view; a negative index clears. */
  highlight(index: number): void;
}
