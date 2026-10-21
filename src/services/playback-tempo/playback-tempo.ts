import type { IPlaybackTempo, PlaybackTiming, TempoOptions } from './playback-tempo.types';

/** Each step starts a camera animation that takes about this long. */
export const TEMPO_FLOOR_MS = 1_000;
export const TEMPO_FLOOR_WITHOUT_CAMERA_MS = 200;
/** Otherwise one record a day becomes a day's wait. */
export const TEMPO_CEILING_MS = 10_000;

export const PLAYBACK_SPEEDS: readonly number[] = [1, 2, 10, 60, 300, 600];
export const DEFAULT_PLAYBACK_SPEED = 60;

export const PLAYBACK_TIMINGS: readonly PlaybackTiming[] = ['fixed', 'realtime'];
export const DEFAULT_PLAYBACK_TIMING: PlaybackTiming = 'fixed';

export class PlaybackTempo implements IPlaybackTempo {
  waitMs(from: number | null, to: number | null, options: TempoOptions): number {
    const floor = options.cameraMoves ? TEMPO_FLOOR_MS : TEMPO_FLOOR_WITHOUT_CAMERA_MS;
    if (from === null || to === null || !Number.isFinite(from) || !Number.isFinite(to)) {
      return floor;
    }

    const speed = options.speed > 0 ? options.speed : DEFAULT_PLAYBACK_SPEED;
    const scaled = Math.abs(to - from) / speed;
    return Math.min(TEMPO_CEILING_MS, Math.max(floor, scaled));
  }

  medianDelta(instants: readonly (number | null)[]): number | null {
    const deltas: number[] = [];
    for (let index = 1; index < instants.length; index += 1) {
      const before = instants[index - 1];
      const after = instants[index];
      if (typeof before === 'number' && typeof after === 'number') {
        deltas.push(Math.abs(after - before));
      }
    }
    if (deltas.length === 0) return null;

    deltas.sort((a, b) => a - b);
    const middle = Math.floor(deltas.length / 2);
    return deltas.length % 2 === 1
      ? (deltas[middle] as number)
      : ((deltas[middle - 1] as number) + (deltas[middle] as number)) / 2;
  }

  timingFrom(value: unknown): PlaybackTiming {
    return PLAYBACK_TIMINGS.includes(value as PlaybackTiming)
      ? (value as PlaybackTiming)
      : DEFAULT_PLAYBACK_TIMING;
  }

  speedFrom(value: unknown): number {
    return typeof value === 'number' && PLAYBACK_SPEEDS.includes(value)
      ? value
      : DEFAULT_PLAYBACK_SPEED;
  }
}
