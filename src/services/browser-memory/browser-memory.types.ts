/** The part of `localStorage` the memory uses, so a test can hand in its own. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Whether this browser has already been through something, per collection —
 * the tour, the first collapse of the sidebar.
 *
 * Per browser and not per user on purpose: a read-only showcase shares one
 * login among everyone, and each visitor deserves the first time once.
 */
export interface IBrowserMemory {
  seen(collection: string): boolean;
  remember(collection: string): void;
}
