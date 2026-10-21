import { describe, expect, it } from 'vitest';
import type { IFieldValues } from '../field-values/index';
import type { RecordId } from '../record-sequence/index';
import { RecordInstants } from './record-instants';

const valuesOf = (known: Record<string, unknown>): IFieldValues => ({
  peek: (id: RecordId) => known[String(id)],
  load: async (ids: readonly RecordId[]) =>
    new Map(ids.map((id) => [id, known[String(id)] ?? null] as const)),
  clear: () => {},
});

describe('RecordInstants', () => {
  it('reads an ISO date as milliseconds since the epoch', () => {
    const instants = new RecordInstants(valuesOf({ 1: '2026-06-05T19:12:06.000Z' }));

    expect(instants.instantOf(1, 'captured_at')).toBe(Date.UTC(2026, 5, 5, 19, 12, 6));
  });

  it('has no instant for what is not a date', () => {
    const instants = new RecordInstants(valuesOf({ 1: 'soon', 2: null, 3: '' }));

    expect(instants.instantOf(1, 'captured_at')).toBeNull();
    expect(instants.instantOf(2, 'captured_at')).toBeNull();
    expect(instants.instantOf(3, 'captured_at')).toBeNull();
  });

  it('loads several at once, unknown ones included', async () => {
    const instants = new RecordInstants(valuesOf({ 1: '2026-01-01T00:00:00Z' }));

    const loaded = await instants.load([1, 2], 'captured_at');

    expect(loaded.get(1)).toBe(Date.UTC(2026, 0, 1));
    expect(loaded.get(2)).toBeNull();
  });
});

describe('RecordInstants — the field it suggests', () => {
  const fields = [
    { field: 'name', type: 'string' },
    { field: 'captured_at', type: 'timestamp' },
    { field: 'day', type: 'date' },
  ];
  const instants = new RecordInstants(valuesOf({}));

  it('is the first date/time field of the sort, whatever the direction', () => {
    expect(instants.suggestedField(['-captured_at'], fields)).toBe('captured_at');
    expect(instants.suggestedField(['name', 'day'], fields)).toBe('day');
  });

  it('is nothing when the sort holds no date', () => {
    expect(instants.suggestedField(['name'], fields)).toBeNull();
    expect(instants.suggestedField(undefined, fields)).toBeNull();
  });
});
