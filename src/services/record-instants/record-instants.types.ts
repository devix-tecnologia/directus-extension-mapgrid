import type { RecordId } from '../record-sequence/index';

/** A field of the collection, reduced to what the suggestion needs. */
export interface FieldSummary {
  field: string;
  type: string;
}

/** When each record happened, read from a date/time field. */
export interface IRecordInstants {
  /** The instant already known, in milliseconds since the epoch; `null` when unknown or unreadable. */
  instantOf(id: RecordId, field: string): number | null;
  /** The instants of `ids`, fetching what the page does not carry. */
  load(ids: readonly RecordId[], field: string): Promise<ReadonlyMap<RecordId, number | null>>;
  /**
   * The first date/time field of the sort, offered when none was chosen — and
   * only offered: clicking a column header must not change what the clock means.
   */
  suggestedField(
    sort: readonly string[] | undefined,
    fields: readonly FieldSummary[]
  ): string | null;
}
