import { describe, expect, it } from 'vitest';
import { EmbeddedStateReader, KEYS_THAT_THROW_OUTSIDE_RENDER } from './embedded-state-reader';

describe('reading an embedded layout state', () => {
  it('returns the keys as they are when no getter throws', () => {
    const reader = new EmbeddedStateReader();
    expect(reader.read({ items: [1, 2], loading: false })).toEqual({
      items: [1, 2],
      loading: false,
    });
  });

  it('with no state, returns an empty object', () => {
    expect(new EmbeddedStateReader().read(undefined)).toEqual({});
  });

  it('the key that throws outside the render is not even read', () => {
    const reader = new EmbeddedStateReader();
    let reads = 0;
    const state = {
      items: [1],
      get showingCount(): string {
        reads += 1;
        return '1-2 of 2';
      },
    };
    expect(KEYS_THAT_THROW_OUTSIDE_RENDER).toContain('showingCount');
    expect(reader.read(state)).toEqual({ items: [1] });
    expect(reads).toBe(0);
  });

  it('any other getter is read as is: a stale value delivered in silence hides the next defect', () => {
    const reader = new EmbeddedStateReader();
    const state = {
      items: [1],
      get count(): string {
        throw new SyntaxError('Must be called at the top of a `setup` function');
      },
    };
    expect(() => reader.read(state)).toThrow(SyntaxError);
  });
});
