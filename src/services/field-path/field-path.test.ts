import { describe, expect, it } from 'vitest';
import { FieldPath } from './field-path';

const path = new FieldPath();

describe('FieldPath — reading', () => {
  it('reads a field of the record itself', () => {
    expect(path.valueAt({ plate: 'RQP4C58' }, 'plate')).toBe('RQP4C58');
  });

  it('follows a relation into the nested object Directus returns', () => {
    expect(path.valueAt({ smartphone: { icon: 'file-1' } }, 'smartphone.icon')).toBe('file-1');
  });

  it('reads a flat key with the dotted name too, as some responses come', () => {
    expect(path.valueAt({ 'smartphone.icon': 'file-1' }, 'smartphone.icon')).toBe('file-1');
  });

  it('gives null for a relation that is empty, and undefined for one not loaded', () => {
    expect(path.valueAt({ smartphone: null }, 'smartphone.icon')).toBeNull();
    expect(path.valueAt({ plate: 'X' }, 'smartphone.icon')).toBeUndefined();
    expect(path.valueAt(null, 'plate')).toBeUndefined();
  });
});

describe('FieldPath — filtering', () => {
  it('filters a field of the record itself by its name', () => {
    expect(path.filterAt('captured_at', { _gte: '2026' })).toEqual({
      captured_at: { _gte: '2026' },
    });
  });

  it('nests the condition through the relation', () => {
    expect(path.filterAt('smartphone.bought_at', { _lt: '2026' })).toEqual({
      smartphone: { bought_at: { _lt: '2026' } },
    });
  });

  it('knows a related path from one of the record', () => {
    expect(path.isRelated('smartphone.icon')).toBe(true);
    expect(path.isRelated('plate')).toBe(false);
  });
});
