/** A map camera as Directus' map layout keeps it in `layoutOptions.cameraOptions`. */
export interface CameraOptions {
  center?: [number, number];
  zoom?: number;
  /** `[west, south, east, north]`: what Directus filters a native geometry by. */
  bbox?: [number, number, number, number];
  [key: string]: unknown;
}

/**
 * Completes a camera that has no `bbox`. On a native geometry field Directus
 * reads `cameraOptions.bbox` to filter by the visible area and breaks without
 * it — a preset written by hand, with only a centre and a zoom, blanks the app.
 */
export interface ICameraBounds {
  /** The camera with a `bbox` around its centre, or as given when it has one or cannot have one. */
  complete(camera: unknown): unknown;
}
