import type { CameraTracking } from '../../contract/index';
import type { CenteringOptions } from '../map-centerer/index';

export type { CameraTracking };

/** Whether focusing a record also zooms in — orthogonal to whether the camera moves. */
export interface FramingChoice {
  zoomIn: boolean;
}

/** Turns the tracking state into what the map centerer is asked for. */
export interface ICameraTrackingPolicy {
  /** `null` when the camera is to be left where the person put it. */
  framing(tracking: CameraTracking, choice: FramingChoice): CenteringOptions | null;
  /** The next state of the single control that cycles through the three. */
  cycle(tracking: CameraTracking): CameraTracking;
  /** Reads the state back from the preset, which can hold anything. */
  from(value: unknown): CameraTracking;
}
