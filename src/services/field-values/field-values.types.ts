import type { CollectionSource } from '../map-centerer/index';
import type { RecordId } from '../record-sequence/index';

/**
 * Values of a field the grid does not show, for records it does.
 *
 * Loaded through `fetchItems` and never by adding the field to
 * `layoutQuery.fields`: those are the person's columns, and a column appearing
 * because an option needed it would be a surprise.
 */
export interface IFieldValues {
  /** What is already known — from the loaded items or the cache — without asking the server. */
  peek(id: RecordId, field: string): unknown;
  /** Every value under `ids`, asking the server only for the ones not known yet. */
  load(ids: readonly RecordId[], field: string): Promise<ReadonlyMap<RecordId, unknown>>;
  /** Forgets the cache: the query changed, and the values may be another's. */
  clear(): void;
}

export interface FieldValuesSource {
  /** The primary key field's name; `null` before the collection is known. */
  primaryKey(): string | null;
  /** The items of the grid's page, which may already carry the field. */
  gridItems: CollectionSource['gridItems'];
  fetchItems: CollectionSource['fetchItems'];
}
