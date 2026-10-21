import type { Coordinate } from '../item-geometry/index';
import type { IDistanceMeasure } from './distance-measure.types';

/** The mean radius, the one the haversine is usually taken with. */
export const EARTH_RADIUS_METRES = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export class DistanceMeasure implements IDistanceMeasure {
  between(from: Coordinate, to: Coordinate): number {
    const lat1 = toRadians(from[1]);
    const lat2 = toRadians(to[1]);
    const dLat = lat2 - lat1;
    const dLng = toRadians(to[0] - from[0]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  legs(points: readonly Coordinate[]): number[] {
    const legs: number[] = [];
    for (let index = 1; index < points.length; index += 1) {
      legs.push(this.between(points[index - 1] as Coordinate, points[index] as Coordinate));
    }
    return legs;
  }

  total(points: readonly Coordinate[]): number {
    return this.legs(points).reduce((sum, leg) => sum + leg, 0);
  }

  format(metres: number, locale: string): string {
    if (metres < 1_000) {
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(metres)} m`;
    }
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(metres / 1_000)} km`;
  }
}
