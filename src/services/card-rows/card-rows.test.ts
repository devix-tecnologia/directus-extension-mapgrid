import { describe, expect, it } from 'vitest';
import { CardRows } from './card-rows';

const cardRows = new CardRows();

describe('CardRows — where the lines come from', () => {
  it('takes the lines the preset asks for', () => {
    const rows = [{ template: '{{smartphone.brand}} {{smartphone.model}}', label: 'Device' }];

    expect(cardRows.optionsFrom({ cardRows: rows, cardFields: ['plate'] })).toEqual(rows);
  });

  it('reads a preset from before the lines, one field per line', () => {
    expect(cardRows.optionsFrom({ cardFields: ['plate', 'captured_at'] })).toEqual([
      { template: '{{plate}}' },
      { template: '{{captured_at}}' },
    ]);
  });

  it('falls back to the grid columns', () => {
    expect(cardRows.optionsFrom({ gridFields: ['plate'] })).toEqual([{ template: '{{plate}}' }]);
  });

  it('leaves out lines with nothing to show', () => {
    expect(cardRows.optionsFrom({ cardRows: [{ template: '  ' }, { template: '{{a}}' }] })).toEqual(
      [{ template: '{{a}}' }]
    );
  });
});

describe('CardRows — what to fetch', () => {
  it('names each field a template cites, once and in order', () => {
    expect(
      cardRows.fieldsOf([
        '{{ smartphone.brand }} {{smartphone.model}}',
        '{{tracked_at}} · {{smartphone.brand}}',
      ])
    ).toEqual(['smartphone.brand', 'smartphone.model', 'tracked_at']);
  });
});

describe('CardRows — the labels', () => {
  const names: Record<string, string> = { 'smartphone.brand': 'Smartphone → Brand' };
  const nameOf = (path: string) => names[path] ?? null;

  it('keeps the label given, and names the others after their first field', () => {
    const rows = cardRows.rows(
      [
        { template: '{{smartphone.brand}} {{smartphone.model}}', label: 'Device' },
        { template: '{{smartphone.brand}}' },
        { template: '{{tracked_at}}' },
      ],
      nameOf
    );

    expect(rows.map((row) => row.label)).toEqual(['Device', 'Smartphone → Brand', 'tracked_at']);
  });

  it('gives each line its own key', () => {
    const rows = cardRows.rows([{ template: '{{a}}' }, { template: '{{a}}' }], nameOf);

    expect(new Set(rows.map((row) => row.key)).size).toBe(2);
  });
});
