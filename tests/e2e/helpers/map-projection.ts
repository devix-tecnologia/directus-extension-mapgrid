const MAPLIBRE_TILE_SIZE = 512;
const MAX_MERCATOR_LATITUDE = 85.05112878;

export interface CameraState {
  center: [number, number];
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

const worldSizeAt = (zoom: number): number => MAPLIBRE_TILE_SIZE * 2 ** zoom;

const longitudeToWorldX = (longitude: number, zoom: number): number =>
  ((longitude + 180) / 360) * worldSizeAt(zoom);

const latitudeToWorldY = (latitude: number, zoom: number): number => {
  const boundedLatitude = Math.max(
    Math.min(latitude, MAX_MERCATOR_LATITUDE),
    -MAX_MERCATOR_LATITUDE
  );
  const radians = (boundedLatitude * Math.PI) / 180;
  return (0.5 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / (2 * Math.PI)) * worldSizeAt(zoom);
};

export const projectToScreenPoint = (
  camera: CameraState,
  viewport: ViewportSize,
  coordinates: [number, number]
): { x: number; y: number } => ({
  x:
    longitudeToWorldX(coordinates[0], camera.zoom) -
    longitudeToWorldX(camera.center[0], camera.zoom) +
    viewport.width / 2,
  y:
    latitudeToWorldY(coordinates[1], camera.zoom) -
    latitudeToWorldY(camera.center[1], camera.zoom) +
    viewport.height / 2,
});
