import type { CenteringOptions } from '../map-centerer/index';

/**
 * How much the camera chases the current record.
 *
 * Navigation apps call this *follow mode*; the name "autofocus" was dropped on
 * purpose, because in photography it is lens sharpness, not framing.
 */
export type CameraTracking = 'off' | 'follow' | 'center';

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
