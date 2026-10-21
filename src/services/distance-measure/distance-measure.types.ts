import type { Coordinate } from '../item-geometry/index';

/** Distances on the ground between positions the person marked on the map. */
export interface IDistanceMeasure {
  /** The great-circle distance, in metres. */
  between(from: Coordinate, to: Coordinate): number;
  /** Each leg's distance, in metres, in the order the points were marked. */
  legs(points: readonly Coordinate[]): number[];
  /** The whole route's distance, in metres. */
  total(points: readonly Coordinate[]): number;
  /** A distance the way people read it: metres up to a kilometre, kilometres after. */
  format(metres: number, locale: string): string;
}
