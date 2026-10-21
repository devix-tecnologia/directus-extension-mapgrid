/** A field as the app's store gives it, reduced to what the options and the card read. */
export interface CatalogField {
  /** The path from the collection: `plate`, or `smartphone.icon` through a relation. */
  field: string;
  /** What the person reads: the field's name, or `Smartphone → Icon` through a relation. */
  name?: string | null;
  type: string;
  meta?: Record<string, unknown> | null;
  [key: string]: unknown;
}

/** Where the catalog reads the schema from: the app's fields and relations stores. */
export interface FieldCatalogSource {
  fieldsOf(collection: string): CatalogField[];
  /** The collection a many-to-one field points to, or `null` when it is not one. */
  relatedCollectionOf(collection: string, field: string): string | null;
}

/**
 * The fields a picker may offer: the collection's own and, one relation away,
 * those of each collection a many-to-one field points to.
 */
export interface IFieldCatalog {
  fieldsOf(collection: string): CatalogField[];
  /**
   * The field a path ends on, at any depth through many-to-one relations, named
   * after every step (`Smartphone → Owner → Email`); `null` when a step is missing.
   */
  describe(collection: string, path: string): CatalogField | null;
}
