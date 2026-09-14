import { describe, expect, it } from 'vitest';
import {
  coordinatesNearest,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  isOutsideBounds,
  longitudeNearest,
  resolveMapCenter,
  resolveMapZoom,
} from './map-camera';

describe('resolveMapCenter — a centre is only valid with both coordinates', () => {
  it('uses the preset centre when both are filled in', () => {
    expect(resolveMapCenter({ mapCenterLng: 10, mapCenterLat: 20 })).toEqual([10, 20]);
  });

  it('falls back to the default on half a pair, so it does not land somewhere nobody chose', () => {
    expect(resolveMapCenter({ mapCenterLng: 10 })).toEqual(DEFAULT_MAP_CENTER);
    expect(resolveMapCenter({ mapCenterLat: 20 })).toEqual(DEFAULT_MAP_CENTER);
    expect(resolveMapCenter({})).toEqual(DEFAULT_MAP_CENTER);
  });

  it('accepts zero, which is a legitimate coordinate and not a missing value', () => {
    expect(resolveMapCenter({ mapCenterLng: 0, mapCenterLat: 0 })).toEqual([0, 0]);
  });

  it('returns a copy, so moving the camera does not mutate the module default', () => {
    const center = resolveMapCenter({});
    center[0] = 999;

    expect(DEFAULT_MAP_CENTER[0]).toBe(-47.9292);
  });
});

describe('resolveMapZoom', () => {
  it('uses the preset zoom, zero included', () => {
    expect(resolveMapZoom({ mapZoom: 12 })).toBe(12);
    expect(resolveMapZoom({ mapZoom: 0 })).toBe(0);
  });

  it('falls back to the default when the preset does not define one', () => {
    expect(resolveMapZoom({})).toBe(DEFAULT_MAP_ZOOM);
  });
});

describe('longitudeNearest — the map scrolls endlessly along the east-west axis', () => {
  it('leaves alone what is already near', () => {
    expect(longitudeNearest(-47.9, -46)).toBe(-47.9);
  });

  it('brings the point to the turn that is on screen, instead of a copy of the world', () => {
    // a click at +179 and a point at -179: two degrees on screen, 358 in arithmetic
    expect(longitudeNearest(-179, 179)).toBe(181);
    expect(longitudeNearest(179, -179)).toBe(-181);
  });

  it('crosses as many turns as needed', () => {
    expect(longitudeNearest(0, 720)).toBe(720);
  });

  it('leaves a difference of exactly 180 as is, because no turn is nearer', () => {
    expect(longitudeNearest(0, 180)).toBe(0);
  });
});

describe('coordinatesNearest', () => {
  it('adjusts only the longitude and preserves the latitude', () => {
    expect(coordinatesNearest([-179, -15.78], 179)).toEqual([181, -15.78]);
  });
});

describe('isOutsideBounds — panning to what is already in view only makes the map jitter', () => {
  const bounds = {
    getWest: () => -50,
    getEast: () => -40,
    getSouth: () => -20,
    getNorth: () => -10,
  };

  it('says no for a point inside the visible area', () => {
    expect(isOutsideBounds([-45, -15], bounds)).toBe(false);
  });

  it('says yes in each of the four directions', () => {
    expect(isOutsideBounds([-51, -15], bounds)).toBe(true);
    expect(isOutsideBounds([-39, -15], bounds)).toBe(true);
    expect(isOutsideBounds([-45, -21], bounds)).toBe(true);
    expect(isOutsideBounds([-45, -9], bounds)).toBe(true);
  });

  it('treats the exact edge as inside, so a point on the border causes no pan', () => {
    expect(isOutsideBounds([-50, -20], bounds)).toBe(false);
    expect(isOutsideBounds([-40, -10], bounds)).toBe(false);
  });
});
