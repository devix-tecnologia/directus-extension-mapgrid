import { describe, expect, it } from 'vitest';
import { DemoAccess } from './demo-access';

describe('DemoAccess — what the demo role may do', () => {
  it('only reads, the collections shown and the files of their photos', () => {
    const permissions = new DemoAccess().permissionsFor(['test_mapgrid_lpr']);

    expect(permissions.map((permission) => permission.collection)).toEqual([
      'test_mapgrid_lpr',
      'directus_files',
    ]);
    expect(permissions.every((permission) => permission.action === 'read')).toBe(true);
  });
});
