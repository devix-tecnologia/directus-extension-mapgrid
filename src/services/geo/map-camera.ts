import type { MapCameraOptions, PointCoordinates } from '../../contract/index';

/** Brasília. The starting centre when the preset does not define one. */
export const DEFAULT_MAP_CENTER: PointCoordinates = [-47.9292, -15.7801];
export const DEFAULT_MAP_ZOOM = 4;

const DEGREES_IN_A_TURN = 360;
const HALF_TURN = 180;

export interface LngLatBoundsLike {
  getWest: () => number;
  getEast: () => number;
  getSouth: () => number;
  getNorth: () => number;
}

/**
 * The preset's centre, or the default. Longitude and latitude only count
 * together: half a pair would place the map somewhere the user did not choose,
 * so the filled half is discarded.
 */
export const resolveMapCenter = (options: MapCameraOptions): PointCoordinates =>
  options.mapCenterLng != null && options.mapCenterLat != null
    ? [options.mapCenterLng, options.mapCenterLat]
    : [...DEFAULT_MAP_CENTER];

/** The preset's zoom, or the default. */
export const resolveMapZoom = (options: MapCameraOptions): number =>
  options.mapZoom ?? DEFAULT_MAP_ZOOM;

/**
 * The same longitude, shifted by whole turns until it lands near the reference.
 *
 * The map scrolls endlessly along the east-west axis, so a point at -179° and a
 * click at +179° are two degrees apart on screen and 358° apart in arithmetic.
 * Without this the popup opens on a copy of the world that is off screen.
 */
export const longitudeNearest = (longitude: number, reference: number): number => {
  let adjusted = longitude;
  while (Math.abs(reference - adjusted) > HALF_TURN) {
    adjusted += reference > adjusted ? DEGREES_IN_A_TURN : -DEGREES_IN_A_TURN;
  }
  return adjusted;
};

/** The same point, with its longitude brought near the reference. */
export const coordinatesNearest = (
  coordinates: PointCoordinates,
  referenceLongitude: number
): PointCoordinates => [longitudeNearest(coordinates[0], referenceLongitude), coordinates[1]];

/**
 * Whether the point is outside the visible area. Used to decide between panning
 * the map and leaving it still: moving the camera to a point already in view
 * only makes the map jitter for no reason.
 */
export const isOutsideBounds = (
  coordinates: PointCoordinates,
  bounds: LngLatBoundsLike
): boolean => {
  const [longitude, latitude] = coordinates;
  return (
    longitude < bounds.getWest() ||
    longitude > bounds.getEast() ||
    latitude < bounds.getSouth() ||
    latitude > bounds.getNorth()
  );
};
