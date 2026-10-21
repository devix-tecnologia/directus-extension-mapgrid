import { FieldPath } from '../field-path/index';
import type { RecordId } from '../record-sequence/index';
import type { FieldValuesSource, IFieldValues } from './field-values.types';

export class FieldValues implements IFieldValues {
  private readonly cache = new Map<string, Map<RecordId, unknown>>();
  private readonly paths = new FieldPath();

  constructor(private readonly source: FieldValuesSource) {}

  peek(id: RecordId, field: string): unknown {
    const cached = this.cache.get(field);
    if (cached?.has(id)) return cached.get(id);

    const key = this.source.primaryKey();
    if (!key) return undefined;
    const item = this.source.gridItems().find((candidate) => candidate[key] === id);
    return this.paths.valueAt(item, field);
  }

  async load(ids: readonly RecordId[], field: string): Promise<ReadonlyMap<RecordId, unknown>> {
    const values = new Map<RecordId, unknown>();
    const missing: RecordId[] = [];
    for (const id of ids) {
      const known = this.peek(id, field);
      if (known === undefined) missing.push(id);
      else values.set(id, known);
    }

    const key = this.source.primaryKey();
    if (missing.length === 0 || !key) return values;

    const fetched = await this.source.fetchItems(missing, [key, field]);
    const cached = this.cache.get(field) ?? new Map<RecordId, unknown>();
    this.cache.set(field, cached);
    for (const item of fetched) {
      const id = item[key] as RecordId;
      const value = this.paths.valueAt(item, field) ?? null;
      cached.set(id, value);
      values.set(id, value);
    }
    // asked and not returned: the record has no such value, and asking again will not change it
    for (const id of missing) {
      if (!cached.has(id)) cached.set(id, null);
      if (!values.has(id)) values.set(id, null);
    }
    return values;
  }

  clear(): void {
    this.cache.clear();
  }
}
