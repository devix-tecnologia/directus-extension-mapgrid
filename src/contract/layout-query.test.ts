import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { LayoutQuery } from '../types';
import { useWritableLayoutQuery } from './layout-query';

const queryRef = (initial: Partial<LayoutQuery> | null = null) =>
  ref(initial as LayoutQuery | null);

describe('useWritableLayoutQuery — reading', () => {
  it('falls back to the first page when the preset has none', () => {
    expect(useWritableLayoutQuery(queryRef()).page.value).toBe(1);
  });

  it('falls back to a page size of 25, which is what Directus itself defaults to', () => {
    expect(useWritableLayoutQuery(queryRef()).limit.value).toBe(25);
  });

  it('falls back to no sort, and not to an arbitrary field', () => {
    expect(useWritableLayoutQuery(queryRef()).sort.value).toEqual([]);
  });

  it('reads what the preset stored', () => {
    const query = useWritableLayoutQuery(queryRef({ page: 3, limit: 50, sort: ['-name'] }));

    expect(query.page.value).toBe(3);
    expect(query.limit.value).toBe(50);
    expect(query.sort.value).toEqual(['-name']);
  });
});

describe('useWritableLayoutQuery — writing', () => {
  it('writes the page back to the preset, so pagination survives a reload', () => {
    const source = queryRef({ page: 1, limit: 25 });
    useWritableLayoutQuery(source).page.value = 4;

    expect(source.value?.page).toBe(4);
  });

  it('writes the sort back, which is what clicking a column header needs', () => {
    const source = queryRef({ page: 1 });
    useWritableLayoutQuery(source).sort.value = ['-status'];

    expect(source.value?.sort).toEqual(['-status']);
  });

  it('preserves the other fields when writing one, instead of replacing the preset', () => {
    const source = queryRef({ page: 2, limit: 50, sort: ['name'], search: 'abc' });
    useWritableLayoutQuery(source).page.value = 3;

    expect(source.value).toMatchObject({ page: 3, limit: 50, sort: ['name'], search: 'abc' });
  });

  it('writes onto an absent preset instead of throwing, which is the state of a fresh layout', () => {
    const source = queryRef(null);
    useWritableLayoutQuery(source).sort.value = ['name'];

    expect(source.value?.sort).toEqual(['name']);
  });
});
