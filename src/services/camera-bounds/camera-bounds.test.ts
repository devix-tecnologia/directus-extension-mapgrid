import { describe, expect, it } from 'vitest';
import { CameraBounds } from './camera-bounds';

const bounds = new CameraBounds();

describe('CameraBounds', () => {
  it('gives a camera with only a centre and a zoom a bbox around that centre', () => {
    const camera = bounds.complete({ center: [-40.29, -20.29], zoom: 11 }) as {
      bbox: [number, number, number, number];
    };

    const [west, south, east, north] = camera.bbox;
    expect(west).toBeLessThan(-40.29);
    expect(east).toBeGreaterThan(-40.29);
    expect(south).toBeLessThan(-20.29);
    expect(north).toBeGreaterThan(-20.29);
  });

  it('covers more than any screen shows, so nothing visible is filtered out', () => {
    const camera = bounds.complete({ center: [-40.29, -20.29], zoom: 11 }) as {
      bbox: [number, number, number, number];
    };

    // a 2560 px wide screen at zoom 11 shows about 0.88 degrees of longitude
    expect(camera.bbox[2] - camera.bbox[0]).toBeGreaterThan(0.88);
  });

  it('keeps the centre, the zoom and anything else the camera has', () => {
    const camera = bounds.complete({ center: [10, 20], zoom: 5, pitch: 30 });

    expect(camera).toMatchObject({ center: [10, 20], zoom: 5, pitch: 30 });
  });

  it('stays within the world at a low zoom', () => {
    const camera = bounds.complete({ center: [0, 0], zoom: 0 }) as { bbox: number[] };

    expect(camera.bbox).toEqual([-180, -85.0511, 180, 85.0511]);
  });

  it('leaves alone a camera that already has a bbox', () => {
    const camera = { center: [1, 2], zoom: 3, bbox: [0, 1, 2, 3] };

    expect(bounds.complete(camera)).toBe(camera);
  });

  it('leaves alone what is not a camera it can place', () => {
    expect(bounds.complete(undefined)).toBeUndefined();
    expect(bounds.complete(null)).toBeNull();
    expect(bounds.complete({ zoom: 3 })).toEqual({ zoom: 3 });
  });
});
