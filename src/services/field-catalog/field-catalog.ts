import type { CatalogField, FieldCatalogSource, IFieldCatalog } from './field-catalog.types';

const labelOf = (field: CatalogField): string => field.name?.trim() || field.field;

/** An alias holds no value of its own: a list of records, a group, a divider. */
const holdsValue = (field: CatalogField): boolean => field.type !== 'alias';

export class FieldCatalog implements IFieldCatalog {
  constructor(private readonly source: FieldCatalogSource) {}

  fieldsOf(collection: string): CatalogField[] {
    const own = this.source.fieldsOf(collection);
    const related = own.flatMap((relation) => {
      const target = this.source.relatedCollectionOf(collection, relation.field);
      if (!target) return [];
      return this.source
        .fieldsOf(target)
        .filter(holdsValue)
        .map((field) => ({
          ...field,
          field: `${relation.field}.${field.field}`,
          name: `${labelOf(relation)} → ${labelOf(field)}`,
        }));
    });
    return [...own, ...related];
  }
}
