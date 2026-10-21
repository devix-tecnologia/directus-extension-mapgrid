import type { ClockTimers, IPlaybackClock } from './playback-clock.types';

const GLOBAL_TIMERS: ClockTimers = {
  set: (task, delayMs) => setTimeout(task, delayMs),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export class PlaybackClock implements IPlaybackClock {
  private handle: unknown = null;
  private isRunning = false;

  /**
   * @param nextWaitMs the wait before the next beat, read when it is scheduled
   * @param onBeat the step; it may stop the clock, and then nothing more is scheduled
   */
  constructor(
    private readonly nextWaitMs: () => number,
    private readonly onBeat: () => void,
    private readonly timers: ClockTimers = GLOBAL_TIMERS
  ) {}

  get running(): boolean {
    return this.isRunning;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.schedule();
  }

  stop(): void {
    this.isRunning = false;
    this.cancel();
  }

  restart(): void {
    if (!this.isRunning) return;
    this.cancel();
    this.schedule();
  }

  private schedule(): void {
    this.handle = this.timers.set(() => {
      this.handle = null;
      this.onBeat();
      if (this.isRunning && this.handle === null) this.schedule();
    }, this.nextWaitMs());
  }

  private cancel(): void {
    if (this.handle !== null) this.timers.clear(this.handle);
    this.handle = null;
  }
}
