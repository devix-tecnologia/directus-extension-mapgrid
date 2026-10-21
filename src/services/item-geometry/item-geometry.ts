import type { Coordinate, IItemGeometry } from './item-geometry.types';

export class ItemGeometry implements IItemGeometry {
  pointsOf(geometry: unknown): Coordinate[] {
    const coordinates = (geometry as { coordinates?: unknown } | null | undefined)?.coordinates;
    const points: Coordinate[] = [];
    const visit = (value: unknown): boolean => {
      if (!Array.isArray(value)) return false;
      if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        const [lng, lat] = value as Coordinate;
        if (
          !Number.isFinite(lng) ||
          !Number.isFinite(lat) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180
        ) {
          return false;
        }
        points.push([lng, lat]);
        return true;
      }
      return value.every(visit);
    };
    return visit(coordinates) ? points : [];
  }

  centreOf(points: readonly Coordinate[]): Coordinate | null {
    if (points.length === 0) return null;
    const lngs = points.map((point) => point[0]);
    const lats = points.map((point) => point[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
  }
}
