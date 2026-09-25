/** A record's primary key, as the Directus layouts hand it over. */
export type RecordId = string | number;

/** Which end of a page a step lands on. */
export type PageEdge = 'first' | 'last';

/**
 * Where a step lands.
 *
 * `page` means the record is not in what is loaded: the query has to move to
 * that page first, and the record is the one at `edge` once it arrives.
 */
export type SequenceStep =
  | { readonly kind: 'item'; readonly page: number; readonly id: RecordId }
  | { readonly kind: 'page'; readonly page: number; readonly edge: PageEdge };

/** The page that is loaded, and where in the query it sits. */
export interface SequencePosition {
  /** The keys of the loaded page's records, in the order the query returned them. */
  readonly ids: readonly RecordId[];
  readonly page: number;
  readonly totalPages: number;
  /** `null` before the first record is chosen, or after the query changed. */
  readonly currentId: RecordId | null;
}

/**
 * The order in which the records are walked.
 *
 * It is the query's order and nothing else: what defines "next" is the `sort`
 * the grid is showing. A step returns `null` when it would leave the query.
 */
export interface IRecordSequence {
  first(position: SequencePosition): SequenceStep | null;
  previous(position: SequencePosition): SequenceStep | null;
  next(position: SequencePosition): SequenceStep | null;
  last(position: SequencePosition): SequenceStep | null;
  /** Whether the current record is the query's first one, or there is none to walk. */
  atStart(position: SequencePosition): boolean;
  /** Whether the current record is the query's last one, or there is none to walk. */
  atEnd(position: SequencePosition): boolean;
  /** The record a `page` step was aiming at, once that page has loaded. */
  atEdge(ids: readonly RecordId[], edge: PageEdge): RecordId | null;
}
