/**
 * A field named by its path from the collection: `plate` on the record itself,
 * `smartphone.icon` through a many-to-one relation. Directus asks for such a
 * path as it is, answers with nested objects, and filters by nested objects.
 */
export interface IFieldPath {
  /**
   * The value at the path, following the nested objects Directus returns;
   * `undefined` when absent. Through a list of records (one-to-many,
   * many-to-many) it is the list of their values, flattened, the empty left out.
   */
  valueAt(item: Record<string, unknown> | null | undefined, path: string): unknown;
  /** The first value at the path, for what shows only one — an image; `null` when there is none. */
  firstAt(item: Record<string, unknown> | null | undefined, path: string): unknown;
  /** `{ smartphone: { brand: condition } }` for `smartphone.brand`: how Directus filters through a relation. */
  filterAt(path: string, condition: Record<string, unknown>): Record<string, unknown>;
  /** Whether the path goes through a relation. */
  isRelated(path: string): boolean;
}
