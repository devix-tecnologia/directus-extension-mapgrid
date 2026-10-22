import { describe, expect, it } from 'vitest';
import type { CatalogField } from '../field-catalog/index';
import { FieldTree } from './field-tree';

const SCHEMA: Record<string, CatalogField[]> = {
  tracking: [
    { field: 'id', name: 'ID', type: 'integer' },
    { field: 'tracked_at', name: 'Tracked at', type: 'timestamp' },
    { field: 'smartphone', name: 'Smartphone', type: 'integer', meta: { special: ['m2o'] } },
    { field: 'operator', name: 'Operator', type: 'uuid', meta: { special: ['m2o'] } },
  ],
  smartphones: [
    { field: 'brand', name: 'Brand', type: 'string' },
    { field: 'icon', name: 'Icon', type: 'uuid', meta: { special: ['file'] } },
    { field: 'photos', name: 'Photos', type: 'alias', meta: { special: ['o2m'] } },
  ],
  smartphone_photos: [{ field: 'photo', name: 'Photo', type: 'uuid', meta: { special: ['file'] } }],
  users: [
    { field: 'email', name: 'Email', type: 'string' },
    { field: 'role', name: 'Role', type: 'uuid', meta: { special: ['m2o'] } },
  ],
  roles: [{ field: 'users', name: 'Users', type: 'alias', meta: { special: ['o2m'] } }],
  directus_files: [
    { field: 'id', name: 'ID', type: 'uuid' },
    { field: 'filename_download', name: 'Filename', type: 'string' },
  ],
};

const RELATIONS: Record<string, string> = {
  'tracking.smartphone': 'smartphones',
  'tracking.operator': 'users',
  'smartphones.icon': 'directus_files',
  'smartphones.photos': 'smartphone_photos',
  'smartphone_photos.photo': 'directus_files',
  'users.role': 'roles',
  'roles.users': 'users',
};

const tree = new FieldTree({
  fieldsOf: (collection) => SCHEMA[collection] ?? [],
  relatedCollectionOf: (collection, field) => RELATIONS[`${collection}.${field}`] ?? null,
});

const isFile = (field: CatalogField) =>
  field.type === 'uuid' && (field.meta?.special as string[] | undefined)?.includes('file') === true;
const isDate = (field: CatalogField) => field.type === 'timestamp';
const isText = (field: CatalogField) => field.type === 'string';

const rows = (collection: string, accept: (field: CatalogField) => boolean, depth?: number) =>
  tree.children(collection, { accept, depth });

describe('FieldTree — what it offers', () => {
  it('offers the fields of the kind asked for, to be chosen', () => {
    expect(rows('tracking', isDate).map((node) => [node.path, node.selectable])).toEqual([
      ['tracked_at', true],
    ]);
  });

  it('offers a relation only when something of that kind is inside it', () => {
    expect(rows('tracking', isFile).map((node) => node.path)).toEqual(['smartphone']);
  });

  it('opens a relation into the related collection, with the path carried on', () => {
    const [smartphone] = rows('tracking', isFile);
    if (!smartphone) throw new Error('no smartphone row');

    expect(smartphone).toMatchObject({ selectable: false, opensInto: 'smartphones' });
    const inside = tree.children('smartphones', { accept: isFile }, smartphone);
    expect(inside.map((node) => [node.path, node.selectable])).toEqual([
      ['smartphone.icon', true],
      ['smartphone.photos', false],
    ]);
  });

  it('chooses a file field as it is, instead of opening the files', () => {
    const icon = tree
      .children('smartphones', { accept: isFile })
      .find((node) => node.path === 'icon');

    expect(icon).toMatchObject({ selectable: true, opensInto: null });
  });

  it('goes through a list of records, to the field of each one', () => {
    const [photos] = tree
      .children('smartphones', { accept: isFile })
      .filter((node) => !node.selectable);
    if (!photos) throw new Error('no photos row');

    expect(
      tree.children('smartphone_photos', { accept: isFile }, photos).map((node) => node.path)
    ).toEqual(['photos.photo']);
  });
});

describe('FieldTree — how deep', () => {
  it('stops at the depth asked for, leaving out what lies beyond', () => {
    expect(rows('tracking', isText, 1).map((node) => node.path)).toEqual([
      'smartphone',
      'operator',
    ]);
    expect(rows('tracking', isFile, 1).map((node) => node.path)).toEqual(['smartphone']);
    expect(rows('tracking', isFile, 0)).toEqual([]);
  });

  it('does not loop on relations that come back', () => {
    expect(() => rows('users', isDate)).not.toThrow();
    expect(rows('users', isDate)).toEqual([]);
  });
});
