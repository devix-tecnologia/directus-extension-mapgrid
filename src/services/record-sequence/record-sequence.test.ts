import { describe, expect, it } from 'vitest';
import { RecordSequence } from './record-sequence';
import type { SequencePosition } from './record-sequence.types';

const sequence = new RecordSequence();

const position = (overrides: Partial<SequencePosition> = {}): SequencePosition => ({
  ids: [1, 2, 3],
  page: 1,
  totalPages: 1,
  currentId: 1,
  ...overrides,
});

describe('RecordSequence — inside the loaded page', () => {
  it('walks forward one record', () => {
    expect(sequence.next(position({ currentId: 2 }))).toEqual({ kind: 'item', page: 1, id: 3 });
  });

  it('walks back one record', () => {
    expect(sequence.previous(position({ currentId: 2 }))).toEqual({ kind: 'item', page: 1, id: 1 });
  });

  it('goes to the first and to the last record of the only page', () => {
    const only = position({ currentId: 2 });

    expect(sequence.first(only)).toEqual({ kind: 'item', page: 1, id: 1 });
    expect(sequence.last(only)).toEqual({ kind: 'item', page: 1, id: 3 });
  });
});

describe('RecordSequence — the edges of the page', () => {
  const middlePage = position({ page: 2, totalPages: 3, ids: [4, 5, 6] });

  it('asks for the next page and its first item when the page ends', () => {
    expect(sequence.next({ ...middlePage, currentId: 6 })).toEqual({
      kind: 'page',
      page: 3,
      edge: 'first',
    });
  });

  it('asks for the previous page and its last item when the page begins', () => {
    expect(sequence.previous({ ...middlePage, currentId: 4 })).toEqual({
      kind: 'page',
      page: 1,
      edge: 'last',
    });
  });

  it('takes first and last to the ends of the query, not of the page', () => {
    expect(sequence.first({ ...middlePage, currentId: 5 })).toEqual({
      kind: 'page',
      page: 1,
      edge: 'first',
    });
    expect(sequence.last({ ...middlePage, currentId: 5 })).toEqual({
      kind: 'page',
      page: 3,
      edge: 'last',
    });
  });
});

describe('RecordSequence — the edges of the query', () => {
  it('does nothing before the first record', () => {
    expect(sequence.previous(position({ currentId: 1 }))).toBeNull();
  });

  it('does nothing after the last record', () => {
    expect(sequence.next(position({ currentId: 3 }))).toBeNull();
  });

  it('reports the ends, so the controls can be disabled there', () => {
    expect(sequence.atStart(position({ currentId: 1 }))).toBe(true);
    expect(sequence.atEnd(position({ currentId: 1 }))).toBe(false);
    expect(sequence.atStart(position({ currentId: 3 }))).toBe(false);
    expect(sequence.atEnd(position({ currentId: 3 }))).toBe(true);
  });

  it('does not call the first item of a middle page a start', () => {
    const middle = position({ page: 2, totalPages: 3, ids: [4, 5, 6], currentId: 4 });

    expect(sequence.atStart(middle)).toBe(false);
    expect(sequence.atEnd({ ...middle, currentId: 6 })).toBe(false);
  });
});

describe('RecordSequence — when the current record is not on the page', () => {
  it('restarts the sequence at the first record of the query', () => {
    const lost = position({ page: 2, totalPages: 2, ids: [4, 5, 6], currentId: 99 });

    expect(sequence.next(lost)).toEqual({ kind: 'page', page: 1, edge: 'first' });
    expect(sequence.previous(lost)).toEqual({ kind: 'page', page: 1, edge: 'first' });
  });

  it('treats no current record the same way', () => {
    expect(sequence.next(position({ currentId: null }))).toEqual({
      kind: 'item',
      page: 1,
      id: 1,
    });
  });

  it('leaves the controls enabled, because a step does start the sequence', () => {
    const none = position({ currentId: null });

    expect(sequence.atStart(none)).toBe(false);
    expect(sequence.atEnd(none)).toBe(false);
  });
});

describe('RecordSequence — an empty page', () => {
  const empty = position({ ids: [], currentId: null });

  it('has nowhere to go', () => {
    expect(sequence.first(empty)).toBeNull();
    expect(sequence.previous(empty)).toBeNull();
    expect(sequence.next(empty)).toBeNull();
    expect(sequence.last(empty)).toBeNull();
  });

  it('disables every control', () => {
    expect(sequence.atStart(empty)).toBe(true);
    expect(sequence.atEnd(empty)).toBe(true);
  });
});

describe('RecordSequence — the item at the edge of a page that just loaded', () => {
  it('reads the end the step asked for', () => {
    expect(sequence.atEdge([7, 8, 9], 'first')).toBe(7);
    expect(sequence.atEdge([7, 8, 9], 'last')).toBe(9);
  });

  it('has no item when the page came back empty', () => {
    expect(sequence.atEdge([], 'first')).toBeNull();
  });
});

describe('RecordSequence — a total of pages that cannot be trusted', () => {
  it('treats zero pages as the single page it is showing', () => {
    const zero = position({ totalPages: 0, currentId: 3 });

    expect(sequence.next(zero)).toBeNull();
    expect(sequence.last(zero)).toEqual({ kind: 'item', page: 1, id: 3 });
  });
});
