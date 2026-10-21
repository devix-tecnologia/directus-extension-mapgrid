import type { Coordinate } from '../item-geometry/index';
import type { RecordId } from '../record-sequence/index';

/** One record the current-record mark has been on. */
export interface Visit {
  id: RecordId;
  /** `null` until the map has a geometry for it — a page that has just landed may not yet. */
  coordinate: Coordinate | null;
}

/**
 * The records visited, in the order they were visited.
 *
 * Kept apart from the page on purpose: the trail and the heading need the
 * record before the current one, and after a page turn it is no longer loaded.
 */
export interface IVisitedPath {
  /** Appends a visit; visiting the record that is already the last one changes nothing. */
  visit(id: RecordId, coordinate: Coordinate | null): void;
  /** The most recent `limit` visits, oldest first. */
  points(limit: number): readonly Visit[];
  /** The current record's visit, if any. */
  last(): Visit | null;
  /** The visit before the current one, if any. */
  previous(): Visit | null;
  /** Fills the coordinates still missing, now that the map may have them. */
  resolve(locate: (id: RecordId) => Coordinate | null): void;
  clear(): void;
}
