import type { IBrowserMemory, KeyValueStore } from './browser-memory.types';

/** What the tour remembers. */
export const TOUR_SEEN = 'mapgrid:tour-seen:';
/** What the first collapse of the Directus sidebar remembers. */
export const SIDEBAR_COLLAPSED = 'mapgrid:sidebar-collapsed:';

const browserStore = (): KeyValueStore | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Storage can be missing or refuse writes — a private window — and then nothing is remembered. */
export class BrowserMemory implements IBrowserMemory {
  /**
   * @param prefix what is remembered, as one of the exported prefixes
   * @param store `localStorage` in production
   */
  constructor(
    private readonly prefix: string,
    private readonly store: KeyValueStore | null = browserStore()
  ) {}

  seen(collection: string): boolean {
    try {
      return this.store?.getItem(this.prefix + collection) === '1';
    } catch {
      return false;
    }
  }

  remember(collection: string): void {
    try {
      this.store?.setItem(this.prefix + collection, '1');
    } catch {
      // nothing to do: it happens again next time
    }
  }
}
