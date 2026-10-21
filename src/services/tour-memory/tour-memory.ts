import type { ITourMemory, KeyValueStore } from './tour-memory.types';

const KEY_PREFIX = 'mapgrid:tour-seen:';

const browserStore = (): KeyValueStore | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Storage can be missing or refuse writes — a private window — and then the tour is simply not remembered. */
export class TourMemory implements ITourMemory {
  constructor(private readonly store: KeyValueStore | null = browserStore()) {}

  seen(collection: string): boolean {
    try {
      return this.store?.getItem(KEY_PREFIX + collection) === '1';
    } catch {
      return false;
    }
  }

  remember(collection: string): void {
    try {
      this.store?.setItem(KEY_PREFIX + collection, '1');
    } catch {
      // nothing to do: the tour will open again next time
    }
  }
}
