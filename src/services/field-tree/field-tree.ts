import type { CatalogField } from '../field-catalog/index';
import type {
  FieldTreeNode,
  FieldTreeQuery,
  FieldTreeSource,
  IFieldTree,
} from './field-tree.types';

export const DEFAULT_TREE_DEPTH = 3;

const nameOf = (field: CatalogField): string => field.name?.trim() || field.field;

export class FieldTree implements IFieldTree {
  constructor(private readonly source: FieldTreeSource) {}

  children(collection: string, query: FieldTreeQuery, parent?: FieldTreeNode): FieldTreeNode[] {
    const depthLeft = this.depthLeft(query, parent);
    if (depthLeft < 0) return [];

    return this.source.fieldsOf(collection).flatMap((field): FieldTreeNode[] => {
      const path = parent ? `${parent.path}.${field.field}` : field.field;
      const node = { path, name: nameOf(field), field };
      if (query.accept(field)) return [{ ...node, selectable: true, opensInto: null }];

      const related = this.source.relatedCollectionOf(collection, field.field);
      if (!related || depthLeft === 0) return [];
      if (!this.leadsTo(related, query.accept, depthLeft - 1, new Set([collection]))) return [];
      return [{ ...node, selectable: false, opensInto: related }];
    });
  }

  /** The relations still allowed below `parent`: the depth asked for, less the steps taken. */
  private depthLeft(query: FieldTreeQuery, parent?: FieldTreeNode): number {
    const depth = query.depth ?? DEFAULT_TREE_DEPTH;
    const taken = parent ? parent.path.split('.').length : 0;
    return depth - taken;
  }

  /** Whether something accepted lies in `collection`, within `depthLeft` more relations. */
  private leadsTo(
    collection: string,
    accept: FieldTreeQuery['accept'],
    depthLeft: number,
    seen: ReadonlySet<string>
  ): boolean {
    if (seen.has(collection)) return false;
    const visited = new Set([...seen, collection]);
    return this.source.fieldsOf(collection).some((field) => {
      if (accept(field)) return true;
      if (depthLeft === 0) return false;
      const related = this.source.relatedCollectionOf(collection, field.field);
      return related !== null && this.leadsTo(related, accept, depthLeft - 1, visited);
    });
  }
}
