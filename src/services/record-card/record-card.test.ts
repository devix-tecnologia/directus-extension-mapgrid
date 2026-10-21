import { describe, expect, it } from 'vitest';
import { EMPTY_VALUE, RecordCard } from './record-card';
import type { CardField } from './record-card.types';

const card = new RecordCard();

const SCHEMA: CardField[] = [
  { field: 'plate', name: 'Plate', type: 'string' },
  { field: 'captured_at', name: 'Captured At', type: 'timestamp' },
  {
    field: 'alert_status',
    name: 'Alert Status',
    type: 'string',
    meta: { options: { choices: [{ text: 'Theft', value: 'theft' }] } },
  },
  { field: 'course', type: 'integer' },
  { field: 'location', name: 'Location', type: 'json' },
  { field: 'note', name: 'Note', type: 'string' },
];

const READING = {
  plate: 'RQP4C58',
  captured_at: '2026-06-05T19:12:06.000Z',
  alert_status: 'theft',
  course: 1234,
  location: { type: 'Point', coordinates: [-40.3, -20.3] },
  note: null,
};

describe('RecordCard — the rows', () => {
  it('keeps the order asked for, with the names Directus shows', () => {
    const rows = card.rows(READING, ['alert_status', 'plate'], SCHEMA, 'en-US');

    expect(rows.map((row) => row.label)).toEqual(['Alert Status', 'Plate']);
  });

  it('shows the text of a choice, not its stored value', () => {
    const [row] = card.rows(READING, ['alert_status'], SCHEMA, 'en-US');

    expect(row?.value).toBe('Theft');
  });

  it('formats a moment in the person locale', () => {
    const [row] = card.rows(READING, ['captured_at'], SCHEMA, 'pt-BR');

    expect(row?.value).toMatch(/0[56]\/06\/2026/);
  });

  it('formats a number, and names a field without a name from its key', () => {
    const [row] = card.rows(READING, ['course'], SCHEMA, 'en-US');

    expect(row).toEqual({ field: 'course', label: 'Course', value: '1,234' });
  });

  it('marks an empty value instead of hiding the line', () => {
    const [row] = card.rows(READING, ['note'], SCHEMA, 'en-US');

    expect(row?.value).toBe(EMPTY_VALUE);
  });

  it('leaves out objects and fields the collection does not have', () => {
    expect(card.rows(READING, ['location', 'ghost'], SCHEMA, 'en-US')).toEqual([]);
  });
});

describe('RecordCard — the coordinates', () => {
  it('reads latitude first, with five decimals', () => {
    expect(card.coordinates([-40.3121, -20.3152], 'en-US')).toBe('-20.31520, -40.31210');
    expect(card.coordinates([-40.3121, -20.3152], 'pt-BR')).toBe('-20,31520, -40,31210');
  });
});
