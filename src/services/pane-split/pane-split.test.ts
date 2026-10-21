import { describe, expect, it } from 'vitest';
import { DEFAULT_MAP_SHARE, MAX_MAP_SHARE, MIN_MAP_SHARE, PaneSplit } from './pane-split';

const split = new PaneSplit();

describe('PaneSplit', () => {
  it('gives the map 60% until someone says otherwise', () => {
    expect(split.from(undefined)).toBe(DEFAULT_MAP_SHARE);
    expect(split.from('half')).toBe(DEFAULT_MAP_SHARE);
    expect(split.from(0.45)).toBe(0.45);
  });

  it('never lets either side disappear', () => {
    expect(split.from(0)).toBe(MIN_MAP_SHARE);
    expect(split.from(1)).toBe(MAX_MAP_SHARE);
    expect(split.atPointer(-50, 100, 800)).toBe(MIN_MAP_SHARE);
    expect(split.atPointer(5000, 100, 800)).toBe(MAX_MAP_SHARE);
  });

  it('reads the share under the pointer, from the top of the container', () => {
    expect(split.atPointer(500, 100, 800)).toBe(0.5);
  });

  it('has no share to read from a container without height', () => {
    expect(split.atPointer(500, 100, 0)).toBe(DEFAULT_MAP_SHARE);
  });

  it('steps by five points, rounded, within the bounds', () => {
    expect(split.step(0.6, 1)).toBe(0.65);
    expect(split.step(0.6, -1)).toBe(0.55);
    expect(split.step(MAX_MAP_SHARE, 1)).toBe(MAX_MAP_SHARE);
  });
});
