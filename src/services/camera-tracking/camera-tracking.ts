import type { CenteringOptions } from '../map-centerer/index';
import type { CameraTracking, FramingChoice, ICameraTrackingPolicy } from './camera-tracking.types';

/** The order the single control walks through. */
export const CAMERA_TRACKING_ORDER: readonly CameraTracking[] = ['off', 'follow', 'center'];

export const DEFAULT_CAMERA_TRACKING: CameraTracking = 'follow';

export class CameraTrackingPolicy implements ICameraTrackingPolicy {
  framing(tracking: CameraTracking, choice: FramingChoice): CenteringOptions | null {
    if (tracking === 'off') return null;
    return { onlyIfOutside: tracking === 'follow', zoomIn: choice.zoomIn };
  }

  cycle(tracking: CameraTracking): CameraTracking {
    const at = CAMERA_TRACKING_ORDER.indexOf(tracking);
    return CAMERA_TRACKING_ORDER[(at + 1) % CAMERA_TRACKING_ORDER.length] as CameraTracking;
  }

  from(value: unknown): CameraTracking {
    return CAMERA_TRACKING_ORDER.includes(value as CameraTracking)
      ? (value as CameraTracking)
      : DEFAULT_CAMERA_TRACKING;
  }
}
