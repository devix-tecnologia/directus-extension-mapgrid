import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaybackClock } from './playback-clock';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PlaybackClock', () => {
  it('beats after each wait, reading a new wait every time', () => {
    const waits = [1_000, 3_000, 2_000];
    const beat = vi.fn();
    const clock = new PlaybackClock(() => waits.shift() ?? 10_000, beat);

    clock.start();
    vi.advanceTimersByTime(999);
    expect(beat).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(beat).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_999);
    expect(beat).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(beat).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(2_000);
    expect(beat).toHaveBeenCalledTimes(3);
  });

  it('stops for good when the beat stops it', () => {
    let clock: PlaybackClock | null = null;
    const beat = vi.fn(() => clock?.stop());
    clock = new PlaybackClock(() => 1_000, beat);

    clock.start();
    vi.advanceTimersByTime(10_000);

    expect(beat).toHaveBeenCalledTimes(1);
    expect(clock.running).toBe(false);
  });

  it('measures the next wait from the restart', () => {
    const beat = vi.fn();
    const clock = new PlaybackClock(() => 2_000, beat);

    clock.start();
    vi.advanceTimersByTime(1_500);
    clock.restart();
    vi.advanceTimersByTime(1_500);
    expect(beat).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(beat).toHaveBeenCalledTimes(1);
  });

  it('does nothing on a restart while stopped, and starts only once', () => {
    const beat = vi.fn();
    const clock = new PlaybackClock(() => 1_000, beat);

    clock.restart();
    vi.advanceTimersByTime(5_000);
    expect(beat).not.toHaveBeenCalled();

    clock.start();
    clock.start();
    vi.advanceTimersByTime(1_000);
    expect(beat).toHaveBeenCalledTimes(1);
  });
});
