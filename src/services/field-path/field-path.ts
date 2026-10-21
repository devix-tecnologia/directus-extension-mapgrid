import type { IFieldPath } from './field-path.types';

export class FieldPath implements IFieldPath {
  valueAt(item: Record<string, unknown> | null | undefined, path: string): unknown {
    if (!item) return undefined;
    if (path in item) return item[path];

    let current: unknown = item;
    for (const part of path.split('.')) {
      if (current === null) return null;
      if (typeof current !== 'object' || !(part in (current as object))) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  filterAt(path: string, condition: Record<string, unknown>): Record<string, unknown> {
    return path
      .split('.')
      .reduceRight<Record<string, unknown>>((inner, part) => ({ [part]: inner }), condition);
  }

  isRelated(path: string): boolean {
    return path.includes('.');
  }
}
