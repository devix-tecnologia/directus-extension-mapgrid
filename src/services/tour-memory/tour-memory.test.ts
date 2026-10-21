import { describe, expect, it } from 'vitest';
import { TourMemory } from './tour-memory';
import type { KeyValueStore } from './tour-memory.types';

const memoryStore = (): KeyValueStore => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

describe('TourMemory', () => {
  it('has not seen a collection until told so, and then has', () => {
    const memory = new TourMemory(memoryStore());

    expect(memory.seen('lpr')).toBe(false);
    memory.remember('lpr');
    expect(memory.seen('lpr')).toBe(true);
  });

  it('keeps each collection apart', () => {
    const memory = new TourMemory(memoryStore());
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

    expect(() => new TourMemory(refusing).remember('lpr')).not.toThrow();
    expect(new TourMemory(refusing).seen('lpr')).toBe(false);
    expect(new TourMemory(null).seen('lpr')).toBe(false);
  });
});
