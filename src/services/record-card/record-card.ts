import type { CardField, CardRow, IRecordCard } from './record-card.types';

export const EMPTY_VALUE = '—';

const DATE_TIME_TYPES = ['timestamp', 'dateTime'];

const labelOf = (field: CardField): string =>
  field.name?.trim() ||
  field.field.replace(/_/g, ' ').replace(/^\w/, (first) => first.toUpperCase());

export class RecordCard implements IRecordCard {
  rows(
    item: Record<string, unknown>,
    fields: readonly string[],
    schema: readonly CardField[],
    locale: string
  ): CardRow[] {
    const rows: CardRow[] = [];
    for (const name of fields) {
      const field = schema.find((candidate) => candidate.field === name);
      const value = item[name];
      if (!field || (typeof value === 'object' && value !== null)) continue;
      rows.push({ field: name, label: labelOf(field), value: this.format(value, field, locale) });
    }
    return rows;
  }

  coordinates([longitude, latitude]: readonly [number, number], locale: string): string {
    const number = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 5,
      minimumFractionDigits: 5,
    });
    return `${number.format(latitude)}, ${number.format(longitude)}`;
  }

  private format(value: unknown, field: CardField, locale: string): string {
    if (value === null || value === undefined || value === '') return EMPTY_VALUE;

    const choice = this.choiceText(value, field);
    if (choice !== null) return choice;

    if (typeof value === 'string' && DATE_TIME_TYPES.includes(field.type)) {
      const instant = new Date(value);
      if (!Number.isNaN(instant.getTime())) {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'medium' }).format(
          instant
        );
      }
    }
    if (typeof value === 'string' && field.type === 'date') {
      // a bare date has no zone; read it as noon so no offset moves it to another day
      const day = new Date(`${value}T12:00:00`);
      if (!Number.isNaN(day.getTime())) {
        return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(day);
      }
    }
    if (typeof value === 'number') return new Intl.NumberFormat(locale).format(value);
    return String(value);
  }

  private choiceText(value: unknown, field: CardField): string | null {
    const choices = field.meta?.display_options?.choices ?? field.meta?.options?.choices;
    if (!Array.isArray(choices)) return null;
    const match = choices.find(
      (choice) => (choice as { value?: unknown } | null)?.value === value
    ) as { text?: unknown } | undefined;
    return typeof match?.text === 'string' ? match.text : null;
  }
}
