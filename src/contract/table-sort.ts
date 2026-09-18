/**
 * Sort, in the two formats it exists in.
 *
 * The preset stores Directus's query format: a list of fields where a leading
 * `-` means descending. The `v-table`, on the other hand, speaks
 * `{ by, desc }`. Same information, two grammars — translating between them is
 * pure logic, so it lives here rather than in the component, to be exercised
 * without mounting anything.
 */

/** How the Directus `v-table` describes sorting. */
export interface TableSort {
  by: string | null;
  desc: boolean;
}

/** Reads the sort from the query. Only the first field: the table sorts by one. */
export const toTableSort = (sort: string[] | undefined | null): TableSort => {
  const [first] = sort ?? [];
  if (!first) return { by: null, desc: false };

  return first.startsWith('-') ? { by: first.slice(1), desc: true } : { by: first, desc: false };
};

/** Writes the table's sort back in the query format. */
export const fromTableSort = ({ by, desc }: TableSort): string[] =>
  by === null || by === '' ? [] : [desc ? `-${by}` : by];
