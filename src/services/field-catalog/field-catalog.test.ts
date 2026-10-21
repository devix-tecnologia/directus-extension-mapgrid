import { describe, expect, it } from 'vitest';
import { FieldCatalog } from './field-catalog';
import type { CatalogField, FieldCatalogSource } from './field-catalog.types';

const SCHEMA: Record<string, CatalogField[]> = {
  tracking: [
    { field: 'id', name: 'ID', type: 'integer' },
    { field: 'tracked_at', name: 'Tracked at', type: 'timestamp' },
    { field: 'smartphone', name: 'Smartphone', type: 'integer', meta: { special: ['m2o'] } },
    { field: 'notes', name: 'Notes', type: 'alias', meta: { special: ['o2m'] } },
  ],
  smartphones: [
    { field: 'id', name: 'ID', type: 'integer' },
    { field: 'brand', name: 'Brand', type: 'string' },
    { field: 'icon', name: 'Icon', type: 'uuid', meta: { special: ['file'] } },
    { field: 'owner', name: 'Owner', type: 'uuid', meta: { special: ['m2o'] } },
    { field: 'trips', name: 'Trips', type: 'alias', meta: { special: ['o2m'] } },
  ],
  users: [{ field: 'email', name: 'Email', type: 'string' }],
};

const RELATIONS: Record<string, string> = {
  'tracking.smartphone': 'smartphones',
  'smartphones.owner': 'users',
};

const source: FieldCatalogSource = {
  fieldsOf: (collection) => SCHEMA[collection] ?? [],
  relatedCollectionOf: (collection, field) => RELATIONS[`${collection}.${field}`] ?? null,
};

const catalog = new FieldCatalog(source);
const paths = () => catalog.fieldsOf('tracking').map((field) => field.field);

describe('FieldCatalog', () => {
  it('offers the collection own fields first, as they are', () => {
    expect(catalog.fieldsOf('tracking').slice(0, 2)).toEqual(SCHEMA.tracking?.slice(0, 2));
  });

  it('offers the fields of the collection a many-to-one points to, by path', () => {
    expect(paths()).toEqual(
      expect.arrayContaining(['smartphone.id', 'smartphone.brand', 'smartphone.icon'])
    );
  });

  it('names a related field after the relation and the field', () => {
    const icon = catalog.fieldsOf('tracking').find((field) => field.field === 'smartphone.icon');

    expect(icon).toMatchObject({
      name: 'Smartphone → Icon',
      type: 'uuid',
      meta: { special: ['file'] },
    });
  });

  it('goes one relation away, no further, and leaves out lists of records', () => {
    expect(paths()).not.toContain('smartphone.owner.email');
    expect(paths()).not.toContain('smartphone.trips');
  });

  it('keeps the relation field itself, as before', () => {
    expect(paths()).toContain('smartphone');
  });

  it('describes a path at any depth, named after every step', () => {
    expect(catalog.describe('tracking', 'smartphone.owner.email')).toMatchObject({
      field: 'smartphone.owner.email',
      name: 'Smartphone → Owner → Email',
      type: 'string',
    });
    expect(catalog.describe('tracking', 'tracked_at')).toMatchObject({ name: 'Tracked at' });
  });

  it('describes nothing when a step is missing or is not a relation', () => {
    expect(catalog.describe('tracking', 'smartphone.colour')).toBeNull();
    expect(catalog.describe('tracking', 'tracked_at.year')).toBeNull();
  });
});
