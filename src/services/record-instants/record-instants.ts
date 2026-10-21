import type { IFieldValues } from '../field-values/index';
import type { RecordId } from '../record-sequence/index';
import type { FieldSummary, IRecordInstants } from './record-instants.types';

/** The Directus field types that hold a moment in time. */
export const TEMPORAL_FIELD_TYPES: readonly string[] = ['timestamp', 'dateTime', 'date'];

export class RecordInstants implements IRecordInstants {
  constructor(private readonly values: IFieldValues) {}

  instantOf(id: RecordId, field: string): number | null {
    return this.parse(this.values.peek(id, field));
  }

  async load(
    ids: readonly RecordId[],
    field: string
  ): Promise<ReadonlyMap<RecordId, number | null>> {
    const loaded = await this.values.load(ids, field);
    const instants = new Map<RecordId, number | null>();
    for (const id of ids) instants.set(id, this.parse(loaded.get(id)));
    return instants;
  }

  suggestedField(
    sort: readonly string[] | undefined,
    fields: readonly FieldSummary[]
  ): string | null {
    for (const entry of sort ?? []) {
      const name = entry.startsWith('-') ? entry.slice(1) : entry;
      const field = fields.find((candidate) => candidate.field === name);
      if (field && TEMPORAL_FIELD_TYPES.includes(field.type)) return name;
    }
    return null;
  }

  private parse(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || value.trim() === '') return null;
    const instant = Date.parse(value);
    return Number.isFinite(instant) ? instant : null;
  }
}
