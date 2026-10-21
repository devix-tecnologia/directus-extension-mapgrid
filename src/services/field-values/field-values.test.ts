import { describe, expect, it, vi } from 'vitest';
import { FieldValues } from './field-values';
import type { FieldValuesSource } from './field-values.types';

const source = (
  gridItems: Record<string, unknown>[],
  server: Record<string, unknown>[] = []
): FieldValuesSource & { fetchItems: ReturnType<typeof vi.fn> } => ({
  primaryKey: () => 'id',
  gridItems: () => gridItems,
  fetchItems: vi.fn(async (keys: readonly unknown[]) =>
    server.filter((item) => keys.includes(item.id))
  ),
});

describe('FieldValues', () => {
  it('reads what the grid already loaded, without asking the server', async () => {
    const from = source([{ id: 1, course: 90 }]);
    const values = new FieldValues(from);

    expect(values.peek(1, 'course')).toBe(90);
    expect((await values.load([1], 'course')).get(1)).toBe(90);
    expect(from.fetchItems).not.toHaveBeenCalled();
  });

  it('asks only for the field and the key, and only for what is missing', async () => {
    const from = source([{ id: 1 }, { id: 2, course: 10 }], [{ id: 1, course: -137 }]);
    const values = new FieldValues(from);

    const loaded = await values.load([1, 2], 'course');

    expect(from.fetchItems).toHaveBeenCalledWith([1], ['id', 'course']);
    expect(loaded.get(1)).toBe(-137);
    expect(loaded.get(2)).toBe(10);
  });

  it('remembers what it fetched', async () => {
    const from = source([{ id: 1 }], [{ id: 1, course: 45 }]);
    const values = new FieldValues(from);

    await values.load([1], 'course');
    await values.load([1], 'course');

    expect(from.fetchItems).toHaveBeenCalledTimes(1);
    expect(values.peek(1, 'course')).toBe(45);
  });

  it('remembers a record the server did not return as having no value', async () => {
    const from = source([{ id: 1 }], []);
    const values = new FieldValues(from);

    expect((await values.load([1], 'course')).get(1)).toBeNull();
    await values.load([1], 'course');
    expect(from.fetchItems).toHaveBeenCalledTimes(1);
  });

  it('asks again after being cleared', async () => {
    const from = source([{ id: 1 }], [{ id: 1, course: 45 }]);
    const values = new FieldValues(from);

    await values.load([1], 'course');
    values.clear();
    await values.load([1], 'course');

    expect(from.fetchItems).toHaveBeenCalledTimes(2);
  });
});
