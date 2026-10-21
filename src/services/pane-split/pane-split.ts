import type { IPaneSplit } from './pane-split.types';

export const DEFAULT_MAP_SHARE = 0.6;
export const MIN_MAP_SHARE = 0.25;
export const MAX_MAP_SHARE = 0.85;
export const MAP_SHARE_STEP = 0.05;

const clamp = (share: number): number => Math.min(MAX_MAP_SHARE, Math.max(MIN_MAP_SHARE, share));

export class PaneSplit implements IPaneSplit {
  from(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? clamp(value) : DEFAULT_MAP_SHARE;
  }

  atPointer(pointerY: number, top: number, height: number): number {
    if (!(height > 0)) return DEFAULT_MAP_SHARE;
    return clamp((pointerY - top) / height);
  }

  step(share: number, direction: 1 | -1): number {
    // rounded, so a few steps do not leave 0.6000000000000001 in the preset
    return clamp(Math.round((share + direction * MAP_SHARE_STEP) * 100) / 100);
  }
}
