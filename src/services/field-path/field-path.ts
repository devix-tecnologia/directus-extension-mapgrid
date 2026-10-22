import type { IFieldPath } from './field-path.types';

export class FieldPath implements IFieldPath {
  valueAt(item: Record<string, unknown> | null | undefined, path: string): unknown {
    if (!item) return undefined;
    if (path in item) return item[path];
    return this.follow(item, path.split('.'));
  }

  firstAt(item: Record<string, unknown> | null | undefined, path: string): unknown {
    const value = this.valueAt(item, path);
    if (!Array.isArray(value)) return value ?? null;
    return value.find((entry) => entry !== null && entry !== undefined) ?? null;
  }

  private follow(current: unknown, parts: readonly string[]): unknown {
    if (parts.length === 0) return current;
    if (Array.isArray(current)) {
      return current
        .flatMap((entry) => {
          const value = this.follow(entry, parts);
          return Array.isArray(value) ? value : [value];
        })
        .filter((value) => value !== null && value !== undefined);
    }
    if (current === null) return null;
    const [part, ...rest] = parts as [string, ...string[]];
    if (typeof current !== 'object' || !(part in current)) return undefined;
    return this.follow((current as Record<string, unknown>)[part], rest);
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
