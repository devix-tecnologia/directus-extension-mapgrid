import type { HeadingSource } from '../../contract/index';
import type { ScreenPoint } from '../current-point/index';
import type { Coordinate } from '../item-geometry/index';

export type { HeadingSource };

/** Where the current record is heading, in degrees clockwise from north. */
export interface IRecordHeading {
  /** The great-circle bearing from one position to the next; `null` when they coincide. */
  azimuth(from: Coordinate, to: Coordinate): number | null;
  /** A course read from the data, normalised into `[0, 360)`; `null` when it is not a number. */
  fromField(value: unknown): number | null;
  /** The angle to draw between two projected points, clockwise from the top of the pane. */
  screenAngle(from: ScreenPoint, to: ScreenPoint): number | null;
  /** A geographic heading turned into the angle to draw, discounting the camera's rotation. */
  onScreen(heading: number, cameraBearing: number): number;
  /** Reads the source back from the preset, which can hold anything. */
  sourceFrom(value: unknown): HeadingSource;
}
