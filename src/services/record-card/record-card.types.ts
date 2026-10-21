/** A collection field, reduced to what the card reads from it. */
export interface CardField {
  field: string;
  /** The translated name Directus shows; the key when absent. */
  name?: string | null;
  type: string;
  meta?: {
    options?: { choices?: unknown } | null;
    display_options?: { choices?: unknown } | null;
  } | null;
}

/** One line of the card. */
export interface CardRow {
  field: string;
  label: string;
  value: string;
}

/** Turns a record into the lines its card shows, formatted the way the grid would show them. */
export interface IRecordCard {
  /**
   * The rows for `fields`, in that order. A field the collection does not have,
   * or whose value is an object — a geometry, a relation — is left out: the
   * card is text.
   */
  rows(
    item: Record<string, unknown>,
    fields: readonly string[],
    schema: readonly CardField[],
    locale: string
  ): CardRow[];
  /** `lat, lng`, the order people read coordinates in. */
  coordinates(coordinate: readonly [number, number], locale: string): string;
}
