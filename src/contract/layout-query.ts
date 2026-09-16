import { computed, type Ref, type WritableComputedRef } from 'vue';
import type { LayoutQuery } from '../types';

/**
 * The parts of the layout query the extension both reads and writes.
 *
 * Pagination and sorting are not display preferences: they belong to the query
 * the layout hands Directus, and they have to survive a reload. Keeping them as
 * read-only computeds meant the grid could show a sortable header that wrote
 * nowhere, and the map had no way to advance the page on its own.
 *
 * Extracted from the layout's `setup` so it can be tested with a plain ref,
 * without the Directus composables.
 */

/** What Directus itself defaults a layout's page size to. */
const DEFAULT_LIMIT = 25;

export interface WritableLayoutQuery {
  page: WritableComputedRef<number>;
  limit: WritableComputedRef<number>;
  sort: WritableComputedRef<string[]>;
}

export const useWritableLayoutQuery = (
  layoutQuery: Ref<LayoutQuery | null | undefined>
): WritableLayoutQuery => {
  /**
   * Writes one field without disturbing the rest. The preset also carries
   * `filter`, `search` and `fields`, and replacing the object would drop
   * whatever this layout did not set.
   */
  const write = <Key extends keyof LayoutQuery>(key: Key, value: LayoutQuery[Key]): void => {
    layoutQuery.value = { ...(layoutQuery.value ?? ({} as LayoutQuery)), [key]: value };
  };

  return {
    page: computed({
      get: () => layoutQuery.value?.page || 1,
      set: (value) => write('page', value),
    }),
    limit: computed({
      get: () => layoutQuery.value?.limit || DEFAULT_LIMIT,
      set: (value) => write('limit', value),
    }),
    sort: computed({
      get: () => layoutQuery.value?.sort ?? [],
      set: (value) => write('sort', value),
    }),
  };
};
