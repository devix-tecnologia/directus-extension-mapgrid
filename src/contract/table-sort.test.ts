import { describe, expect, it } from 'vitest';
import { fromTableSort, toTableSort } from './table-sort';

describe('toTableSort', () => {
  it('reads an ascending field', () => {
    expect(toTableSort(['name'])).toEqual({ by: 'name', desc: false });
  });

  it('reads the leading minus as descending, which is how Directus writes it', () => {
    expect(toTableSort(['-name'])).toEqual({ by: 'name', desc: true });
  });

  it('reports no sort when the query has none, rather than picking a field', () => {
    expect(toTableSort(undefined)).toEqual({ by: null, desc: false });
    expect(toTableSort([])).toEqual({ by: null, desc: false });
  });

  it('takes the first field, because the table sorts by one at a time', () => {
    expect(toTableSort(['-city', 'name'])).toEqual({ by: 'city', desc: true });
  });
});

describe('fromTableSort', () => {
  it('writes an ascending field as the bare name', () => {
    expect(fromTableSort({ by: 'name', desc: false })).toEqual(['name']);
  });

  it('writes a descending field with the leading minus', () => {
    expect(fromTableSort({ by: 'name', desc: true })).toEqual(['-name']);
  });

  it('writes an empty list when the sort was cleared', () => {
    expect(fromTableSort({ by: null, desc: false })).toEqual([]);
  });
});

describe('the two directions together', () => {
  it('survives a round trip, so reading and writing cannot disagree', () => {
    for (const sort of [['name'], ['-city'], []]) {
      expect(fromTableSort(toTableSort(sort))).toEqual(sort);
    }
  });
});
