import type {
  IRecordSequence,
  PageEdge,
  RecordId,
  SequencePosition,
  SequenceStep,
} from './record-sequence.types';

export class RecordSequence implements IRecordSequence {
  first(position: SequencePosition): SequenceStep | null {
    return this.edgeOfQuery(position, 'first');
  }

  last(position: SequencePosition): SequenceStep | null {
    return this.edgeOfQuery(position, 'last');
  }

  next(position: SequencePosition): SequenceStep | null {
    const index = this.indexOfCurrent(position);
    if (index === null) return this.first(position);

    const onPage = position.ids[index + 1];
    if (onPage !== undefined) return { kind: 'item', page: position.page, id: onPage };

    const page = position.page + 1;
    return page > this.pages(position) ? null : { kind: 'page', page, edge: 'first' };
  }

  previous(position: SequencePosition): SequenceStep | null {
    const index = this.indexOfCurrent(position);
    if (index === null) return this.first(position);

    const onPage = position.ids[index - 1];
    if (onPage !== undefined) return { kind: 'item', page: position.page, id: onPage };

    const page = position.page - 1;
    return page < 1 ? null : { kind: 'page', page, edge: 'last' };
  }

  atStart(position: SequencePosition): boolean {
    if (position.ids.length === 0) return true;
    return position.page === 1 && this.indexOfCurrent(position) === 0;
  }

  atEnd(position: SequencePosition): boolean {
    if (position.ids.length === 0) return true;
    return (
      position.page === this.pages(position) &&
      this.indexOfCurrent(position) === position.ids.length - 1
    );
  }

  atEdge(ids: readonly RecordId[], edge: PageEdge): RecordId | null {
    const id = edge === 'first' ? ids[0] : ids[ids.length - 1];
    return id ?? null;
  }

  private edgeOfQuery(position: SequencePosition, edge: PageEdge): SequenceStep | null {
    if (position.ids.length === 0) return null;

    const page = edge === 'first' ? 1 : this.pages(position);
    if (page !== position.page) return { kind: 'page', page, edge };

    const id = this.atEdge(position.ids, edge);
    return id === null ? null : { kind: 'item', page, id };
  }

  /** A grid that has not counted yet reports zero pages; what is on screen is one. */
  private pages(position: SequencePosition): number {
    return Math.max(1, position.totalPages, position.page);
  }

  /** `null` when the current record is not in the loaded page — the sequence lost its place. */
  private indexOfCurrent(position: SequencePosition): number | null {
    if (position.currentId === null) return null;
    const index = position.ids.indexOf(position.currentId);
    return index === -1 ? null : index;
  }
}
