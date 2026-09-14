import { describe, expect, it } from 'vitest';
import { fieldsToFetch } from './fields-to-fetch';

describe('fieldsToFetch — what the layout asks the API for', () => {
  it('asks for the displayed fields', () => {
    const fields = fieldsToFetch({ displayed: ['name', 'city'], primaryKey: 'id' });

    expect(fields).toContain('name');
    expect(fields).toContain('city');
  });

  it('always includes the primary key, which the grid and the map use to match rows', () => {
    expect(fieldsToFetch({ displayed: ['name'], primaryKey: 'id' })).toContain('id');
  });

  it('includes the geolocation field even when it is not a column, or the map draws nothing', () => {
    const fields = fieldsToFetch({
      displayed: ['name'],
      primaryKey: 'id',
      geolocation: 'location',
    });

    expect(fields).toContain('location');
  });

  it('includes fields the popup template cites, which need not be columns', () => {
    const fields = fieldsToFetch({
      displayed: ['name'],
      primaryKey: 'id',
      titleTemplate: '{{city}} — {{state}}',
    });

    expect(fields).toContain('city');
    expect(fields).toContain('state');
  });

  it('includes a bare field name used as a template, which the options panel allows', () => {
    expect(fieldsToFetch({ displayed: [], primaryKey: 'id', titleTemplate: 'city' })).toContain(
      'city'
    );
  });

  it('does not repeat a field that is both a column and in the template', () => {
    const fields = fieldsToFetch({
      displayed: ['name'],
      primaryKey: 'id',
      titleTemplate: '{{name}}',
    });

    expect(fields.filter((field) => field === 'name')).toHaveLength(1);
  });

  it('asks for the primary key alone when nothing is configured yet', () => {
    expect(fieldsToFetch({ displayed: [], primaryKey: 'id' })).toEqual(['id']);
  });
});
