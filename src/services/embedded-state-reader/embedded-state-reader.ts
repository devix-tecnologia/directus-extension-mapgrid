import type { IEmbeddedStateReader } from './embedded-state-reader.types';

/**
 * State keys the composition must never read. Their getters call `useI18n()`,
 * which throws when Vue re-evaluates them outside a render, and that throw stops
 * the composition from repainting. `showingCount` is rebuilt from `itemCount`
 * and `totalCount` in `src/index.ts`.
 */
export const KEYS_THAT_THROW_OUTSIDE_RENDER = ['showingCount'];

export class EmbeddedStateReader implements IEmbeddedStateReader {
  read(state?: Record<string, unknown> | null): Record<string, unknown> {
    if (!state) return {};

    const read: Record<string, unknown> = {};
    for (const key of Object.keys(state)) {
      if (KEYS_THAT_THROW_OUTSIDE_RENDER.includes(key)) continue;
      read[key] = state[key];
    }
    return read;
  }
}
