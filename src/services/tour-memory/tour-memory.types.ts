/** The part of `localStorage` the memory uses, so a test can hand in its own. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Whether this browser has already seen the tour of a collection.
 *
 * Per browser and not per user on purpose: a read-only demo shares one login
 * among everyone, and each visitor deserves the tour once.
 */
export interface ITourMemory {
  seen(collection: string): boolean;
  remember(collection: string): void;
}
