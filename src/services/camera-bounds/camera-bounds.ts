import type { CameraOptions, ICameraBounds } from './camera-bounds.types';

/** Wider and taller than any screen, so the bbox never hides what the map shows. */
export const ASSUMED_VIEWPORT_PX = 4096;
/** Where Web Mercator ends. */
export const MAX_LATITUDE = 85.0511;
/** MapLibre's tiles: the world is 512 px wide at zoom 0. */
const TILE_PX = 512;

const isCoordinate = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.every((part) => typeof part === 'number' && Number.isFinite(part));

const clamp = (value: number, limit: number): number => Math.max(-limit, Math.min(limit, value));

const latitudeToY = (latitude: number): number => {
  const radians = (clamp(latitude, MAX_LATITUDE) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
};

const yToLatitude = (y: number): number =>
  (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * (180 / Math.PI);

export class CameraBounds implements ICameraBounds {
  complete(camera: unknown): unknown {
    if (!camera || typeof camera !== 'object') return camera;
    const { center, zoom, bbox } = camera as CameraOptions;
    if (bbox !== undefined || !isCoordinate(center) || typeof zoom !== 'number') return camera;

    const worldPx = TILE_PX * 2 ** zoom;
    const halfLongitude = ((ASSUMED_VIEWPORT_PX / 2) * 360) / worldPx;
    const halfY = ((ASSUMED_VIEWPORT_PX / 2) * 2 * Math.PI) / worldPx;
    const y = latitudeToY(center[1]);

    return {
      ...camera,
      bbox: [
        clamp(center[0] - halfLongitude, 180),
        clamp(yToLatitude(y - halfY), MAX_LATITUDE),
        clamp(center[0] + halfLongitude, 180),
        clamp(yToLatitude(y + halfY), MAX_LATITUDE),
      ],
    };
  }
}
