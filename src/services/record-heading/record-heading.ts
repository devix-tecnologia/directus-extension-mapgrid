import type { ScreenPoint } from '../current-point/index';
import type { Coordinate } from '../item-geometry/index';
import type { HeadingSource, IRecordHeading } from './record-heading.types';

export const HEADING_SOURCES: readonly HeadingSource[] = ['off', 'field', 'computed'];

export const DEFAULT_HEADING_SOURCE: HeadingSource = 'off';

/** Below this, two projected points are the same pixel and say nothing about a direction. */
const MIN_SCREEN_DISTANCE = 0.5;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;
const normalise = (degrees: number): number => ((degrees % 360) + 360) % 360;

export class RecordHeading implements IRecordHeading {
  azimuth(from: Coordinate, to: Coordinate): number | null {
    if (from[0] === to[0] && from[1] === to[1]) return null;

    const [lng1, lat1] = [toRadians(from[0]), toRadians(from[1])];
    const [lng2, lat2] = [toRadians(to[0]), toRadians(to[1])];
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    return normalise(toDegrees(Math.atan2(y, x)));
  }

  fromField(value: unknown): number | null {
    const degrees = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof degrees !== 'number' || !Number.isFinite(degrees)) return null;
    return normalise(degrees);
  }

  screenAngle(from: ScreenPoint, to: ScreenPoint): number | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.hypot(dx, dy) < MIN_SCREEN_DISTANCE) return null;
    // atan2 of (east, north): the pane's y grows downwards
    return normalise(toDegrees(Math.atan2(dx, -dy)));
  }

  onScreen(heading: number, cameraBearing: number): number {
    return normalise(heading - cameraBearing);
  }

  sourceFrom(value: unknown): HeadingSource {
    return HEADING_SOURCES.includes(value as HeadingSource)
      ? (value as HeadingSource)
      : DEFAULT_HEADING_SOURCE;
  }
}
