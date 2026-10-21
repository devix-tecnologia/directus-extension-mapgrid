/** `[longitude, latitude]`, in degrees. */
export type Coordinate = [number, number];

/** Reads the coordinates out of a GeoJSON geometry, whatever its type. */
export interface IItemGeometry {
  /** Every position of the geometry; empty when any of them is unreadable or out of range. */
  pointsOf(geometry: unknown): Coordinate[];
  /** The centre of the points' bounding box, so a line lands on its middle and not on a vertex. */
  centreOf(points: readonly Coordinate[]): Coordinate | null;
}
