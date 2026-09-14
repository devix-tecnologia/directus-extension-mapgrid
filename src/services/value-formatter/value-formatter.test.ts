import { describe, expect, it } from 'vitest';
import { resolveFieldTemplate, serializeItemRow, serializeValue } from './value-formatter';

describe('serializeValue — what a grid cell shows', () => {
  it('shows text and numbers as they are', () => {
    expect(serializeValue('Brasília')).toBe('Brasília');
    expect(serializeValue(42)).toBe('42');
    expect(serializeValue(0)).toBe('0');
    expect(serializeValue(false)).toBe('false');
  });

  it('shows an empty cell for a missing value, rather than the words null and undefined', () => {
    expect(serializeValue(null)).toBe('');
    expect(serializeValue(undefined)).toBe('');
  });

  it('flips a point to "latitude, longitude", which is the order people read', () => {
    expect(serializeValue({ type: 'Point', coordinates: [-47.9292, -15.7801] })).toBe(
      '-15.7801, -47.9292'
    );
  });

  it('falls back to JSON when an object has coordinates but is not really a point', () => {
    // this used to be a type predicate that only checked for the key, and read
    // coordinates[1] off a string, producing "undefined, undefined"
    expect(serializeValue({ coordinates: 'not a pair' })).toBe('{"coordinates":"not a pair"}');
    expect(serializeValue({ coordinates: [1] })).toBe('{"coordinates":[1]}');
  });

  it('joins a list with commas, which is how a multi-select field shows up', () => {
    expect(serializeValue(['a', 'b', 'c'])).toBe('a, b, c');
    expect(serializeValue([])).toBe('');
  });

  it('falls back to JSON for any other object, so the cell is not "[object Object]"', () => {
    expect(serializeValue({ name: 'x' })).toBe('{"name":"x"}');
  });
});

describe('resolveFieldTemplate — the label of a marker popup', () => {
  const item = { id: 7, name: 'Brasília', state: 'DF', empty: null };

  it('replaces each {{field}} with the item’s value', () => {
    expect(resolveFieldTemplate(item, '{{name}}')).toBe('Brasília');
    expect(resolveFieldTemplate(item, '{{name}} - {{state}}')).toBe('Brasília - DF');
  });

  it('accepts a bare field name, because the layout options allow either form', () => {
    expect(resolveFieldTemplate(item, 'name')).toBe('Brasília');
  });

  it('falls back to the id when the template is empty, so the popup never opens blank', () => {
    expect(resolveFieldTemplate(item, '')).toBe('7');
  });

  it('falls back to the id when the template’s fields are absent from the item', () => {
    expect(resolveFieldTemplate(item, '{{missing}}')).toBe('7');
    expect(resolveFieldTemplate(item, '{{empty}}')).toBe('7');
  });

  it('keeps the literal text around the fields', () => {
    expect(resolveFieldTemplate(item, 'City: {{name}}')).toBe('City: Brasília');
  });

  it('treats an unknown bare name as a template with no field, and falls back to the id', () => {
    expect(resolveFieldTemplate(item, 'loose text')).toBe('loose text');
    expect(resolveFieldTemplate(item, 'missing')).toBe('missing');
  });
});

describe('serializeItemRow — the value of one field on a grid row', () => {
  const item = { id: 1, name: 'Brasília' };

  it('shows the field value', () => {
    expect(serializeItemRow(item, 'name')).toBe('Brasília');
  });

  it('shows an empty cell when the item or the field is missing, without throwing', () => {
    expect(serializeItemRow(item, 'missing')).toBe('');
    expect(serializeItemRow(null, 'name')).toBe('');
    expect(serializeItemRow(undefined, 'name')).toBe('');
  });
});
