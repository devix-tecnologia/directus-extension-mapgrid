import { describe, expect, it } from 'vitest';
import { BrowserMemory, SIDEBAR_COLLAPSED, TOUR_SEEN } from './browser-memory';
import type { KeyValueStore } from './browser-memory.types';

const memoryStore = (): KeyValueStore => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

describe('BrowserMemory', () => {
  it('has not seen a collection until told so, and then has', () => {
    const memory = new BrowserMemory(TOUR_SEEN, memoryStore());

    expect(memory.seen('lpr')).toBe(false);
    memory.remember('lpr');
    expect(memory.seen('lpr')).toBe(true);
  });

  it('keeps each collection apart', () => {
    const memory = new BrowserMemory(TOUR_SEEN, memoryStore());
    memory.remember('lpr');

    expect(memory.seen('person_track')).toBe(false);
  });

  it('forgets quietly when there is no storage, or it refuses', () => {
    const refusing: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(() => new BrowserMemory(TOUR_SEEN, refusing).remember('lpr')).not.toThrow();
    expect(new BrowserMemory(TOUR_SEEN, refusing).seen('lpr')).toBe(false);
    expect(new BrowserMemory(TOUR_SEEN, null).seen('lpr')).toBe(false);
  });

  it('keeps the tour apart from the sidebar', () => {
    const store = memoryStore();
    new BrowserMemory(TOUR_SEEN, store).remember('lpr');

    expect(new BrowserMemory(SIDEBAR_COLLAPSED, store).seen('lpr')).toBe(false);
  });
});
