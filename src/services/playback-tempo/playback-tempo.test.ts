import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAYBACK_SPEED,
  PlaybackTempo,
  TEMPO_CEILING_MS,
  TEMPO_FLOOR_MS,
  TEMPO_FLOOR_WITHOUT_CAMERA_MS,
} from './playback-tempo';

const tempo = new PlaybackTempo();
const MINUTE = 60_000;
const withCamera = { cameraMoves: true, speed: 60 };

describe('PlaybackTempo — the wait between two instants', () => {
  it('speeds the data clock up: a minute at 60× is a second, five minutes are five', () => {
    expect(tempo.waitMs(0, MINUTE, withCamera)).toBe(1_000);
    expect(tempo.waitMs(0, 5 * MINUTE, withCamera)).toBe(5_000);
  });

  it('keeps the proportion between unequal gaps', () => {
    const short = tempo.waitMs(0, 2 * MINUTE, withCamera);
    const long = tempo.waitMs(0, 8 * MINUTE, withCamera);

    expect(long / short).toBe(4);
  });

  it('never goes under the floor, which drops when the camera stays put', () => {
    expect(tempo.waitMs(0, 1_000, withCamera)).toBe(TEMPO_FLOOR_MS);
    expect(tempo.waitMs(0, 1_000, { cameraMoves: false, speed: 60 })).toBe(
      TEMPO_FLOOR_WITHOUT_CAMERA_MS
    );
  });

  it('never goes over the ceiling', () => {
    expect(tempo.waitMs(0, 24 * 60 * MINUTE, withCamera)).toBe(TEMPO_CEILING_MS);
  });

  it('lands on the floor for a zero or unknown gap', () => {
    expect(tempo.waitMs(5, 5, withCamera)).toBe(TEMPO_FLOOR_MS);
    expect(tempo.waitMs(null, MINUTE, withCamera)).toBe(TEMPO_FLOOR_MS);
    expect(tempo.waitMs(0, Number.NaN, withCamera)).toBe(TEMPO_FLOOR_MS);
  });

  it('counts a descending sort by the size of the gap', () => {
    expect(tempo.waitMs(5 * MINUTE, 0, withCamera)).toBe(5_000);
  });
});

describe('PlaybackTempo — the typical gap of a page', () => {
  it('is the median, so one long stop does not set the pace', () => {
    expect(tempo.medianDelta([0, MINUTE, 2 * MINUTE, 3 * MINUTE, 60 * MINUTE])).toBe(MINUTE);
  });

  it('averages the two middle gaps of an even count, and skips unknown instants', () => {
    expect(tempo.medianDelta([0, 2, 6, null, 7])).toBe(3);
  });

  it('has no answer without two consecutive instants', () => {
    expect(tempo.medianDelta([1])).toBeNull();
    expect(tempo.medianDelta([1, null, 3])).toBeNull();
  });
});

describe('PlaybackTempo — what the preset gives back', () => {
  it('reads the timing and falls back to fixed', () => {
    expect(tempo.timingFrom('realtime')).toBe('realtime');
    expect(tempo.timingFrom('warp')).toBe('fixed');
  });

  it('reads a speed it offers and falls back otherwise', () => {
    expect(tempo.speedFrom(10)).toBe(10);
    expect(tempo.speedFrom(7)).toBe(DEFAULT_PLAYBACK_SPEED);
    expect(tempo.speedFrom('60')).toBe(DEFAULT_PLAYBACK_SPEED);
  });
});
